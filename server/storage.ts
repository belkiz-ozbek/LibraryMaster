import { 
  users, books, borrowings,
  type User, type InsertUser, type UpdateUser,
  type Book, type InsertBook, type UpdateBook,
  type Borrowing, type InsertBorrowing, type UpdateBorrowing,
  type BorrowingWithDetails, type UserWithBorrowings, type BookWithBorrowings
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, like, or, and, count, sql, lt, gte, ilike, isNotNull, lte } from "drizzle-orm";

// Pagination interfaces
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: UpdateUser): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;
  searchUsers(query: string): Promise<User[]>;
  searchUsersPaginated(query: string, params: PaginationParams): Promise<PaginatedResponse<User>>;
  getAllUsers(): Promise<User[]>;
  getAllUsersPaginated(params: PaginationParams): Promise<PaginatedResponse<User>>;
  getUserWithBorrowings(id: number): Promise<UserWithBorrowings | undefined>;

  // Book operations
  getBook(id: number): Promise<Book | undefined>;
  getBookByIsbn(isbn: string): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: number, book: UpdateBook): Promise<Book | undefined>;
  deleteBook(id: number): Promise<void>;
  searchBooks(query: string): Promise<Book[]>;
  searchBooksPaginated(query: string, params: PaginationParams): Promise<PaginatedResponse<Book>>;
  getAllBooks(): Promise<Book[]>;
  getAllBooksPaginated(params: PaginationParams): Promise<PaginatedResponse<Book>>;
  getBookWithBorrowings(id: number): Promise<BookWithBorrowings | undefined>;

  // Borrowing operations
  getBorrowing(id: number): Promise<Borrowing | undefined>;
  createBorrowing(borrowing: InsertBorrowing): Promise<Borrowing>;
  updateBorrowing(id: number, borrowing: UpdateBorrowing): Promise<Borrowing | undefined>;
  deleteBorrowing(id: number): Promise<void>;
  getAllBorrowings(): Promise<BorrowingWithDetails[]>;
  getAllBorrowingsPaginated(params: PaginationParams): Promise<PaginatedResponse<BorrowingWithDetails>>;
  getActiveBorrowings(): Promise<BorrowingWithDetails[]>;
  getActiveBorrowingsPaginated(params: PaginationParams): Promise<PaginatedResponse<BorrowingWithDetails>>;
  getOverdueBorrowings(): Promise<BorrowingWithDetails[]>;
  getOverdueBorrowingsPaginated(params: PaginationParams): Promise<PaginatedResponse<BorrowingWithDetails>>;
  getUserBorrowings(userId: number): Promise<BorrowingWithDetails[]>;
  getUserBorrowingsPaginated(userId: number, params: PaginationParams): Promise<PaginatedResponse<BorrowingWithDetails>>;
  getBookBorrowings(bookId: number): Promise<BorrowingWithDetails[]>;
  getReturnedBorrowings(): Promise<BorrowingWithDetails[]>;
  getReturnedBorrowingsPaginated(params: PaginationParams): Promise<PaginatedResponse<BorrowingWithDetails>>;
  
  // Statistics
  getStats(): Promise<{
    totalBooks: number;
    totalUsers: number;
    activeBorrowings: number;
    overdueBorrowings: number;
    totalBooksChangePercent: number;
    totalUsersChangePercent: number;
    avgBorrowDays: number;
  }>;
  getMostBorrowedBooks(): Promise<Array<Book & { borrowCount: number }>>;
  getMostBorrowedBooksPaginated(params: PaginationParams): Promise<PaginatedResponse<Book & { borrowCount: number }>>;
  getMostActiveUsers(): Promise<Array<User & { borrowCount: number }>>;
  getMostActiveUsersPaginated(params: PaginationParams): Promise<PaginatedResponse<User & { borrowCount: number }>>;
  getTopReadersMonth(): Promise<Array<{ userId: number; name: string; email: string | null; totalPagesRead: number }>>;
  getRecentActivities(limit: number): Promise<any[]>;
  getRecentActivitiesPaginated(params: PaginationParams): Promise<PaginatedResponse<any>>;
  getActivityFeed(limit?: number): Promise<any[]>;
  getActivityFeedPaginated(params: PaginationParams): Promise<PaginatedResponse<any>>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email || email.trim() === '') {
      return undefined;
    }
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!username || username.trim() === '') {
      return undefined;
    }
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Üyelik tarihini tam tarih ve saat olarak kaydet
    const userWithDate = {
      ...insertUser,
      membershipDate: new Date()
    };
    
    // Password yoksa boş string olarak ayarla
    if (!userWithDate.password) {
      userWithDate.password = '';
    }
    
    const [user] = await db.insert(users).values(userWithDate).returning();
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
        sql`LOWER(${users.name}) LIKE LOWER(${query} || '%')`,
        ilike(users.email, `%${query}%`)
      )
    );
  }

  async searchUsersPaginated(query: string, params: PaginationParams): Promise<PaginatedResponse<User>> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;
    const q = `%${query.toLowerCase()}%`;
    const [totalCount] = await db.select({ count: count() })
      .from(users)
      .where(sql`lower(name) LIKE ${q} OR lower(email) LIKE ${q}`);
    const data = await db.select()
      .from(users)
      .where(sql`lower(name) LIKE ${q} OR lower(email) LIKE ${q}`)
      .orderBy(desc(users.membershipDate))
      .limit(limit)
      .offset(offset);
    return {
      data,
      pagination: {
        page,
        limit,
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limit),
        hasNext: page < Math.ceil(totalCount.count / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getAllUsers(): Promise<User[]> {
    console.log("[Storage] Getting all users...");
    const result = await db.select().from(users).orderBy(asc(users.name));
    console.log("[Storage] All users fetched, count:", result.length);
    return result;
  }

  async getAllUsersPaginated(params: PaginationParams): Promise<PaginatedResponse<User>> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;

    const [totalCount] = await db.select({ count: count() }).from(users);
    const data = await db.select().from(users).orderBy(asc(users.name)).limit(limit).offset(offset);

    return {
      data,
      pagination: {
        page,
        limit,
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limit),
        hasNext: page < Math.ceil(totalCount.count / limit),
        hasPrev: page > 1,
      },
    };
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
    try {
      console.log("Storage createBook input:", insertBook);
      // Kitap oluşturma tarihini tam tarih ve saat olarak kaydet
      const bookWithDate = {
        ...insertBook,
        createdAt: new Date()
      };
      
      const [book] = await db.insert(books).values(bookWithDate).returning();
      console.log("Storage createBook result:", book);
      return book;
    } catch (error) {
      console.error("Storage createBook error:", error);
      throw error;
    }
  }

  async updateBook(id: number, updateBook: UpdateBook): Promise<Book | undefined> {
    const [book] = await db.update(books).set(updateBook).where(eq(books.id, id)).returning();
    return book || undefined;
  }

  async deleteBook(id: number): Promise<void> {
    // Önce kitabın aktif ödünç alma kaydı olup olmadığını kontrol et
    const activeBorrowings = await db.select()
      .from(borrowings)
      .where(and(
        eq(borrowings.bookId, id),
        eq(borrowings.status, 'borrowed')
      ));
    
    if (activeBorrowings.length > 0) {
      throw new Error(`Bu kitap şu anda ${activeBorrowings.length} kişi tarafından ödünç alınmış durumda. Kitap silinemez.`);
    }
    
    const result = await db.delete(books).where(eq(books.id, id));
    if (result.rowCount === 0) {
      throw new Error(`Book with id ${id} not found`);
    }
  }

  async searchBooks(query: string): Promise<Book[]> {
    // Boş sorgu durumunda tüm kitapları döndür
    if (!query || query.trim() === '') {
      return await this.getAllBooks();
    }
    
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

  async searchBooksPaginated(query: string, params: PaginationParams): Promise<PaginatedResponse<Book>> {
    const { page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;

    // Boş sorgu durumunda tüm kitapları döndür
    if (!query || query.trim() === '') {
      return await this.getAllBooksPaginated(params);
    }
    
    const q = `%${query.toLowerCase()}%`;

    // Total count
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(books)
      .where(
        or(
          sql`LOWER(${books.title}) LIKE ${q}`,
          sql`LOWER(${books.author}) LIKE ${q}`,
          sql`LOWER(${books.isbn}) LIKE ${q}`,
          sql`LOWER(${books.genre}) LIKE ${q}`
        )
      );

    // Paginated results
    const results = await db
      .select()
      .from(books)
      .where(
        or(
          sql`LOWER(${books.title}) LIKE ${q}`,
          sql`LOWER(${books.author}) LIKE ${q}`,
          sql`LOWER(${books.isbn}) LIKE ${q}`,
          sql`LOWER(${books.genre}) LIKE ${q}`
        )
      )
      .limit(limit)
      .offset(offset);

    const total = Number(totalCount);
    const totalPages = Math.ceil(total / limit);

    return {
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getAllBooks(): Promise<Book[]> {
    console.log("[Storage] Getting all books...");
    const result = await db.select().from(books).orderBy(asc(books.title));
    console.log("[Storage] All books fetched, count:", result.length);
    return result;
  }

  async getAllBooksPaginated(params: PaginationParams): Promise<PaginatedResponse<Book>> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;

    const [totalCount] = await db.select({ count: count() }).from(books);
    const data = await db.select().from(books).orderBy(asc(books.title)).limit(limit).offset(offset);

    return {
      data,
      pagination: {
        page,
        limit,
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limit),
        hasNext: page < Math.ceil(totalCount.count / limit),
        hasPrev: page > 1,
      },
    };
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
    // Ödünç alma tarihini tam tarih ve saat olarak kaydet
    const borrowingWithDate = {
      ...insertBorrowing,
      borrowDate: new Date()
    };
    
    const [borrowing] = await db.insert(borrowings).values(borrowingWithDate).returning();
    
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
      // Tam tarih ve saat bilgisini kaydet
      updateBorrowing.returnDate = new Date();
    }

    // Sadece güncellenmesi gereken alanları gönder
    const updateData: any = {};
    if (updateBorrowing.status !== undefined) updateData.status = updateBorrowing.status;
    if (updateBorrowing.notes !== undefined) updateData.notes = updateBorrowing.notes;
    if (updateBorrowing.dueDate !== undefined) updateData.dueDate = updateBorrowing.dueDate;
    // Sadece status 'returned' ise returnDate ekle
    if (updateBorrowing.status === 'returned') {
      updateData.returnDate = new Date();
    }
    console.log('Güncellenecek borrowing:', updateData);
    
    const [borrowing] = await db.update(borrowings)
      .set(updateData)
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
    // Find the borrowing before deleting
    const borrowing = await this.getBorrowing(id);
    if (!borrowing) {
      throw new Error(`Borrowing with id ${id} not found`);
    }
    // If the borrowing was active, increment the book's availableCopies
    if (borrowing.status === 'borrowed') {
      await db.update(books)
        .set({ availableCopies: sql`${books.availableCopies} + 1` })
        .where(eq(books.id, borrowing.bookId));
    }
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

  async getAllBorrowingsPaginated(params: PaginationParams): Promise<PaginatedResponse<BorrowingWithDetails>> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;

    const [totalCount] = await db.select({ count: count() }).from(borrowings);
    const data = await db.select({
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
    .orderBy(desc(borrowings.borrowDate))
    .limit(limit)
    .offset(offset);

    return {
      data,
      pagination: {
        page,
        limit,
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limit),
        hasNext: page < Math.ceil(totalCount.count / limit),
        hasPrev: page > 1,
      },
    };
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

  async getActiveBorrowingsPaginated(params: PaginationParams): Promise<PaginatedResponse<BorrowingWithDetails>> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;

    const [totalCount] = await db.select({ count: count() }).from(borrowings).where(eq(borrowings.status, 'borrowed'));
    const data = await db.select({
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
    .orderBy(desc(borrowings.borrowDate))
    .limit(limit)
    .offset(offset);

    return {
      data,
      pagination: {
        page,
        limit,
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limit),
        hasNext: page < Math.ceil(totalCount.count / limit),
        hasPrev: page > 1,
      },
    };
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

  async getOverdueBorrowingsPaginated(params: PaginationParams): Promise<PaginatedResponse<BorrowingWithDetails>> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;
    // today'i saat/dakika/saniye olmadan UTC 00:00:00 olarak ayarla
    const todayObj = new Date();
    todayObj.setUTCHours(0, 0, 0, 0);
    const today = todayObj.toISOString().split('T')[0];
    
    console.log("getOverdueBorrowingsPaginated - today:", today, "params:", params);

    const [totalCount] = await db.select({ count: count() }).from(borrowings).where(and(
      lt(borrowings.dueDate, today),
      or(
        eq(borrowings.status, "borrowed"),
        eq(borrowings.status, "overdue")
      )
    ));
    
    console.log("Total overdue count:", totalCount.count);
    const data = await db.select({
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
    .orderBy(asc(borrowings.dueDate))
    .limit(limit)
    .offset(offset);

    console.log("Overdue data:", data);
    console.log("Overdue data length:", data.length);

    return {
      data,
      pagination: {
        page,
        limit,
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limit),
        hasNext: page < Math.ceil(totalCount.count / limit),
        hasPrev: page > 1,
      },
    };
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

  async getUserBorrowingsPaginated(userId: number, params: PaginationParams): Promise<PaginatedResponse<BorrowingWithDetails>> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;

    const [totalCount] = await db.select({ count: count() }).from(borrowings).where(eq(borrowings.userId, userId));
    const data = await db.select({
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
    .orderBy(desc(borrowings.borrowDate))
    .limit(limit)
    .offset(offset);

    return {
      data,
      pagination: {
        page,
        limit,
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limit),
        hasNext: page < Math.ceil(totalCount.count / limit),
        hasPrev: page > 1,
      },
    };
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

  async getReturnedBorrowings(): Promise<BorrowingWithDetails[]> {
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
    .where(eq(borrowings.status, 'returned'))
    .orderBy(desc(borrowings.returnDate));
  }

  async getReturnedBorrowingsPaginated(params: PaginationParams): Promise<PaginatedResponse<BorrowingWithDetails>> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;
    const [totalCount] = await db.select({ count: count() }).from(borrowings).where(eq(borrowings.status, 'returned'));
    const data = await db.select({
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
    .where(eq(borrowings.status, 'returned'))
    .orderBy(desc(borrowings.returnDate))
    .limit(limit)
    .offset(offset);

    return {
      data,
      pagination: {
        page,
        limit,
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limit),
        hasNext: page < Math.ceil(totalCount.count / limit),
        hasPrev: page > 1,
      },
    };
  }

  // Statistics
  async getStats(): Promise<{
    totalBooks: number;
    totalUsers: number;
    activeBorrowings: number;
    overdueBorrowings: number;
    totalBooksChangePercent: number;
    totalUsersChangePercent: number;
    avgBorrowDays: number;
  }> {
    console.log("[Storage] Getting stats...");
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    console.log("[Storage] Querying books count...");
    const [booksCount] = await db.select({ count: count() }).from(books);
    console.log("[Storage] Books count:", booksCount.count);
    
    console.log("[Storage] Querying users count...");
    const [usersCount] = await db.select({ count: count() }).from(users);
    console.log("[Storage] Users count:", usersCount.count);
    
    console.log("[Storage] Querying active borrowings count...");
    const [activeBorrowingsCount] = await db.select({ count: count() })
      .from(borrowings)
      .where(eq(borrowings.status, 'borrowed'));
    console.log("[Storage] Active borrowings count:", activeBorrowingsCount.count);
    
    console.log("[Storage] Querying overdue borrowings count...");
    const [overdueBorrowingsCount] = await db.select({ count: count() })
      .from(borrowings)
      .where(
        and(
          eq(borrowings.status, 'borrowed'),
          lt(borrowings.dueDate, today)
        )
      );
    console.log("[Storage] Overdue borrowings count:", overdueBorrowingsCount.count);

    // Bu ay eklenen kitap sayısı
    const [booksThisMonth] = await db.select({ count: count() })
      .from(books)
      .where(gte(books.createdAt, startOfThisMonth));
    // Geçen ay eklenen kitap sayısı
    const [booksLastMonth] = await db.select({ count: count() })
      .from(books)
      .where(and(
        gte(books.createdAt, startOfLastMonth),
        lt(books.createdAt, startOfThisMonth)
      ));
    // Bu ay eklenen üye sayısı
    const [usersThisMonth] = await db.select({ count: count() })
      .from(users)
      .where(gte(users.membershipDate, startOfThisMonth));
    // Geçen ay eklenen üye sayısı
    const [usersLastMonth] = await db.select({ count: count() })
      .from(users)
      .where(and(
        gte(users.membershipDate, startOfLastMonth),
        lt(users.membershipDate, startOfThisMonth)
      ));
    // Yüzdelik değişim hesapla
    let totalBooksChangePercent;
    if (booksLastMonth.count === 0 && booksThisMonth.count > 0) {
      totalBooksChangePercent = 100;
    } else if (booksLastMonth.count === 0) {
      totalBooksChangePercent = 0;
    } else {
      totalBooksChangePercent = Math.round(((booksThisMonth.count - booksLastMonth.count) / booksLastMonth.count) * 100);
    }
    let totalUsersChangePercent;
    if (usersLastMonth.count === 0 && usersThisMonth.count > 0) {
      totalUsersChangePercent = 100;
    } else if (usersLastMonth.count === 0) {
      totalUsersChangePercent = 0;
    } else {
      totalUsersChangePercent = Math.round(((usersThisMonth.count - usersLastMonth.count) / usersLastMonth.count) * 100);
    }

    // Ortalama ödünç gününü hesapla
    const borrowingsWithReturn = await db.select({
      borrowDate: borrowings.borrowDate,
      returnDate: borrowings.returnDate
    }).from(borrowings).where(isNotNull(borrowings.returnDate));
    const avgBorrowDays = borrowingsWithReturn.length
      ? Math.round(borrowingsWithReturn.reduce((sum, b) => {
          if (!b.returnDate) return sum;
          return sum + ((new Date(b.returnDate).getTime() - new Date(b.borrowDate).getTime()) / (1000 * 60 * 60 * 24));
        }, 0) / borrowingsWithReturn.length)
      : 0;

    return {
      totalBooks: booksCount.count,
      totalUsers: usersCount.count,
      activeBorrowings: activeBorrowingsCount.count,
      overdueBorrowings: overdueBorrowingsCount.count,
      totalBooksChangePercent,
      totalUsersChangePercent,
      avgBorrowDays
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

  async getMostBorrowedBooksPaginated(params: PaginationParams): Promise<PaginatedResponse<Book & { borrowCount: number }>> {
    const { page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;

    // Total count
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(books);

    // Paginated results
    const results = await db.select({
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
    .limit(limit)
    .offset(offset);

    const total = Number(totalCount);
    const totalPages = Math.ceil(total / limit);

    return {
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getMostActiveUsers(): Promise<Array<User & { borrowCount: number }>> {
    return await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      username: users.username,
      password: users.password,
      isAdmin: users.isAdmin,
      membershipDate: users.membershipDate,
      adminRating: users.adminRating,
      adminNotes: users.adminNotes,
      emailVerified: users.emailVerified,
      emailVerificationToken: users.emailVerificationToken,
      emailVerificationExpires: users.emailVerificationExpires,
      borrowCount: count(borrowings.id),
    })
    .from(users)
    .leftJoin(borrowings, eq(users.id, borrowings.userId))
    .groupBy(users.id)
    .orderBy(desc(count(borrowings.id)))
    .limit(10);
  }

  async getMostActiveUsersPaginated(params: PaginationParams): Promise<PaginatedResponse<User & { borrowCount: number }>> {
    const { page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;

    // Total count
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(users);

    // Paginated results
    const results = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      username: users.username,
      password: users.password,
      isAdmin: users.isAdmin,
      membershipDate: users.membershipDate,
      adminRating: users.adminRating,
      adminNotes: users.adminNotes,
      emailVerified: users.emailVerified,
      emailVerificationToken: users.emailVerificationToken,
      emailVerificationExpires: users.emailVerificationExpires,
      borrowCount: count(borrowings.id),
    })
    .from(users)
    .leftJoin(borrowings, eq(users.id, borrowings.userId))
    .groupBy(users.id)
    .orderBy(desc(count(borrowings.id)))
    .limit(limit)
    .offset(offset);

    const total = Number(totalCount);
    const totalPages = Math.ceil(total / limit);

    return {
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getTopReadersMonth(): Promise<Array<{ userId: number; name: string; email: string | null; totalPagesRead: number }>> {
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
    .orderBy(desc(borrowings.borrowDate));

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
    .orderBy(desc(borrowings.returnDate));

    const [recentBorrowings, recentReturns] = await Promise.all([
      recentBorrowingsQuery,
      recentReturnsQuery,
    ]);

    const combined = [...recentBorrowings, ...recentReturns.filter(r => r.date)];
    combined.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());

    return combined.slice(0, limit);
  }

  async getActivityFeed(limit?: number): Promise<any[]> {
    // Tüm ödünç almalar (status'e bakmadan - log gibi olsun)
    const allBorrowings = await db.select({
      id: sql`concat('borrow-', ${borrowings.id})`,
      type: sql`'borrowing'`,
      title: sql`concat(${users.name}, ' kitap ödünç aldı')`,
      description: sql`concat('"', ${books.title}, '" kitabını ödünç aldı')`,
      user: { name: users.name, email: users.email },
      book: { title: books.title, author: books.author },
      date: borrowings.borrowDate,
      status: sql`'completed'`,
      metadata: sql`json_build_object('bookId', ${books.id}, 'userId', ${users.id})`
    })
    .from(borrowings)
    .innerJoin(users, eq(borrowings.userId, users.id))
    .innerJoin(books, eq(borrowings.bookId, books.id))
    .orderBy(desc(borrowings.borrowDate));

    // Son iadeler
    const recentReturns = await db.select({
      id: sql`concat('return-', ${borrowings.id})`,
      type: sql`'return'`,
      title: sql`concat(${users.name}, ' kitap iade etti')`,
      description: sql`concat('"', ${books.title}, '" kitabını iade etti')`,
      user: { name: users.name, email: users.email },
      book: { title: books.title, author: books.author },
      date: borrowings.returnDate,
      status: sql`'completed'`,
      metadata: sql`json_build_object('bookId', ${books.id}, 'userId', ${users.id})`
    })
    .from(borrowings)
    .innerJoin(users, eq(borrowings.userId, users.id))
    .innerJoin(books, eq(borrowings.bookId, books.id))
    .where(and(
      eq(borrowings.status, 'returned'),
      isNotNull(borrowings.returnDate)
    ))
    .orderBy(desc(borrowings.returnDate));

    // Son eklenen kitaplar
    const recentBooks = await db.select({
      id: sql`concat('book-', ${books.id})`,
      type: sql`'book_added'`,
      title: sql`concat('Yeni kitap eklendi: "', ${books.title}, '"')`,
      description: sql`concat(${books.author}, ' tarafından yazılan kitap kataloğa eklendi')`,
      book: { title: books.title, author: books.author },
      date: books.createdAt,
      status: sql`'completed'`,
      metadata: sql`json_build_object('bookId', ${books.id}, 'isbn', ${books.isbn}, 'genre', ${books.genre})`
    })
    .from(books)
    .orderBy(desc(books.createdAt));

    // Son eklenen üyeler
    const recentMembers = await db.select({
      id: sql`concat('member-', ${users.id})`,
      type: sql`'member_added'`,
      title: sql`concat('Yeni üye eklendi: ', ${users.name})`,
      description: sql`concat(${users.name}, ' sisteme üye olarak kaydedildi')`,
      user: { name: users.name, email: users.email },
      date: users.membershipDate,
      status: sql`'completed'`,
      metadata: sql`json_build_object('userId', ${users.id}, 'isAdmin', ${users.isAdmin})`
    })
    .from(users)
    .orderBy(desc(users.membershipDate));

    // Gecikmiş ödünç almalar (timestamp karşılaştırması)
    const today = new Date().toISOString().split('T')[0];
    const overdueItems = await db.select({
      id: sql`concat('overdue-', ${borrowings.id})`,
      type: sql`'overdue'`,
      title: sql`concat('Gecikmiş kitap: ', ${books.title})`,
      description: sql`concat(${users.name}, ' tarafından ödünç alınan kitap gecikti')`,
      user: { name: users.name, email: users.email },
      book: { title: books.title, author: books.author },
      date: borrowings.dueDate,
      status: sql`'pending'`,
      metadata: sql`json_build_object('bookId', ${books.id}, 'userId', ${users.id})`
    })
    .from(borrowings)
    .innerJoin(users, eq(borrowings.userId, users.id))
    .innerJoin(books, eq(borrowings.bookId, books.id))
    .where(and(
      eq(borrowings.status, 'borrowed'),
      lt(borrowings.dueDate, today)
    ))
    .orderBy(asc(borrowings.dueDate));

    // Tüm aktiviteleri birleştir ve tarihe göre sırala
    const allActivities = [
      ...allBorrowings,
      ...recentReturns,
      ...recentBooks,
      ...recentMembers,
      ...overdueItems
    ];

    // Tarih formatını düzelt ve sırala
    allActivities.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA; // En yeni tarih önce
    });

    // Eğer limit belirtilmişse uygula, yoksa tümünü döndür
    return limit ? allActivities.slice(0, limit) : allActivities;
  }

  async getRecentActivitiesPaginated(params: PaginationParams): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;

    // Tüm aktiviteleri al
    const allActivities = await this.getRecentActivities(1000); // Büyük limit ile tümünü al

    // Toplam sayı
    const total = allActivities.length;
    const totalPages = Math.ceil(total / limit);

    // Sayfalama uygula
    const paginatedActivities = allActivities.slice(offset, offset + limit);

    return {
      data: paginatedActivities,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getActivityFeedPaginated(params: PaginationParams): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;

    // Tüm aktiviteleri al
    const allActivities = await this.getActivityFeed();

    // Toplam sayı
    const total = allActivities.length;
    const totalPages = Math.ceil(total / limit);

    // Sayfalama uygula
    const paginatedActivities = allActivities.slice(offset, offset + limit);

    return {
      data: paginatedActivities,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }
}

export const storage = new DatabaseStorage();
