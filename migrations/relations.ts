import { relations } from "drizzle-orm/relations";
import { books, borrowings, users } from "./schema";

export const borrowingsRelations = relations(borrowings, ({one}) => ({
	book: one(books, {
		fields: [borrowings.bookId],
		references: [books.id]
	}),
	user: one(users, {
		fields: [borrowings.userId],
		references: [users.id]
	}),
}));

export const booksRelations = relations(books, ({many}) => ({
	borrowings: many(borrowings),
}));

export const usersRelations = relations(users, ({many}) => ({
	borrowings: many(borrowings),
}));