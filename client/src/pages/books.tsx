import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookForm } from "@/components/forms/book-form";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Book as BookIcon } from "lucide-react";
import type { Book } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

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

export default function Books() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: books = [], isLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  const { data: searchResults = [] } = useQuery<Book[]>({
    queryKey: [`/api/books/search?q=${encodeURIComponent(searchQuery)}`],
    enabled: searchQuery.length > 2,
  });

  const deleteBookMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/books/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({
        title: "Book deleted",
        description: "The book has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete book.",
        variant: "destructive",
      });
    },
  });

  const displayBooks: Book[] = searchQuery.length > 2 ? searchResults : books;

  const handleEdit = (book: Book) => {
    setSelectedBook(book);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this book?")) {
      deleteBookMutation.mutate(id);
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
          <p className="font-medium text-on-surface">{value}</p>
          <p className="text-sm text-text-muted">{row.author}</p>
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
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(row)}
              >
                <Edit size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(row.id)}
                disabled={deleteBookMutation.isPending}
              >
                <Trash2 size={16} />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">{t("books.management")}</h1>
          <p className="text-text-muted">{t("books.managementDesc")}</p>
        </div>
        {user?.isAdmin && (
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedBook(null)}>
                <Plus size={16} className="mr-2" />
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
                  {books.reduce((sum, book) => sum + book.totalCopies, 0)}
                </p>
                <p className="text-sm text-text-muted">{t("books.totalCopies")}</p>
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
                  {books.reduce((sum, book) => sum + book.availableCopies, 0)}
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
                  {new Set(books.flatMap(book => book.genre.split(',').map(g => g.trim()))).size}
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
                  {displayBooks.length} {t("books.inCollection")}
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
            <DataTable
              data={displayBooks}
              columns={columns}
              loading={isLoading}
              emptyMessage={
                searchQuery.length > 2 
                  ? t("books.noBooksFound")
                  : t("books.noBooksYet")
              }
              pageSize={10}
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
