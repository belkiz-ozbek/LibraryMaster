import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { insertBorrowingSchema, type Borrowing } from "@shared/schema";
import { z } from "zod";
import { format, addDays } from "date-fns";

const borrowFormSchema = insertBorrowingSchema.extend({
  notes: z.string().optional(),
});

type BorrowFormData = z.infer<typeof borrowFormSchema>;

interface BorrowFormProps {
  borrowing?: Borrowing | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BorrowForm({ borrowing, onSuccess, onCancel }: BorrowFormProps) {
  const isEditing = !!borrowing;
  const today = new Date().toISOString().split('T')[0];
  const defaultDueDate = format(addDays(new Date(), 14), 'yyyy-MM-dd');

  const { data: books = [] } = useQuery({
    queryKey: ["/api/books"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  const form = useForm<BorrowFormData>({
    resolver: zodResolver(borrowFormSchema),
    defaultValues: {
      bookId: borrowing?.bookId || 0,
      userId: borrowing?.userId || 0,
      borrowDate: borrowing?.borrowDate || today,
      dueDate: borrowing?.dueDate || defaultDueDate,
      status: borrowing?.status || "borrowed",
      extensionRequested: borrowing?.extensionRequested || false,
      notes: borrowing?.notes || "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: BorrowFormData) => {
      if (isEditing) {
        return apiRequest("PUT", `/api/borrowings/${borrowing.id}`, data);
      }
      return apiRequest("POST", "/api/borrowings", data);
    },
    onSuccess,
  });

  const onSubmit = (data: BorrowFormData) => {
    mutation.mutate(data);
  };

  const availableBooks = books.filter(book => book.availableCopies > 0);
  const nonAdminUsers = users.filter(user => !user.isAdmin);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="userId">Member *</Label>
          <Select
            value={form.watch("userId")?.toString() || ""}
            onValueChange={(value) => form.setValue("userId", parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select member" />
            </SelectTrigger>
            <SelectContent>
              {nonAdminUsers.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.name} ({user.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.userId && (
            <p className="text-sm text-destructive mt-1">Please select a member</p>
          )}
        </div>

        <div>
          <Label htmlFor="bookId">Book *</Label>
          <Select
            value={form.watch("bookId")?.toString() || ""}
            onValueChange={(value) => form.setValue("bookId", parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select book" />
            </SelectTrigger>
            <SelectContent>
              {availableBooks.map((book) => (
                <SelectItem key={book.id} value={book.id.toString()}>
                  {book.title} by {book.author} ({book.availableCopies} available)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.bookId && (
            <p className="text-sm text-destructive mt-1">Please select a book</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="borrowDate">Borrow Date *</Label>
          <Input
            id="borrowDate"
            type="date"
            {...form.register("borrowDate")}
            error={form.formState.errors.borrowDate?.message}
          />
        </div>
        <div>
          <Label htmlFor="dueDate">Due Date *</Label>
          <Input
            id="dueDate"
            type="date"
            {...form.register("dueDate")}
            error={form.formState.errors.dueDate?.message}
          />
        </div>
      </div>

      {isEditing && (
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={form.watch("status")}
            onValueChange={(value) => form.setValue("status", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="borrowed">Borrowed</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...form.register("notes")}
          placeholder="Any additional notes about this borrowing..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Processing..." : isEditing ? "Update Borrowing" : "Create Borrowing"}
        </Button>
      </div>

      {mutation.isError && (
        <p className="text-sm text-destructive mt-2">
          Failed to {isEditing ? "update" : "create"} borrowing. Please try again.
        </p>
      )}
    </form>
  );
}
