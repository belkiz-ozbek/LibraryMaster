import { pgTable, foreignKey, serial, integer, timestamp, date, text, boolean, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const borrowings = pgTable("borrowings", {
	id: serial().primaryKey().notNull(),
	bookId: integer("book_id").notNull(),
	userId: integer("user_id").notNull(),
	borrowDate: timestamp("borrow_date", { mode: 'string' }).notNull(),
	dueDate: date("due_date").notNull(),
	returnDate: timestamp("return_date", { mode: 'string' }),
	status: text().default('borrowed').notNull(),
	extensionRequested: boolean("extension_requested").default(false),
	notes: text(),
}, (table) => [
	foreignKey({
			columns: [table.bookId],
			foreignColumns: [books.id],
			name: "borrowings_book_id_books_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "borrowings_user_id_users_id_fk"
		}),
]);

export const books = pgTable("books", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	author: text().notNull(),
	isbn: text(),
	genre: text().notNull(),
	publishYear: integer("publish_year").notNull(),
	shelfNumber: text("shelf_number"),
	availableCopies: integer("available_copies").default(1).notNull(),
	totalCopies: integer("total_copies").default(1).notNull(),
	pageCount: integer("page_count"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("books_isbn_unique").on(table.isbn),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	email: text(),
	password: text(),
	isAdmin: boolean("is_admin").default(false).notNull(),
	membershipDate: timestamp("membership_date", { mode: 'string' }).notNull(),
	adminRating: integer("admin_rating").default(0),
	adminNotes: text("admin_notes"),
	username: text().notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	emailVerificationToken: text("email_verification_token"),
	emailVerificationExpires: timestamp("email_verification_expires", { mode: 'string' }),
}, (table) => [
	unique("users_username_unique").on(table.username),
]);
