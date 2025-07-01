import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { insertBorrowingSchema, type Borrowing, type Book, type User } from "@shared/schema";
import { z } from "zod";
import { format, addDays } from "date-fns";
import Select, { SingleValue } from 'react-select';
import { useTranslation } from "react-i18next";
import { useState } from "react";

const borrowFormSchema = insertBorrowingSchema.extend({
  borrowDate: z.date({ required_error: "Lütfen ödünç alma tarihi giriniz" }),
  notes: z.string().optional(),
});

type BorrowFormData = z.infer<typeof borrowFormSchema>;

interface BorrowFormProps {
  borrowing?: Borrowing | null;
  onSuccess: () => void;
  onCancel: () => void;
}

function normalize(str: string) {
  return str
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

export function BorrowForm({ borrowing, onSuccess, onCancel }: BorrowFormProps) {
  const isEditing = !!borrowing;
  const today = new Date().toISOString().split('T')[0];
  const defaultDueDate = format(addDays(new Date(), 14), 'yyyy-MM-dd');

  const { data: books = [] } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: borrowings = [] } = useQuery<any[]>({
    queryKey: ["/api/borrowings"],
  });

  const { t } = useTranslation();

  const form = useForm<BorrowFormData>({
    resolver: zodResolver(borrowFormSchema),
    defaultValues: {
      bookId: borrowing?.bookId || 0,
      userId: borrowing?.userId || 0,
      borrowDate: borrowing?.borrowDate ? new Date(borrowing.borrowDate) : new Date(),
      dueDate: borrowing?.dueDate ? new Date(borrowing.dueDate).toISOString().split('T')[0] : defaultDueDate,
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
    const dueDateString = typeof data.dueDate === 'string' && data.dueDate.length === 10
      ? data.dueDate
      : new Date(data.dueDate).toISOString().split('T')[0];
    const submitData = {
      ...data,
      dueDate: dueDateString,
    };
    mutation.mutate(submitData as any);
  };

  const nonAdminUsers = users.filter(user => !user.isAdmin);

  type MemberOptionType = { value: number; label: string };
  const memberOptions: MemberOptionType[] = nonAdminUsers.map((user) => ({
    value: user.id,
    label: `${user.name} (${user.email})`
  }));

  type BookOptionType = { value: number; label: string; isDisabled: boolean };
  const bookOptions: BookOptionType[] = books.map((book) => ({
    value: book.id,
    label: `${book.title} - ${book.author} (${book.availableCopies}/${book.totalCopies} ${t('books.availableCopies')})`,
    isDisabled: book.availableCopies === 0,
  }));

  // Status için ayrı bir tip
  type StatusOptionType = { value: string; label: string };
  const statusOptions: StatusOptionType[] = [
    { value: "borrowed", label: t("borrowing.borrowed") },
    { value: "returned", label: t("borrowing.returned") },
    { value: "overdue", label: t("borrowing.overdue") },
  ];

  const [memberInput, setMemberInput] = useState("");
  const filteredMemberOptions = memberInput
    ? memberOptions.filter(opt => normalize(opt.label).includes(normalize(memberInput)))
    : memberOptions;

  const [bookInput, setBookInput] = useState("");
  const filteredBookOptions = bookInput
    ? bookOptions.filter(opt => normalize(opt.label).includes(normalize(bookInput)))
    : bookOptions;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="userId">{t("borrowing.member")} *</Label>
          <Select
            options={filteredMemberOptions}
            value={memberOptions.find(option => option.value === form.watch("userId"))}
            onInputChange={setMemberInput}
            onChange={(option: SingleValue<MemberOptionType>) => form.setValue("userId", option ? option.value : 0)}
            placeholder={t("borrowing.selectMember")}
            isClearable
            isSearchable
            noOptionsMessage={() => t("borrowing.noMembersFound")}
            filterOption={null}
          />
          {form.formState.errors.userId && (
            <p className="text-sm text-destructive mt-1">{t("borrowing.pleaseSelectMember")}</p>
          )}
        </div>

        <div>
          <Label htmlFor="bookId">{t("borrowing.book")} *</Label>
          <Select
            options={filteredBookOptions}
            value={bookOptions.find(option => option.value === form.watch("bookId"))}
            onInputChange={setBookInput}
            onChange={(option: SingleValue<BookOptionType>) => form.setValue("bookId", option ? option.value : 0)}
            placeholder={t("borrowing.selectBook")}
            isClearable
            isSearchable
            noOptionsMessage={() => t("borrowing.noBooksFound")}
            filterOption={null}
            isOptionDisabled={(option: BookOptionType) => option.isDisabled}
            formatOptionLabel={(option: BookOptionType) => (
              <div title={option.isDisabled ? t('borrowing.notAvailable') : ''} style={{ color: option.isDisabled ? 'red' : 'inherit' }}>
                {option.label}
              </div>
            )}
          />
          {form.formState.errors.bookId && (
            <p className="text-sm text-destructive mt-1">{t("borrowing.pleaseSelectBook")}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="borrowDate">{t("borrowing.borrowDate")} *</Label>
          <Input
            id="borrowDate"
            type="date"
            {...form.register("borrowDate")}
          />
        </div>
        <div>
          <Label htmlFor="dueDate">{t("borrowing.dueDate")} *</Label>
          <Input
            id="dueDate"
            type="date"
            {...form.register("dueDate")}
          />
        </div>
      </div>

      {isEditing && (
        <div>
          <Label htmlFor="status">{t("borrowing.status")}</Label>
          <Select
            options={statusOptions}
            value={statusOptions.find(option => option.value === form.watch("status"))}
            onChange={(option: SingleValue<StatusOptionType>) => form.setValue("status", option ? option.value : "borrowed")}
            placeholder={t("borrowing.status")}
            isClearable={false}
            isSearchable={false}
          />
        </div>
      )}

      <div>
        <Label htmlFor="notes">{t("borrowing.notes")}</Label>
        <Textarea
          id="notes"
          {...form.register("notes")}
          placeholder={t("borrowing.notesPlaceholder")}
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? t("borrowing.processing") : isEditing ? t("borrowing.updateBorrowing") : t("borrowing.createBorrowing")}
        </Button>
      </div>

      {mutation.isError && (
        <p className="text-sm text-destructive mt-2">
          {t("borrowing.failed", { action: isEditing ? t("borrowing.updateBorrowing") : t("borrowing.createBorrowing") })}
        </p>
      )}
    </form>
  );
}
