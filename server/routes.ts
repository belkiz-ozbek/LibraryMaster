import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { insertUserSchema, insertBookSchema, insertBorrowingSchema, updateUserSchema, updateBookSchema, updateBorrowingSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import "./types";
import { and, eq, desc, gt, gte, isNotNull, lte, sql, count } from "drizzle-orm";
import { db } from "./db";
import { books, borrowings } from "@shared/schema";

// Auth middleware
function requireAuth(req: any, res: any, next: any) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  storage.getUser(req.session.userId)
    .then(user => {
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      req.user = user;
      next();
    })
    .catch(next);
}

const requireAdmin = async (req: any, res: any, next: any) => {
  // Temporarily bypass admin check
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Session setup
  app.use(session({
    secret: process.env.SESSION_SECRET || 'library-management-secret',
    resave: true,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    }
  }));

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      req.session.userId = user.id;
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  });

  // User routes
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/search", requireAuth, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query required" });
      }
      
      const users = await storage.searchUsers(q);
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUserWithBorrowings(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const userToCreate = { ...userData, password: hashedPassword };
      
      const user = await storage.createUser(userToCreate);
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = updateUserSchema.parse(req.body);
      
      // Hash password if provided
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      
      const user = await storage.updateUser(id, userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(404).json({ message: (error as Error).message });
    }
  });

  app.get("/api/activities/recent", requireAuth, async (req, res) => {
    try {
      const activities = await storage.getRecentActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent activities" });
    }
  });

  app.get("/api/borrowings/overdue", requireAuth, async (req, res) => {
    try {
      const overdueBorrowings = await storage.getOverdueBorrowings();
      res.json(overdueBorrowings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch overdue borrowings" });
    }
  });

  // Book routes
  app.get("/api/books", requireAuth, async (req, res) => {
    try {
      const books = await storage.getAllBooks();
      res.json(books);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  app.get("/api/books/search", requireAuth, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query required" });
      }
      
      const books = await storage.searchBooks(q);
      res.json(books);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  app.get("/api/books/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const book = await storage.getBookWithBorrowings(id);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      res.json(book);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch book" });
    }
  });

  app.post("/api/books", requireAuth, requireAdmin, async (req, res) => {
    try {
      console.log("Book creation request body:", req.body);
      const bookData = insertBookSchema.parse(req.body);
      if (!bookData.isbn || bookData.isbn.trim() === "") {
        return res.status(400).json({ message: "ISBN alanı boş olamaz ve benzersiz olmalıdır." });
      }
      console.log("Parsed book data:", bookData);
      const book = await storage.createBook(bookData);
      console.log("Created book:", book);
      res.status(201).json(book);
    } catch (error) {
      console.error("Error creating book:", error);
      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid book data", errors: error.errors });
      }
      // Duplicate ISBN için özel hata mesajı
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        return res.status(400).json({ message: "Bu ISBN ile zaten bir kitap mevcut. Lütfen farklı bir ISBN girin." });
      }
      res.status(500).json({ message: "Failed to create book" });
    }
  });

  app.put("/api/books/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const bookData = updateBookSchema.parse(req.body);
      const book = await storage.updateBook(id, bookData);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      res.json(book);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid book data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update book" });
    }
  });

  app.delete("/api/books/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBook(id);
      res.json({ message: "Book deleted successfully" });
    } catch (error) {
      res.status(404).json({ message: (error as Error).message });
    }
  });

  // Borrowing routes
  app.get("/api/borrowings", requireAuth, async (req, res) => {
    try {
      const borrowings = await storage.getAllBorrowings();
      res.json(borrowings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch borrowings" });
    }
  });

  app.get("/api/borrowings/active", requireAuth, async (req, res) => {
    try {
      const borrowings = await storage.getActiveBorrowings();
      res.json(borrowings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active borrowings" });
    }
  });

  app.get("/api/borrowings/overdue", requireAuth, async (req, res) => {
    try {
      const overdueBorrowings = await storage.getOverdueBorrowings();
      res.json(overdueBorrowings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch overdue borrowings" });
    }
  });

  app.post("/api/borrowings", requireAuth, async (req, res) => {
    try {
      const borrowingData = insertBorrowingSchema.parse(req.body);
      
      // Check if book is available
      const book = await storage.getBook(borrowingData.bookId);
      if (!book || book.availableCopies <= 0) {
        return res.status(400).json({ message: "Book not available for borrowing" });
      }
      
      const borrowing = await storage.createBorrowing(borrowingData);
      res.status(201).json(borrowing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid borrowing data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create borrowing" });
    }
  });

  app.put("/api/borrowings/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const borrowingData = updateBorrowingSchema.parse(req.body);
      const borrowing = await storage.updateBorrowing(id, borrowingData);
      if (!borrowing) {
        return res.status(404).json({ message: "Borrowing not found" });
      }
      res.json(borrowing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid borrowing data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update borrowing" });
    }
  });

  app.delete("/api/borrowings/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBorrowing(id);
      res.json({ message: "Borrowing deleted successfully" });
    } catch (error) {
      res.status(404).json({ message: (error as Error).message });
    }
  });

  // Statistics routes
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  app.get("/api/stats/popular-books", requireAuth, async (req, res) => {
    try {
      const books = await storage.getMostBorrowedBooks();
      res.json(books);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch popular books" });
    }
  });

  app.get("/api/stats/active-users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getMostActiveUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active users" });
    }
  });

  app.get("/api/stats/top-readers-month", async (req, res) => {
    const topReaders = await storage.getTopReadersMonth();
    res.json(topReaders);
  });

  // Haftalık ödünç alma ve iade istatistikleri
  app.get("/api/stats/weekly-activity", requireAuth, async (req, res) => {
    try {
      const today = new Date();
      const days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dayLabel = days[d.getDay() === 0 ? 6 : d.getDay() - 1];
        const dateStr = d.toISOString().split("T")[0];
        // Borrowed
        const [{ count: borrowed }] = await db
          .select({ count: count() })
          .from(borrowings)
          .where(eq(borrowings.borrowDate, dateStr));
        // Returned
        const [{ count: returned }] = await db
          .select({ count: count() })
          .from(borrowings)
          .where(eq(borrowings.returnDate, dateStr));
        result.push({ day: dayLabel, borrowed, returned });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weekly activity" });
    }
  });

  // Tür dağılımı
  app.get("/api/stats/genre-distribution", requireAuth, async (req, res) => {
    try {
      const genres = await db
        .select({ name: books.genre, value: count() })
        .from(books)
        .groupBy(books.genre);
      res.json(genres);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch genre distribution" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
