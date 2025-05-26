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

export default function Books() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["/api/books"],
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ["/api/books/search", searchQuery],
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

  const displayBooks = searchQuery.length > 2 ? searchResults : books;

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
      title: "Title",
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
      title: "ISBN",
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      ),
    },
    {
      key: "genre",
      title: "Genre",
      sortable: true,
      render: (value: string) => (
        <Badge variant="secondary">{value}</Badge>
      ),
    },
    {
      key: "publishYear",
      title: "Year",
      sortable: true,
    },
    {
      key: "shelfNumber",
      title: "Shelf",
    },
    {
      key: "availableCopies",
      title: "Available",
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
      title: "Actions",
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Book Management</h1>
          <p className="text-text-muted">Manage your library's book collection</p>
        </div>
        {user?.isAdmin && (
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedBook(null)}>
                <Plus size={16} className="mr-2" />
                Add Book
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedBook ? "Edit Book" : "Add New Book"}
                </DialogTitle>
                <DialogDescription>
                  {selectedBook 
                    ? "Update the book information below." 
                    : "Enter the details for the new book."
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
      </div>

      {/* Search and Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Book Catalog</CardTitle>
              <CardDescription>
                {displayBooks.length} books in the collection
              </CardDescription>
            </div>
            <div className="w-80">
              <SearchInput
                placeholder="Search books by title, author, ISBN, or genre..."
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
                ? "No books found matching your search." 
                : "No books in the catalog yet."
            }
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookIcon className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold text-on-surface">
                  {books.reduce((sum, book) => sum + book.totalCopies, 0)}
                </p>
                <p className="text-sm text-text-muted">Total Copies</p>
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
                <p className="text-sm text-text-muted">Available Copies</p>
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
                  {new Set(books.map(book => book.genre)).size}
                </p>
                <p className="text-sm text-text-muted">Unique Genres</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
