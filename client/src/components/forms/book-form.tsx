import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { insertBookSchema, type Book, type InsertBook } from "@shared/schema";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";

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

// Genre seçenekleri
const genreOptions = [
  { value: "kurgu", label: "Kurgu" },
  { value: "distopya", label: "Distopya" },
  { value: "fantastik", label: "Fantastik" },
  { value: "bilimkurgu", label: "Bilim Kurgu" },
  { value: "roman", label: "Roman" },
  { value: "cocuk", label: "Çocuk" },
  { value: "klasik", label: "Klasik" },
  { value: "novella", label: "Novella" },
  { value: "felsefe", label: "Felsefe" },
  { value: "tiyatro", label: "Tiyatro" },
  { value: "bilim", label: "Bilim" },
];

export function BookForm({ book, onSuccess, onCancel }: BookFormProps) {
  const isEditing = !!book;
  const { t } = useTranslation();
  const isMobile = useIsMobile();

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
    <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-4 sm:space-y-6 p-2 ${isMobile ? 'overflow-y-auto max-h-[calc(100vh-2rem)] pb-20' : ''}`}>
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="title" className="font-semibold text-gray-800">{t("books.name")} *</Label>
          <Input
            id="title"
            {...form.register("title")}
            placeholder={t("books.name")}
            className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          />
          {form.formState.errors.title && <p className="text-xs text-red-500 mt-0.5">{form.formState.errors.title.message}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="author" className="font-semibold text-gray-800">{t("books.author")} *</Label>
          <Input
            id="author"
            {...form.register("author")}
            placeholder={t("books.author")}
            className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          />
          {form.formState.errors.author && <p className="text-xs text-red-500 mt-0.5">{form.formState.errors.author.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="isbn" className="font-semibold text-gray-800">{t("books.isbn")}</Label>
          <Input
            id="isbn"
            {...form.register("isbn")}
            placeholder="978-0-123456-78-9"
            className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="genre" className="font-semibold text-gray-800">{t("books.genre")} *</Label>
          <Select value={form.watch("genre")} onValueChange={(value) => form.setValue("genre", value)}>
            <SelectTrigger className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition">
              <SelectValue placeholder={t("books.genre")} />
            </SelectTrigger>
            <SelectContent>
              {genreOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(`genres.${option.value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.genre && <p className="text-xs text-red-500 mt-0.5">{form.formState.errors.genre.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="publishYear" className="font-semibold text-gray-800">{t("books.publishYear")} *</Label>
          <Input
            id="publishYear"
            type="number"
            {...form.register("publishYear", { valueAsNumber: true })}
            placeholder={t("books.publishYear")}
            className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          />
          {form.formState.errors.publishYear && <p className="text-xs text-red-500 mt-0.5">{form.formState.errors.publishYear.message}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pageCount" className="font-semibold text-gray-800">{t("books.pageCount") || "Sayfa Sayısı"} *</Label>
          <Input
            id="pageCount"
            type="number"
            min="1"
            {...form.register("pageCount", { valueAsNumber: true })}
            placeholder={t("books.pageCount") || "Sayfa Sayısı"}
            className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          />
          {form.formState.errors.pageCount && <p className="text-xs text-red-500 mt-0.5">{form.formState.errors.pageCount.message}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="totalCopies" className="font-semibold text-gray-800">{t("books.totalCopies")} *</Label>
          <Input
            id="totalCopies"
            type="number"
            min="1"
            {...form.register("totalCopies", { valueAsNumber: true })}
            placeholder={t("books.totalCopies")}
            className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          />
          {form.formState.errors.totalCopies && <p className="text-xs text-red-500 mt-0.5">{form.formState.errors.totalCopies.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="availableCopies" className="font-semibold text-gray-800">{t("books.availableCopies")} *</Label>
          <Input
            id="availableCopies"
            type="number"
            min="0"
            {...form.register("availableCopies", { valueAsNumber: true })}
            placeholder={t("books.availableCopies")}
            className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          />
          {form.formState.errors.availableCopies && <p className="text-xs text-red-500 mt-0.5">{form.formState.errors.availableCopies.message}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="shelfNumber" className="font-semibold text-gray-800">{t("books.shelfNumber")} *</Label>
          <Input
            id="shelfNumber"
            {...form.register("shelfNumber")}
            placeholder={t("books.shelfNumber") + ", A1, B2, C3 vb."}
            className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          />
          {form.formState.errors.shelfNumber && <p className="text-xs text-red-500 mt-0.5">{form.formState.errors.shelfNumber.message}</p>}
        </div>
      </div>

      <div className={`flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 ${isMobile ? 'sticky bottom-0 bg-white border-t pt-4 pb-4 -mx-2 px-2' : ''}`}>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          size="lg"
          className="font-medium shadow-sm hover:shadow-md w-full sm:w-auto"
        >
          {t("common.cancel")}
        </Button>
        <Button 
          type="submit" 
          variant="gradient"
          disabled={mutation.isPending} 
          size="lg"
          className="font-semibold shadow-lg hover:shadow-xl w-full sm:w-auto"
        >
          {mutation.isPending ? t("common.saving", "Kaydediliyor...") : isEditing ? t("books.editBook") : t("books.addBook")}
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
