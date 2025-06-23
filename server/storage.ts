import { 
  users, books, borrowings,
  type User, type InsertUser, type UpdateUser,
  type Book, type InsertBook, type UpdateBook,
  type Borrowing, type InsertBorrowing, type UpdateBorrowing,
  type BorrowingWithDetails, type UserWithBorrowings, type BookWithBorrowings
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, like, or, and, count, sql, lt, gte, ilike, isNotNull } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: UpdateUser): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;
  searchUsers(query: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  getUserWithBorrowings(id: number): Promise<UserWithBorrowings | undefined>;

  // Book operations
  getBook(id: number): Promise<Book | undefined>;
  getBookByIsbn(isbn: string): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: number, book: UpdateBook): Promise<Book | undefined>;
  deleteBook(id: number): Promise<void>;
  searchBooks(query: string): Promise<Book[]>;
  getAllBooks(): Promise<Book[]>;
  getBookWithBorrowings(id: number): Promise<BookWithBorrowings | undefined>;

  // Borrowing operations
  getBorrowing(id: number): Promise<Borrowing | undefined>;
  createBorrowing(borrowing: InsertBorrowing): Promise<Borrowing>;
  updateBorrowing(id: number, borrowing: UpdateBorrowing): Promise<Borrowing | undefined>;
  deleteBorrowing(id: number): Promise<void>;
  getAllBorrowings(): Promise<BorrowingWithDetails[]>;
  getActiveBorrowings(): Promise<BorrowingWithDetails[]>;
  getOverdueBorrowings(): Promise<BorrowingWithDetails[]>;
  getUserBorrowings(userId: number): Promise<BorrowingWithDetails[]>;
  getBookBorrowings(bookId: number): Promise<BorrowingWithDetails[]>;
  
  // Statistics
  getStats(): Promise<{
    totalBooks: number;
    totalUsers: number;
    activeBorrowings: number;
    overdueBorrowings: number;
  }>;
  getMostBorrowedBooks(): Promise<Array<Book & { borrowCount: number }>>;
  getMostActiveUsers(): Promise<Array<User & { borrowCount: number }>>;
  getTopReadersMonth(): Promise<Array<{ userId: number; name: string; email: string; totalPagesRead: number }>>;
  getRecentActivities(limit: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updateUser: UpdateUser): Promise<User | undefined> {
    const [user] = await db.update(users).set(updateUser).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<void> {
    const result = await db.delete(users).where(eq(users.id, id));
    if (result.rowCount === 0) {
      throw new Error(`User with id ${id} not found`);
    }
  }

  async searchUsers(query: string): Promise<User[]> {
    return await db.select().from(users).where(
      or(
        like(users.name, `%${query}%`),
        like(users.email, `%${query}%`)
      )
    );
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.name));
  }

  async getUserWithBorrowings(id: number): Promise<UserWithBorrowings | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const userBorrowings = await this.getUserBorrowings(id);
    return { ...user, borrowings: userBorrowings };
  }

  // Book operations
  async getBook(id: number): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.id, id));
    return book || undefined;
  }

  async getBookByIsbn(isbn: string): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.isbn, isbn));
    return book || undefined;
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const [book] = await db.insert(books).values(insertBook).returning();
    return book;
  }

  async updateBook(id: number, updateBook: UpdateBook): Promise<Book | undefined> {
    const [book] = await db.update(books).set(updateBook).where(eq(books.id, id)).returning();
    return book || undefined;
  }

  async deleteBook(id: number): Promise<void> {
    const result = await db.delete(books).where(eq(books.id, id));
    if (result.rowCount === 0) {
      throw new Error(`Book with id ${id} not found`);
    }
  }

  async searchBooks(query: string): Promise<Book[]> {
    const q = `%${query.toLowerCase()}%`;
    const results = await db.select().from(books).where(
      or(
        sql`LOWER(${books.title}) LIKE ${q}`,
        sql`LOWER(${books.author}) LIKE ${q}`,
        sql`LOWER(${books.isbn}) LIKE ${q}`,
        sql`LOWER(${books.genre}) LIKE ${q}`
      )
    );
    console.log("Arama sorgusu:", query, "SQL param:", q, "Sonuç:", results);
    return results;
  }

  async getAllBooks(): Promise<Book[]> {
    return await db.select().from(books).orderBy(asc(books.title));
  }

  async getBookWithBorrowings(id: number): Promise<BookWithBorrowings | undefined> {
    const book = await this.getBook(id);
    if (!book) return undefined;

    const bookBorrowings = await this.getBookBorrowings(id);
    return { ...book, borrowings: bookBorrowings };
  }

  // Borrowing operations
  async getBorrowing(id: number): Promise<Borrowing | undefined> {
    const [borrowing] = await db.select().from(borrowings).where(eq(borrowings.id, id));
    return borrowing || undefined;
  }

  async createBorrowing(insertBorrowing: InsertBorrowing): Promise<Borrowing> {
    const [borrowing] = await db.insert(borrowings).values(insertBorrowing).returning();
    
    // Update book available copies
    await db.update(books)
      .set({ availableCopies: sql`${books.availableCopies} - 1` })
      .where(eq(books.id, insertBorrowing.bookId));
    
    return borrowing;
  }

  async updateBorrowing(id: number, updateBorrowing: UpdateBorrowing): Promise<Borrowing | undefined> {
    
    // If the status is being set to 'returned', we forcefully set the return date on the server
    // to ensure data integrity, regardless of what the client sends.
    if (updateBorrowing.status === 'returned') {
      updateBorrowing.returnDate = new Date().toISOString();
    }
    
    const [borrowing] = await db.update(borrowings)
      .set(updateBorrowing)
      .where(eq(borrowings.id, id))
      .returning();
    
    // If book is returned, update available copies
    if (updateBorrowing.status === 'returned' && updateBorrowing.returnDate) {
      const currentBorrowing = await this.getBorrowing(id);
      if (currentBorrowing) {
        await db.update(books)
          .set({ availableCopies: sql`${books.availableCopies} + 1` })
          .where(eq(books.id, currentBorrowing.bookId));
      }
    }
    
    return borrowing || undefined;
  }

  async deleteBorrowing(id: number): Promise<void> {
    const result = await db.delete(borrowings).where(eq(borrowings.id, id));
    if (result.rowCount === 0) {
      throw new Error(`Borrowing with id ${id} not found`);
    }
  }

  async getAllBorrowings(): Promise<BorrowingWithDetails[]> {
    return await db.select({
      id: borrowings.id,
      bookId: borrowings.bookId,
      userId: borrowings.userId,
      borrowDate: borrowings.borrowDate,
      dueDate: borrowings.dueDate,
      returnDate: borrowings.returnDate,
      status: borrowings.status,
      extensionRequested: borrowings.extensionRequested,
      notes: borrowings.notes,
      book: books,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      }
    })
    .from(borrowings)
    .innerJoin(books, eq(borrowings.bookId, books.id))
    .innerJoin(users, eq(borrowings.userId, users.id))
    .orderBy(desc(borrowings.borrowDate));
  }

  async getActiveBorrowings(): Promise<BorrowingWithDetails[]> {
    return await db.select({
      id: borrowings.id,
      bookId: borrowings.bookId,
      userId: borrowings.userId,
      borrowDate: borrowings.borrowDate,
      dueDate: borrowings.dueDate,
      returnDate: borrowings.returnDate,
      status: borrowings.status,
      extensionRequested: borrowings.extensionRequested,
      notes: borrowings.notes,
      book: books,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      }
    })
    .from(borrowings)
    .innerJoin(books, eq(borrowings.bookId, books.id))
    .innerJoin(users, eq(borrowings.userId, users.id))
    .where(eq(borrowings.status, 'borrowed'))
    .orderBy(desc(borrowings.borrowDate));
  }

  async getOverdueBorrowings(): Promise<BorrowingWithDetails[]> {
    const today = new Date().toISOString().split('T')[0];
    return await db.select({
      id: borrowings.id,
      bookId: borrowings.bookId,
      userId: borrowings.userId,
      borrowDate: borrowings.borrowDate,
      dueDate: borrowings.dueDate,
      returnDate: borrowings.returnDate,
      status: borrowings.status,
      extensionRequested: borrowings.extensionRequested,
      notes: borrowings.notes,
      book: books,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      }
    })
    .from(borrowings)
    .innerJoin(books, eq(borrowings.bookId, books.id))
    .innerJoin(users, eq(borrowings.userId, users.id))
    .where(and(
      lt(borrowings.dueDate, today),
      or(
        eq(borrowings.status, "borrowed"),
        eq(borrowings.status, "overdue")
      )
    ))
    .orderBy(asc(borrowings.dueDate));
  }

  async getUserBorrowings(userId: number): Promise<BorrowingWithDetails[]> {
    return await db.select({
      id: borrowings.id,
      bookId: borrowings.bookId,
      userId: borrowings.userId,
      borrowDate: borrowings.borrowDate,
      dueDate: borrowings.dueDate,
      returnDate: borrowings.returnDate,
      status: borrowings.status,
      extensionRequested: borrowings.extensionRequested,
      notes: borrowings.notes,
      book: books,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      }
    })
    .from(borrowings)
    .innerJoin(books, eq(borrowings.bookId, books.id))
    .innerJoin(users, eq(borrowings.userId, users.id))
    .where(eq(borrowings.userId, userId))
    .orderBy(desc(borrowings.borrowDate));
  }

  async getBookBorrowings(bookId: number): Promise<BorrowingWithDetails[]> {
    return await db.select({
      id: borrowings.id,
      bookId: borrowings.bookId,
      userId: borrowings.userId,
      borrowDate: borrowings.borrowDate,
      dueDate: borrowings.dueDate,
      returnDate: borrowings.returnDate,
      status: borrowings.status,
      extensionRequested: borrowings.extensionRequested,
      notes: borrowings.notes,
      book: books,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      }
    })
    .from(borrowings)
    .innerJoin(books, eq(borrowings.bookId, books.id))
    .innerJoin(users, eq(borrowings.userId, users.id))
    .where(eq(borrowings.bookId, bookId))
    .orderBy(desc(borrowings.borrowDate));
  }

  // Statistics
  async getStats(): Promise<{
    totalBooks: number;
    totalUsers: number;
    activeBorrowings: number;
    overdueBorrowings: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    
    const [booksCount] = await db.select({ count: count() }).from(books);
    const [usersCount] = await db.select({ count: count() }).from(users);
    const [activeBorrowingsCount] = await db.select({ count: count() })
      .from(borrowings)
      .where(eq(borrowings.status, 'borrowed'));
    const [overdueBorrowingsCount] = await db.select({ count: count() })
      .from(borrowings)
      .where(
        and(
          eq(borrowings.status, 'borrowed'),
          lt(borrowings.dueDate, today)
        )
      );

    return {
      totalBooks: booksCount.count,
      totalUsers: usersCount.count,
      activeBorrowings: activeBorrowingsCount.count,
      overdueBorrowings: overdueBorrowingsCount.count,
    };
  }

  async getMostBorrowedBooks(): Promise<Array<Book & { borrowCount: number }>> {
    return await db.select({
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
      borrowCount: sql<number>`count(${borrowings.bookId})`.as("borrow_count"),
    })
    .from(books)
    .leftJoin(borrowings, eq(books.id, borrowings.bookId))
    .groupBy(books.id)
    .orderBy(desc(sql`borrow_count`))
    .limit(10);
  }

  async getMostActiveUsers(): Promise<Array<User & { borrowCount: number }>> {
    return await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      password: users.password,
      isAdmin: users.isAdmin,
      membershipDate: users.membershipDate,
      adminRating: users.adminRating,
      adminNotes: users.adminNotes,
      borrowCount: count(borrowings.id),
    })
    .from(users)
    .leftJoin(borrowings, eq(users.id, borrowings.userId))
    .groupBy(users.id)
    .orderBy(desc(count(borrowings.id)))
    .limit(10);
  }

  async getTopReadersMonth(): Promise<Array<{ userId: number; name: string; email: string; totalPagesRead: number }>> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const topReaders = await db
      .select({
        userId: users.id,
        name: users.name,
        email: users.email,
        totalPagesRead: sql<number>`sum(${books.pageCount})`.as("total_pages_read"),
      })
      .from(borrowings)
      .innerJoin(users, eq(borrowings.userId, users.id))
      .innerJoin(books, eq(borrowings.bookId, books.id))
      .where(
        and(
          eq(borrowings.status, "returned"),
          isNotNull(borrowings.returnDate),
          sql`${borrowings.returnDate} >= ${startOfMonth.toISOString().split('T')[0]}`,
          sql`${borrowings.returnDate} <= ${endOfMonth.toISOString().split('T')[0]}`
        )
      )
      .groupBy(users.id, users.name, users.email)
      .orderBy(desc(sql`total_pages_read`))
      .limit(3);

    return topReaders;
  }

  async getRecentActivities(limit: number = 5) {
    const recentBorrowingsQuery = db.select({
      type: sql`'borrowing' as type`,
      id: borrowings.id,
      date: borrowings.borrowDate,
      user: { id: users.id, name: users.name },
      book: { id: books.id, title: books.title }
    })
    .from(borrowings)
    .innerJoin(users, eq(borrowings.userId, users.id))
    .innerJoin(books, eq(borrowings.bookId, books.id))
    .where(eq(borrowings.status, 'borrowed'))
    .orderBy(desc(borrowings.borrowDate))
    .limit(limit);

    const recentReturnsQuery = db.select({
      type: sql`'return' as type`,
      id: borrowings.id,
      date: borrowings.returnDate,
      user: { id: users.id, name: users.name },
      book: { id: books.id, title: books.title }
    })
    .from(borrowings)
    .innerJoin(users, eq(borrowings.userId, users.id))
    .innerJoin(books, eq(borrowings.bookId, books.id))
    .where(and(
      eq(borrowings.status, 'returned'),
      isNotNull(borrowings.returnDate)
    ))
    .orderBy(desc(borrowings.returnDate))
    .limit(limit);

    const [recentBorrowings, recentReturns] = await Promise.all([
      recentBorrowingsQuery,
      recentReturnsQuery,
    ]);

    const combined = [...recentBorrowings, ...recentReturns.filter(r => r.date)];
    
    combined.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());

    return combined.slice(0, limit);
  }
}

export const storage = new DatabaseStorage();
