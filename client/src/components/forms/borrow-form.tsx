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
import { useIsMobile } from "@/hooks/use-mobile";

// Genre çeviri fonksiyonu
const translateGenre = (genre: string, t: any) => {
  if (!genre) return "";
  
  // Virgülle ayrılmış türleri böl ve her birini çevir
  const genres = genre.split(',').map(g => g.trim());
  const translatedGenres = genres.map(g => {
    // Türkçe karakterleri normalize et
    const normalizedGenre = g
      .toLowerCase()
      .replace(/ç/g, 'c')
      .replace(/ı/g, 'i')
      .replace(/ş/g, 's')
      .replace(/ü/g, 'u')
      .replace(/ö/g, 'o')
      .replace(/ğ/g, 'g')
      .replace(/\s+/g, '');
    
    // Çeviri anahtarını oluştur
    const translationKey = `genres.${normalizedGenre}`;
    const translated = t(translationKey);
    
    // Eğer çeviri bulunamazsa orijinal değeri döndür
    return translated !== translationKey ? translated : g;
  });
  
  return translatedGenres.join(', ');
};

const borrowFormSchema = insertBorrowingSchema.extend({
  borrowDate: z.string({ required_error: "Lütfen ödünç alma tarihi giriniz" }),
  dueDate: z.string({ required_error: "Lütfen son iade tarihi giriniz" }),
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
  const isMobile = useIsMobile();

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
      borrowDate: borrowing?.borrowDate
        ? new Date(borrowing.borrowDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      dueDate: borrowing?.dueDate
        ? new Date(borrowing.dueDate).toISOString().split('T')[0]
        : defaultDueDate,
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

  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = (data: BorrowFormData) => {
    setFormError(null);
    // Validation: bookId and userId must not be 0
    if (!data.bookId || !data.userId) {
      setFormError(t("borrowing.pleaseSelectBookAndMember") || "Lütfen kitap ve üye seçiniz.");
      return;
    }
    // Status mapping: map Turkish display values to backend values if needed
    let status = data.status;
    if (status === "İade Edildi" || status === t("borrowing.returned")) {
      status = "returned";
    } else if (status === "Gecikmiş" || status === t("borrowing.overdue")) {
      status = "overdue";
    } else if (status === "Devam Ediyor" || status === t("borrowing.borrowed")) {
      status = "borrowed";
    }
    // Validation: status must be one of the allowed values
    const allowedStatuses = ["borrowed", "returned", "overdue"];
    if (status && !allowedStatuses.includes(status)) {
      setFormError(t("borrowing.invalidStatus") || "Geçersiz ödünç alma durumu.");
      return;
    }
    // Convert borrowDate and dueDate to Date objects
    let borrowDate: Date | undefined = undefined;
    let dueDate: Date | undefined = undefined;
    if (data.borrowDate) {
      borrowDate = new Date(data.borrowDate);
    }
    if (data.dueDate) {
      dueDate = new Date(data.dueDate);
    }
    mutation.mutate({ ...data, status, borrowDate, dueDate } as any);
  };

  // Artık adminler de ödünç alabilir, filtreleme yok
  const selectableUsers = users;

  type MemberOptionType = { value: number; label: string };
  const memberOptions: MemberOptionType[] = selectableUsers.map((user) => ({
    value: user.id,
    label: `${user.name} (${user.email})`
  }));

  type BookOptionType = { value: number; label: string; isDisabled: boolean };
  const bookOptions: BookOptionType[] = books.map((book) => ({
    value: book.id,
    label: `${book.title} - ${book.author} - ${translateGenre(book.genre, t)} (${book.availableCopies}/${book.totalCopies} ${t('books.availableCopies')})`,
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
    <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-6 p-2 ${isMobile ? 'overflow-y-auto max-h-[calc(100vh-2rem)] pb-20' : ''}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="userId" className="font-semibold text-gray-800">{t("borrowing.member")} *</Label>
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
            classNamePrefix="react-select"
            styles={{
              control: (base) => ({ ...base, borderRadius: 8, boxShadow: '0 1px 2px #e5e7eb', borderColor: '#d1d5db', minHeight: 42 }),
              menu: (base) => ({ ...base, borderRadius: 8, zIndex: 20 }),
            }}
          />
          {form.formState.errors.userId && (
            <p className="text-xs text-red-500 mt-0.5">{t("borrowing.pleaseSelectMember")}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="bookId" className="font-semibold text-gray-800">{t("borrowing.book")} *</Label>
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
            classNamePrefix="react-select"
            styles={{
              control: (base) => ({ ...base, borderRadius: 8, boxShadow: '0 1px 2px #e5e7eb', borderColor: '#d1d5db', minHeight: 42 }),
              menu: (base) => ({ ...base, borderRadius: 8, zIndex: 20 }),
            }}
          />
          {form.formState.errors.bookId && (
            <p className="text-xs text-red-500 mt-0.5">{t("borrowing.pleaseSelectBook")}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="borrowDate" className="font-semibold text-gray-800">{t("borrowing.borrowDate")} *</Label>
          <Input
            id="borrowDate"
            type="date"
            {...form.register("borrowDate", { valueAsDate: false })}
            className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          />
          {form.formState.errors.borrowDate && (
            <p className="text-xs text-red-500 mt-0.5">{form.formState.errors.borrowDate.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="dueDate" className="font-semibold text-gray-800">{t("borrowing.dueDate")} *</Label>
          <Input
            id="dueDate"
            type="date"
            {...form.register("dueDate", { valueAsDate: false })}
            className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          />
          {form.formState.errors.dueDate && (
            <p className="text-xs text-red-500 mt-0.5">{form.formState.errors.dueDate.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="status" className="font-semibold text-gray-800">{t("borrowing.status")} *</Label>
          <Select
            options={statusOptions}
            value={statusOptions.find(option => option.value === form.watch("status"))}
            onChange={(option: SingleValue<StatusOptionType>) => form.setValue("status", option ? option.value : "borrowed")}
            placeholder={t("borrowing.selectStatus")}
            isClearable={false}
            classNamePrefix="react-select"
            styles={{
              control: (base) => ({ ...base, borderRadius: 8, boxShadow: '0 1px 2px #e5e7eb', borderColor: '#d1d5db', minHeight: 42 }),
              menu: (base) => ({ ...base, borderRadius: 8, zIndex: 20 }),
            }}
          />
          {form.formState.errors.status && (
            <p className="text-xs text-red-500 mt-0.5">{form.formState.errors.status.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes" className="font-semibold text-gray-800">{t("borrowing.notes")}</Label>
        <Textarea
          id="notes"
          {...form.register("notes")}
          placeholder={t("borrowing.notesPlaceholder")}
          rows={3}
          className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
        />
      </div>

      {formError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600 font-medium">{formError}</p>
        </div>
      )}

      <div className={`flex justify-end space-x-3 pt-6 ${isMobile ? 'sticky bottom-0 bg-white border-t pt-4 pb-4 -mx-2 px-2' : ''}`}>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          size="lg"
          className="font-medium shadow-sm hover:shadow-md"
        >
          {t("common.cancel")}
        </Button>
        <Button 
          type="submit" 
          variant="gradient"
          disabled={mutation.isPending} 
          size="lg"
          className="font-semibold shadow-lg hover:shadow-xl"
        >
          {mutation.isPending ? t("common.saving", "Kaydediliyor...") : isEditing ? t("borrowing.editBorrowing") : t("borrowing.addBorrowing")}
        </Button>
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-600 mt-2 text-center font-medium">
          {t("errors.serverError")}
        </p>
      )}
    </form>
  );
}
