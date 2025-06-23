ALTER TABLE "books" ALTER COLUMN "shelf_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ALTER COLUMN "page_count" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "books" ALTER COLUMN "page_count" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;