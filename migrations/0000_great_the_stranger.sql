-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "playing_with_neon" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"value" real
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"isbn" text NOT NULL,
	"genre" text NOT NULL,
	"publish_year" integer NOT NULL,
	"shelf_number" text,
	"available_copies" integer DEFAULT 1 NOT NULL,
	"total_copies" integer DEFAULT 1 NOT NULL,
	"page_count" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "books_isbn_unique" UNIQUE("isbn")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"membership_date" timestamp NOT NULL,
	"admin_rating" integer DEFAULT 0,
	"admin_notes" text,
	"username" text NOT NULL,
	"email_verified" boolean DEFAULT false,
	"email_verification_token" text,
	"email_verification_expires" timestamp,
	"tenant_id" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "borrowings" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"borrow_date" timestamp NOT NULL,
	"due_date" date NOT NULL,
	"return_date" timestamp,
	"status" text DEFAULT 'borrowed' NOT NULL,
	"extension_requested" boolean DEFAULT false,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "borrowings" ADD CONSTRAINT "borrowings_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "borrowings" ADD CONSTRAINT "borrowings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
*/