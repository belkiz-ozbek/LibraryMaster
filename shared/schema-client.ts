// Client-only type surface for shared schema
// Ensures the browser bundle does not import drizzle runtime (pg-core)

export type {
  User,
  InsertUser,
  UpdateUser,
  Book,
  InsertBook,
  UpdateBook,
  Borrowing,
  InsertBorrowing,
  UpdateBorrowing,
  BorrowingWithDetails,
  UserWithBorrowings,
  BookWithBorrowings,
} from './schema';


