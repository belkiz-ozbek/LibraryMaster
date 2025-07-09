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
import { books, borrowings, users } from "@shared/schema";
import { sendVerificationEmail, generateVerificationToken } from "./emailService";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      const { identifier, password } = req.body;
      if (!identifier || !password) {
        return res.status(400).json({ message: "Kullanıcı adı/e-posta ve şifre zorunlu" });
      }
      // Kullanıcıyı username veya email ile bul
      let user = null;
      if (identifier.includes("@")) {
        user = await storage.getUserByEmail(identifier);
      } else {
        user = await storage.getUserByUsername(identifier);
      }
      if (!user) {
        return res.status(401).json({ message: "Geçersiz kullanıcı adı/e-posta veya şifre" });
      }
      const validPassword = await bcrypt.compare(password, user.password || '');
      if (!validPassword) {
        return res.status(401).json({ message: "Geçersiz kullanıcı adı/e-posta veya şifre" });
      }
      if (!user.emailVerified) {
        return res.status(401).json({ 
          message: "Lütfen e-posta adresinizi doğrulayın. Gelen kutunuzu kontrol edin.",
          emailNotVerified: true 
        });
      }
      req.session.userId = user.id;
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Giriş başarısız" });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { name, username, email, password } = req.body;
      
      // Validate required fields
      if (!name || !username || !email || !password) {
        return res.status(400).json({ message: "Name, username, email, and password are required" });
      }
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Bu e-posta adresi zaten kayıtlı. Lütfen farklı bir e-posta adresi kullanın." });
      }
      
      // Check if username already exists
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "This username is already taken" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Generate verification token
      const verificationToken = generateVerificationToken();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 saat
      
      // Create new user with verification fields
      const newUser = await storage.createUser({
        name: name.trim(),
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        isAdmin: false, // Default to regular user
        membershipDate: new Date(),
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires
      });
      
      // Send verification email
      try {
        await sendVerificationEmail(email, name.trim(), verificationToken);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Email gönderilemese bile kullanıcıyı oluştur, ama uyarı ver
        return res.status(201).json({ 
          message: "Account created but verification email could not be sent. Please contact support.",
          user: { id: newUser.id, name: newUser.name, email: newUser.email, emailVerified: false }
        });
      }
      
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json({ 
        message: "Account created successfully. Please check your email to verify your account.",
        user: userWithoutPassword 
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      console.log("[VERIFY-EMAIL] Token from URL:", token);
      if (!token || typeof token !== 'string') {
        console.log("[VERIFY-EMAIL] Invalid token format");
        return res.sendFile(path.join(__dirname, "error.html"));
      }
      // Token ile kullanıcıyı bul
      const [user] = await db.select().from(users).where(eq(users.emailVerificationToken, token));
      console.log("[VERIFY-EMAIL] User found for token:", user);
      if (!user) {
        console.log("[VERIFY-EMAIL] No user found for token");
        return res.sendFile(path.join(__dirname, "error.html"));
      }
      // Token'ın süresi dolmuş mu kontrol et
      console.log("[VERIFY-EMAIL] Token expires at:", user.emailVerificationExpires, "Current time:", new Date());
      if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
        console.log("[VERIFY-EMAIL] Token expired");
        return res.sendFile(path.join(__dirname, "error.html"));
      }
      // Email'i doğrula
      await db.update(users)
        .set({ 
          emailVerified: true, 
          emailVerificationToken: null, 
          emailVerificationExpires: null 
        })
        .where(eq(users.id, user.id));
      console.log("[VERIFY-EMAIL] Email verified for user id:", user.id);
      // Başarılıysa success.html göster
      return res.sendFile(path.join(__dirname, "success.html"));
    } catch (error) {
      console.error("[VERIFY-EMAIL] Email verification error:", error);
      res.sendFile(path.join(__dirname, "error.html"));
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

  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }
      // Generate new token and expiry
      const verificationToken = generateVerificationToken();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 saat
      // Update user in DB
      await db.update(users)
        .set({
          emailVerificationToken: verificationToken,
          emailVerificationExpires: verificationExpires
        })
        .where(eq(users.id, user.id));
      // Send email
      try {
        await sendVerificationEmail(user.email ?? "", user.name ?? "", verificationToken);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        return res.status(500).json({ message: "Failed to send verification email" });
      }
      res.json({ message: "Verification email sent successfully" });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Failed to resend verification email" });
    }
  });

  // User routes
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const { page, limit } = req.query;
      
      if (page || limit) {
        // Paginated response
        const paginationParams = {
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 10,
        };
        
        const result = await storage.getAllUsersPaginated(paginationParams);
        res.json(result);
      } else {
        // Non-paginated response (backward compatibility)
        const users = await storage.getAllUsers();
        const usersWithoutPasswords = users.map(({ password, ...user }) => user);
        res.json(usersWithoutPasswords);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/search", requireAuth, async (req, res) => {
    try {
      const { q = "", page, limit } = req.query;
      const paginationParams = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      };
      const result = await storage.searchUsersPaginated(q as string, paginationParams);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/users/:id/borrowings", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { page, limit } = req.query;
      
      if (page || limit) {
        // Paginated response
        const paginationParams = {
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 10,
        };
        
        const result = await storage.getUserBorrowingsPaginated(id, paginationParams);
        res.json(result);
      } else {
        // Non-paginated response (backward compatibility)
        const userBorrowings = await db
          .select({
            id: borrowings.id,
            bookId: borrowings.bookId,
            userId: borrowings.userId,
            borrowDate: borrowings.borrowDate,
            dueDate: borrowings.dueDate,
            returnDate: borrowings.returnDate,
            status: borrowings.status,
            extensionRequested: borrowings.extensionRequested,
            notes: borrowings.notes,
            book: {
              id: books.id,
              title: books.title,
              author: books.author,
              isbn: books.isbn,
              genre: books.genre,
              publishYear: books.publishYear,
              shelfNumber: books.shelfNumber,
              availableCopies: books.availableCopies,
              totalCopies: books.totalCopies,
              pageCount: books.pageCount,
              createdAt: books.createdAt,
            },
            user: {
              id: sql`${id}`,
              name: sql`(SELECT name FROM users WHERE id = ${id})`,
              email: sql`(SELECT email FROM users WHERE id = ${id})`,
            },
          })
          .from(borrowings)
          .innerJoin(books, eq(borrowings.bookId, books.id))
          .where(eq(borrowings.userId, id))
          .orderBy(desc(borrowings.borrowDate));
        
        res.json(userBorrowings);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user borrowings" });
    }
  });

  app.post("/api/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Admin validasyonu - admin ise email ve şifre zorunlu
      if (userData.isAdmin) {
        if (!userData.email || userData.email.trim() === '') {
          return res.status(400).json({ message: "Admin kullanıcılar için e-posta adresi zorunludur" });
        }
        if (!userData.password || userData.password.trim() === '') {
          return res.status(400).json({ message: "Admin kullanıcılar için şifre zorunludur" });
        }
      }
      
      // Email varsa benzersizlik kontrolü yap
      if (userData.email) {
        const existingUser = await storage.getUserByEmail(userData.email);
        if (existingUser) {
          return res.status(400).json({ message: "Bu e-posta adresi zaten kullanılıyor. Lütfen farklı bir e-posta adresi girin." });
        }
      }
      
      // Hash password if provided
      let userToCreate = { ...userData };
      if (userData.password) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        userToCreate.password = hashedPassword;
      }
      
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
      
      // Mevcut kullanıcıyı al
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Admin validasyonu - admin ise email ve şifre zorunlu
      const willBeAdmin = userData.isAdmin !== undefined ? userData.isAdmin : existingUser.isAdmin;
      if (willBeAdmin) {
        const email = userData.email !== undefined ? userData.email : existingUser.email;
        const password = userData.password !== undefined ? userData.password : existingUser.password;
        
        if (!email || email.trim() === '') {
          return res.status(400).json({ message: "Admin kullanıcılar için e-posta adresi zorunludur" });
        }
        if (!password || password.trim() === '') {
          return res.status(400).json({ message: "Admin kullanıcılar için şifre zorunludur" });
        }
      }
      
      // Email varsa benzersizlik kontrolü yap
      if (userData.email) {
        const userWithEmail = await storage.getUserByEmail(userData.email);
        if (userWithEmail && userWithEmail.id !== id) {
          return res.status(400).json({ message: "Bu e-posta adresi zaten kullanılıyor. Lütfen farklı bir e-posta adresi girin." });
        }
      }
      
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
      const { page, limit } = req.query;
      
      if (page || limit) {
        // Paginated response
        const paginationParams = {
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 10,
        };
        
        const result = await storage.getRecentActivitiesPaginated(paginationParams);
        res.json(result);
      } else {
        // Non-paginated response (backward compatibility)
        const activities = await storage.getRecentActivities();
        res.json(activities);
      }
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
      const { page, limit } = req.query;
      
      if (page || limit) {
        // Paginated response
        const paginationParams = {
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 10,
        };
        
        const result = await storage.getAllBooksPaginated(paginationParams);
        res.json(result);
      } else {
        // Non-paginated response (backward compatibility)
        const books = await storage.getAllBooks();
        res.json(books);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  app.get("/api/books/search", requireAuth, async (req, res) => {
    try {
      const { q, page, limit } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query required" });
      }
      
      if (page || limit) {
        // Paginated response
        const paginationParams = {
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 10,
        };
        
        const result = await storage.searchBooksPaginated(q, paginationParams);
        res.json(result);
      } else {
        // Non-paginated response (backward compatibility)
        const books = await storage.searchBooks(q);
        res.json(books);
      }
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
      console.log("Parsed book data:", bookData);
      let normalizedBookData = { ...bookData };
      if (typeof normalizedBookData.isbn === 'string' && normalizedBookData.isbn.trim() === "") {
        normalizedBookData.isbn = null;
      }
      const book = await storage.createBook(normalizedBookData);
      console.log("Created book:", book);
      res.status(201).json(book);
    } catch (error) {
      console.error("Error creating book:", error);
      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid book data", errors: error.errors });
      }
      // Duplicate ISBN için özel hata mesajı
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === '23505' &&
        req.body.isbn && req.body.isbn.trim() !== ""
      ) {
        return res.status(400).json({ message: "Bu ISBN ile zaten bir kitap mevcut. Lütfen farklı bir ISBN girin veya ISBN alanını boş bırakın." });
      }
      res.status(500).json({ message: "Kitap kaydedilirken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin veya yöneticinize başvurun." });
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
      res.json({ message: "Kitap başarıyla silindi" });
    } catch (error) {
      const errorMessage = (error as Error).message;
      // Eğer kitap aktif ödünç alma kaydı varsa 400 hatası döndür
      if (errorMessage.includes("ödünç alınmış durumda")) {
        res.status(400).json({ message: errorMessage });
      } else {
        res.status(404).json({ message: errorMessage });
      }
    }
  });

  // Borrowing routes
  const borrowingSchema = insertBorrowingSchema.extend({
    borrowDate: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
  });

  app.get("/api/borrowings", requireAuth, async (req, res) => {
    try {
      const { page, limit } = req.query;
      
      if (page || limit) {
        // Paginated response
        const paginationParams = {
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 10,
        };
        
        const result = await storage.getAllBorrowingsPaginated(paginationParams);
        res.json(result);
      } else {
        // Non-paginated response (backward compatibility)
        const borrowings = await storage.getAllBorrowings();
        res.json(borrowings);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch borrowings" });
    }
  });

  app.get("/api/borrowings/search", requireAuth, async (req, res) => {
    try {
      const q = (req.query.q as string)?.toLocaleLowerCase('tr-TR').trim() || "";
      if (!q) {
        return res.json([]);
      }
      const all = await storage.getAllBorrowings();
      const filtered = all.filter(b =>
        (b.book?.title?.toLocaleLowerCase('tr-TR') || "").includes(q) ||
        (b.book?.author?.toLocaleLowerCase('tr-TR') || "").includes(q) ||
        (b.book?.isbn?.toLocaleLowerCase('tr-TR') || "").includes(q) ||
        (b.user?.name?.toLocaleLowerCase('tr-TR') || "").includes(q) ||
        (b.user?.email?.toLocaleLowerCase('tr-TR') || "").includes(q)
      );
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ message: "Failed to search borrowings" });
    }
  });

  app.get("/api/borrowings/active", requireAuth, async (req, res) => {
    try {
      const { page, limit } = req.query;
      
      if (page || limit) {
        // Paginated response
        const paginationParams = {
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 10,
        };
        
        const result = await storage.getActiveBorrowingsPaginated(paginationParams);
        res.json(result);
      } else {
        // Non-paginated response (backward compatibility)
        const borrowings = await storage.getActiveBorrowings();
        res.json(borrowings);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active borrowings" });
    }
  });

  app.get("/api/borrowings/active/search", requireAuth, async (req, res) => {
    try {
      const q = (req.query.q as string)?.toLocaleLowerCase('tr-TR').trim() || "";
      if (!q) {
        return res.json([]);
      }
      const all = await storage.getActiveBorrowings();
      const filtered = all.filter(b =>
        (b.book?.title?.toLocaleLowerCase('tr-TR') || "").includes(q) ||
        (b.book?.author?.toLocaleLowerCase('tr-TR') || "").includes(q) ||
        (b.book?.isbn?.toLocaleLowerCase('tr-TR') || "").includes(q) ||
        (b.user?.name?.toLocaleLowerCase('tr-TR') || "").includes(q) ||
        (b.user?.email?.toLocaleLowerCase('tr-TR') || "").includes(q)
      );
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ message: "Failed to search active borrowings" });
    }
  });

  app.get("/api/borrowings/overdue", requireAuth, async (req, res) => {
    try {
      const { page, limit } = req.query;
      console.log("Overdue borrowings request - page:", page, "limit:", limit);
      
      if (page || limit) {
        // Paginated response
        const paginationParams = {
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 10,
        };
        
        console.log("Getting overdue borrowings with pagination:", paginationParams);
        const result = await storage.getOverdueBorrowingsPaginated(paginationParams);
        console.log("Overdue borrowings result:", result);
        res.json(result);
      } else {
        // Non-paginated response (backward compatibility)
        const overdueBorrowings = await storage.getOverdueBorrowings();
        res.json(overdueBorrowings);
      }
    } catch (error) {
      console.error("Error fetching overdue borrowings:", error);
      res.status(500).json({ message: "Failed to fetch overdue borrowings" });
    }
  });

  app.get("/api/borrowings/returned", requireAuth, async (req, res) => {
    try {
      const { page, limit } = req.query;
      if (page || limit) {
        const paginationParams = {
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 10,
        };
        const result = await storage.getReturnedBorrowingsPaginated(paginationParams);
        res.json(result);
      } else {
        const borrowings = await storage.getReturnedBorrowings();
        res.json(borrowings);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch returned borrowings" });
    }
  });

  app.post("/api/borrowings", requireAuth, async (req, res) => {
    try {
      const borrowingData = borrowingSchema.parse(req.body);
      // Check if book is available
      const book = await storage.getBook(borrowingData.bookId);
      if (!book) {
        return res.status(400).json({ message: "Kitap bulunamadı.", reason: "book_not_found" });
      }
      if (book.availableCopies <= 0) {
        return res.status(400).json({ message: "Kitabın ödünç verilebilir kopyası yok.", reason: "no_available_copies" });
      }
      const borrowing = await storage.createBorrowing(borrowingData);
      res.status(201).json(borrowing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Geçersiz ödünç alma verisi.", reason: "zod_validation", errors: error.errors });
      }
      res.status(500).json({ message: "Ödünç alma işlemi sırasında sunucu hatası oluştu.", reason: (error as Error).message, stack: (error as Error).stack });
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

      console.error(error); // Hata detaylarını terminale yazdır
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
      const { page, limit } = req.query;
      
      if (page || limit) {
        // Paginated response
        const paginationParams = {
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 10,
        };
        
        const result = await storage.getMostBorrowedBooksPaginated(paginationParams);
        res.json(result);
      } else {
        // Non-paginated response (backward compatibility)
        const books = await storage.getMostBorrowedBooks();
        res.json(books);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch popular books" });
    }
  });

  app.get("/api/stats/active-users", requireAuth, async (req, res) => {
    try {
      const { page, limit } = req.query;
      
      if (page || limit) {
        // Paginated response
        const paginationParams = {
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 10,
        };
        
        const result = await storage.getMostActiveUsersPaginated(paginationParams);
        const usersWithoutPasswords = {
          ...result,
          data: result.data.map(({ password, ...user }) => user)
        };
        res.json(usersWithoutPasswords);
      } else {
        // Non-paginated response (backward compatibility)
        const users = await storage.getMostActiveUsers();
        const usersWithoutPasswords = users.map(({ password, ...user }) => user);
        res.json(usersWithoutPasswords);
      }
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
      // Gün kısaltmaları - dil desteği için frontend'den alınacak
      const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dayKey = days[d.getDay() === 0 ? 6 : d.getDay() - 1];
        const dateStr = d.toISOString().split("T")[0];
        // Borrowed
        const [{ count: borrowed }] = await db
          .select({ count: count() })
          .from(borrowings)
          .where(sql`to_char(${borrowings.borrowDate}, 'YYYY-MM-DD') = ${dateStr}`);
        // Returned
        const [{ count: returned }] = await db
          .select({ count: count() })
          .from(borrowings)
          .where(sql`to_char(${borrowings.returnDate}, 'YYYY-MM-DD') = ${dateStr}`);
        result.push({ day: dayKey, borrowed, returned });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weekly activity" });
    }
  });

  // Gün kısaltmaları endpoint'i
  app.get("/api/translations/days", (req, res) => {
    const days = {
      tr: {
        mon: "Pzt",
        tue: "Sal", 
        wed: "Çar",
        thu: "Per",
        fri: "Cum",
        sat: "Cmt",
        sun: "Paz"
      },
      en: {
        mon: "Mon",
        tue: "Tue",
        wed: "Wed", 
        thu: "Thu",
        fri: "Fri",
        sat: "Sat",
        sun: "Sun"
      }
    };
    res.json(days);
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

  // Gelişmiş aktivite feed endpoint'i
  app.get("/api/activities/feed", requireAuth, async (req, res) => {
    try {
      const { page, limit } = req.query;
      
      if (page || limit) {
        // Paginated response
        const paginationParams = {
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 10,
        };
        
        const result = await storage.getActivityFeedPaginated(paginationParams);
        res.json(result);
      } else {
        // Non-paginated response (backward compatibility)
        const activities = await storage.getActivityFeed();
        res.json(activities);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity feed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
