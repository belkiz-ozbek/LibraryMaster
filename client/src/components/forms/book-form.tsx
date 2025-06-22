import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { insertBookSchema, type Book, type InsertBook } from "@shared/schema";
import { z } from "zod";

const bookFormSchema = insertBookSchema.extend({
  availableCopies: z.number().min(0, "Available copies must be non-negative"),
  totalCopies: z.number().min(1, "Total copies must be at least 1"),
  pageCount: z.number().min(1, "Page count must be at least 1"),
});

type BookFormData = z.infer<typeof bookFormSchema>;

interface BookFormProps {
  book?: Book | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BookForm({ book, onSuccess, onCancel }: BookFormProps) {
  const isEditing = !!book;

  const form = useForm<BookFormData>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: book?.title || "",
      author: book?.author || "",
      isbn: book?.isbn || "",
      genre: book?.genre || "",
      publishYear: book?.publishYear || new Date().getFullYear(),
      shelfNumber: book?.shelfNumber || "",
      availableCopies: book?.availableCopies || 1,
      totalCopies: book?.totalCopies || 1,
      pageCount: book?.pageCount || 0,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: BookFormData) => {
      if (isEditing) {
        return apiRequest("PUT", `/api/books/${book.id}`, data);
      }
      return apiRequest("POST", "/api/books", data);
    },
    onSuccess,
  });

  const onSubmit = (data: BookFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            {...form.register("title")}
          />
          {form.formState.errors.title && <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>}
        </div>
        <div>
          <Label htmlFor="author">Author *</Label>
          <Input
            id="author"
            {...form.register("author")}
          />
          {form.formState.errors.author && <p className="text-sm text-destructive mt-1">{form.formState.errors.author.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="isbn">ISBN *</Label>
          <Input
            id="isbn"
            {...form.register("isbn")}
            placeholder="978-0-123456-78-9"
          />
          {form.formState.errors.isbn && <p className="text-sm text-destructive mt-1">{form.formState.errors.isbn.message}</p>}
        </div>
        <div>
          <Label htmlFor="genre">Genre *</Label>
          <Input
            id="genre"
            {...form.register("genre")}
            placeholder="Fiction, Science, History, etc."
          />
          {form.formState.errors.genre && <p className="text-sm text-destructive mt-1">{form.formState.errors.genre.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="publishYear">Publish Year *</Label>
          <Input
            id="publishYear"
            type="number"
            {...form.register("publishYear", { valueAsNumber: true })}
          />
          {form.formState.errors.publishYear && <p className="text-sm text-destructive mt-1">{form.formState.errors.publishYear.message}</p>}
        </div>
        <div>
          <Label htmlFor="pageCount">Page Count *</Label>
          <Input
            id="pageCount"
            type="number"
            min="1"
            {...form.register("pageCount", { valueAsNumber: true })}
          />
          {form.formState.errors.pageCount && <p className="text-sm text-destructive mt-1">{form.formState.errors.pageCount.message}</p>}
        </div>
        <div>
          <Label htmlFor="totalCopies">Total Copies *</Label>
          <Input
            id="totalCopies"
            type="number"
            min="1"
            {...form.register("totalCopies", { valueAsNumber: true })}
          />
          {form.formState.errors.totalCopies && <p className="text-sm text-destructive mt-1">{form.formState.errors.totalCopies.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="availableCopies">Available Copies *</Label>
        <Input
          id="availableCopies"
          type="number"
          min="0"
          {...form.register("availableCopies", { valueAsNumber: true })}
        />
        {form.formState.errors.availableCopies && <p className="text-sm text-destructive mt-1">{form.formState.errors.availableCopies.message}</p>}
      </div>

      <div>
        <Label htmlFor="shelfNumber">Shelf Number *</Label>
        <Input
          id="shelfNumber"
          {...form.register("shelfNumber")}
          placeholder="A1, B2, C3, etc."
        />
        {form.formState.errors.shelfNumber && <p className="text-sm text-destructive mt-1">{form.formState.errors.shelfNumber.message}</p>}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : isEditing ? "Update Book" : "Add Book"}
        </Button>
      </div>

      {mutation.isError && (
        <p className="text-sm text-destructive mt-2">
          Failed to {isEditing ? "update" : "create"} book. Please try again.
        </p>
      )}
    </form>
  );
}
