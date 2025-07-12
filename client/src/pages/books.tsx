import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, ServerDataTable, type PaginatedResponse } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BookForm } from "@/components/forms/book-form";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Book as BookIcon } from "lucide-react";
import type { Book } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { capitalizeWords } from "@/lib/utils";
import LoadingScreen from "@/components/ui/loading-screen";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

function getFriendlyDeleteErrorMessage(error: string) {
  if (!error) return "Bilinmeyen bir hata oluştu.";

  if (
    error.includes("violates foreign key constraint") ||
    error.includes("borrowings_book_id_books_id_fk")
  ) {
    return "Bu kitap şu anda ödünçte veya geçmişte ödünç alınmış. Kitap silinemez.";
  }

  if (
    error.includes("not found") ||
    error.includes("Book with id") ||
    error.includes("404")
  ) {
    return "Kitap bulunamadı veya zaten silinmiş.";
  }

  if (
    error.includes("ödünç alınmış durumda") ||
    error.includes("Kitap silinemez")
  ) {
    return error; // Zaten kullanıcı dostu
  }

  // Diğer tüm durumlar için:
  return "Kitap silinemedi. Lütfen daha sonra tekrar deneyin.";
}

export default function Books() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Server-side pagination
  const { data: paginatedBooks, isLoading } = useQuery<PaginatedResponse<Book>>({
    queryKey: ["/api/books", { page: currentPage, limit: 10 }],
    enabled: searchQuery.length === 0,
    queryFn: async () => {
      const res = await fetch(`/api/books?page=${currentPage}&limit=10`, { credentials: "include" });
      if (!res.ok) throw new Error("Kitaplar yüklenemedi");
      return res.json();
    },
  });

  // Arama yapılıyorsa eski client-side arama ile devam
  const { data: searchResults = [] } = useQuery<Book[]>({
    queryKey: [`/api/books/search?q=${encodeURIComponent(searchQuery)}`, { page: currentPage }],
    enabled: searchQuery.length > 0,
  });

  const displayBooks: Book[] = searchQuery.length > 0 ? searchResults : paginatedBooks?.data ?? [];

  // Debug için console.log
  console.log('Search Query:', searchQuery);
  console.log('Search Results:', searchResults);
  console.log('Display Books:', displayBooks);

  // Search query değiştiğinde currentPage'i sıfırla
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const deleteBookMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/books/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Kitap silinemedi");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setBookToDelete(null);
      setDeleteError(null);
      toast({
        title: t("books.deleteSuccess"),
        description: t("books.deleteSuccess"),
      });
    },
    onError: (error: any) => {
      setDeleteError(getFriendlyDeleteErrorMessage(error.message || t("errors.serverError")));
    },
  });

  const handleEdit = (book: Book) => {
    setSelectedBook(book);
    setIsFormOpen(true);
  };

  const handleDelete = (book: Book) => {
    setBookToDelete(book);
  };

  const confirmDelete = () => {
    if (bookToDelete) {
      setDeleteError(null);
      deleteBookMutation.mutate(bookToDelete.id);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedBook(null);
    queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    toast({
      title: selectedBook ? "Book updated" : "Book created",
      description: `The book has been successfully ${selectedBook ? "updated" : "created"}.`,
    });
  };

  const columns = [
    {
      key: "title",
      title: t("books.name"),
      sortable: true,
      render: (value: string, row: Book) => (
        <div>
          <p className="font-medium text-on-surface">{capitalizeWords(value)}</p>
          <p className="text-sm text-text-muted">{capitalizeWords(row.author)}</p>
        </div>
      ),
    },
    {
      key: "isbn",
      title: t("books.isbn"),
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      ),
    },
    {
      key: "genre",
      title: t("books.genre"),
      sortable: true,
      render: (value: string) => (
        <Badge variant="secondary">{value}</Badge>
      ),
    },
    {
      key: "publishYear",
      title: t("books.publishYear"),
      sortable: true,
    },
    {
      key: "shelfNumber",
      title: t("books.shelfNumber"),
    },
    {
      key: "pageCount",
      title: t("books.pageCount"),
      sortable: true,
      render: (value: number) => (
        <span>{value || "-"}</span>
      ),
    },
    {
      key: "availableCopies",
      title: t("books.availableCopies"),
      render: (value: number, row: Book) => (
        <div className="text-center">
          <span className={value > 0 ? "text-secondary" : "text-destructive"}>
            {value}
          </span>
          <span className="text-text-muted">/{row.totalCopies}</span>
        </div>
      ),
    },
    {
      key: "actions",
      title: t("books.actions"),
      render: (_: any, row: Book) => (
        <div className="flex items-center space-x-2">
          {user?.isAdmin && (
            <>
              <Button
                variant="modern"
                size="sm"
                onClick={() => handleEdit(row)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Edit size={16} />
              </Button>
              <Button
                variant="modern"
                size="sm"
                onClick={() => handleDelete(row)}
                disabled={deleteBookMutation.isPending}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 size={16} />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-end">
        {user?.isAdmin && (
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="gradient" 
                size="lg"
                onClick={() => setSelectedBook(null)}
                className="font-semibold shadow-lg hover:shadow-xl"
              >
                <Plus size={18} className="mr-2" />
                {t("books.addBook")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedBook ? t("books.editBook") : t("books.addNewBook")}
                </DialogTitle>
                <DialogDescription>
                  {selectedBook 
                    ? t("books.updateBookInfo")
                    : t("books.enterNewBook")
                  }
                </DialogDescription>
              </DialogHeader>
              <BookForm
                book={selectedBook}
                onSuccess={handleFormSuccess}
                onCancel={() => {
                  setIsFormOpen(false);
                  setSelectedBook(null);
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookIcon className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold text-on-surface">
                  {paginatedBooks?.pagination?.total ?? 0}
                </p>
                <p className="text-sm text-text-muted">{t("books.totalBooks")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookIcon className="h-8 w-8 text-secondary mr-3" />
              <div>
                <p className="text-2xl font-bold text-on-surface">
                  {paginatedBooks?.data?.reduce((sum, book) => sum + (book.availableCopies || 0), 0) ?? 0}
                </p>
                <p className="text-sm text-text-muted">{t("books.availableCopiesTotal")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookIcon className="h-8 w-8 text-accent mr-3" />
              <div>
                <p className="text-2xl font-bold text-on-surface">
                  {paginatedBooks?.data ? new Set(paginatedBooks.data.flatMap(book => book.genre.split(',').map(g => g.trim()))).size : 0}
                </p>
                <p className="text-sm text-text-muted">{t("books.uniqueGenres")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and Stats */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("books.catalog")}</CardTitle>
                <CardDescription>
                  {paginatedBooks?.pagination?.total ?? 0} {t("books.totalBooks")}
                </CardDescription>
              </div>
              <div className="w-80">
                <SearchInput
                  placeholder={t("books.searchPlaceholder")}
                  onSearch={setSearchQuery}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {searchQuery.length > 0 ? (
              <DataTable
                data={displayBooks}
                columns={columns}
                loading={isLoading}
                emptyMessage={
                  searchQuery.length > 0 
                    ? t("books.noBooksFound")
                    : t("books.noBooksYet")
                }
                pageSize={10}
              />
            ) : (
              <ServerDataTable
                data={paginatedBooks!}
                columns={columns}
                loading={isLoading}
                emptyMessage={t("books.noBooksYet")}
                onPageChange={setCurrentPage}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      {bookToDelete && (
        <Dialog open={true} onOpenChange={(open) => {
          if (!open) {
            setBookToDelete(null);
            setDeleteError(null);
          }
        }}>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>{t("books.deleteBook")}</DialogTitle>
              <div className="space-y-4">
                {deleteError && (
                  <div className="bg-red-100 text-red-700 border border-red-300 rounded px-3 py-2 text-sm">
                    {deleteError}
                  </div>
                )}
                <p>{t("books.deleteConfirm")}</p>
                <p className="font-medium text-destructive">
                  "{bookToDelete.title}" - {bookToDelete.author}
                </p>
              </div>
            </DialogHeader>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setBookToDelete(null);
                  setDeleteError(null);
                }}
                className="font-medium shadow-sm hover:shadow-md"
              >
                {t("common.cancel")}
              </Button>
              <Button
                onClick={confirmDelete}
                variant="destructive"
                size="lg"
                disabled={deleteBookMutation.isPending}
                className="font-semibold shadow-lg hover:shadow-xl"
              >
                {deleteBookMutation.isPending ? t("common.loading") : t("common.delete")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}
