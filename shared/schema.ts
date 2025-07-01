import { pgTable, text, serial, integer, boolean, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  membershipDate: timestamp("membership_date").notNull(),
  adminRating: integer("admin_rating").default(0),
  adminNotes: text("admin_notes"),
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  isbn: text("isbn").notNull().unique(),
  genre: text("genre").notNull(),
  publishYear: integer("publish_year").notNull(),
  shelfNumber: text("shelf_number"),
  availableCopies: integer("available_copies").default(1).notNull(),
  totalCopies: integer("total_copies").notNull().default(1),
  pageCount: integer("page_count"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const borrowings = pgTable("borrowings", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull().references(() => books.id),
  userId: integer("user_id").notNull().references(() => users.id),
  borrowDate: timestamp("borrow_date").notNull(),
  dueDate: date("due_date").notNull(),
  returnDate: timestamp("return_date"),
  status: text("status").notNull().default("borrowed"), // borrowed, returned, overdue
  extensionRequested: boolean("extension_requested").default(false),
  notes: text("notes"),
});

export const usersRelations = relations(users, ({ many }) => ({
  borrowings: many(borrowings),
}));

export const booksRelations = relations(books, ({ many }) => ({
  borrowings: many(borrowings),
}));

export const borrowingsRelations = relations(borrowings, ({ one }) => ({
  book: one(books, {
    fields: [borrowings.bookId],
    references: [books.id],
  }),
  user: one(users, {
    fields: [borrowings.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
});

export const insertBorrowingSchema = createInsertSchema(borrowings).omit({
  id: true,
});

// Update schemas
export const updateUserSchema = insertUserSchema.partial();
export const updateBookSchema = insertBookSchema.partial();
export const updateBorrowingSchema = insertBorrowingSchema.partial();

// Select schemas
export const selectUserSchema = createSelectSchema(users);
export const selectBookSchema = createSelectSchema(books);
export const selectBorrowingSchema = createSelectSchema(borrowings);

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type Book = typeof books.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type UpdateBook = z.infer<typeof updateBookSchema>;

export type Borrowing = typeof borrowings.$inferSelect;
export type InsertBorrowing = z.infer<typeof insertBorrowingSchema>;
export type UpdateBorrowing = z.infer<typeof updateBorrowingSchema>;

// Extended types for API responses
export type BorrowingWithDetails = Borrowing & {
  book: Book;
  user: Pick<User, 'id' | 'name' | 'email'>;
};

export type UserWithBorrowings = User & {
  borrowings: BorrowingWithDetails[];
};

export type BookWithBorrowings = Book & {
  borrowings: BorrowingWithDetails[];
};
