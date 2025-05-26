import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BorrowForm } from "@/components/forms/borrow-form";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, HandHeart, Clock, AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import type { BorrowingWithDetails } from "@shared/schema";

export default function Borrowing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBorrowing, setSelectedBorrowing] = useState<BorrowingWithDetails | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: borrowings = [], isLoading } = useQuery({
    queryKey: ["/api/borrowings"],
  });

  const { data: activeBorrowings = [] } = useQuery({
    queryKey: ["/api/borrowings/active"],
  });

  const { data: overdueBorrowings = [] } = useQuery({
    queryKey: ["/api/borrowings/overdue"],
  });

  const deleteBorrowingMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/borrowings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/borrowings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/borrowings/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/borrowings/overdue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Borrowing deleted",
        description: "The borrowing record has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete borrowing record.",
        variant: "destructive",
      });
    },
  });

  const filteredBorrowings = searchQuery.length > 2 
    ? borrowings.filter(borrowing => 
        borrowing.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        borrowing.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        borrowing.book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        borrowing.book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        borrowing.book.isbn.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : borrowings;

  const handleEdit = (borrowing: BorrowingWithDetails) => {
    setSelectedBorrowing(borrowing);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this borrowing record?")) {
      deleteBorrowingMutation.mutate(id);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedBorrowing(null);
    queryClient.invalidateQueries({ queryKey: ["/api/borrowings"] });
    queryClient.invalidateQueries({ queryKey: ["/api/borrowings/active"] });
    queryClient.invalidateQueries({ queryKey: ["/api/borrowings/overdue"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    toast({
      title: selectedBorrowing ? "Borrowing updated" : "Borrowing created",
      description: `The borrowing has been successfully ${selectedBorrowing ? "updated" : "created"}.`,
    });
  };

  const getStatusBadge = (borrowing: BorrowingWithDetails) => {
    if (borrowing.status === "returned") {
      return <Badge variant="secondary">Returned</Badge>;
    }
    
    const today = new Date();
    const dueDate = new Date(borrowing.dueDate);
    
    if (today > dueDate) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    
    const daysUntilDue = differenceInDays(dueDate, today);
    if (daysUntilDue <= 3) {
      return <Badge variant="outline" className="border-accent text-accent">Due Soon</Badge>;
    }
    
    return <Badge variant="default">Active</Badge>;
  };

  const getDaysInfo = (borrowing: BorrowingWithDetails) => {
    const today = new Date();
    const dueDate = new Date(borrowing.dueDate);
    const daysDiff = differenceInDays(dueDate, today);
    
    if (borrowing.status === "returned") {
      return format(new Date(borrowing.returnDate!), "MMM dd, yyyy");
    }
    
    if (daysDiff < 0) {
      return `${Math.abs(daysDiff)} days overdue`;
    }
    
    if (daysDiff === 0) {
      return "Due today";
    }
    
    return `${daysDiff} days remaining`;
  };

  const columns = [
    {
      key: "user.name",
      title: "Member",
      sortable: true,
      render: (value: string, row: BorrowingWithDetails) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
            <span className="text-sm font-medium text-primary">
              {value.split(' ').map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-on-surface">{value}</p>
            <p className="text-sm text-text-muted">{row.user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "book.title",
      title: "Book",
      sortable: true,
      render: (value: string, row: BorrowingWithDetails) => (
        <div>
          <p className="font-medium text-on-surface">{value}</p>
          <p className="text-sm text-text-muted">{row.book.author}</p>
          <p className="text-xs text-text-muted font-mono">{row.book.isbn}</p>
        </div>
      ),
    },
    {
      key: "borrowDate",
      title: "Borrowed",
      sortable: true,
      render: (value: string) => format(new Date(value), "MMM dd, yyyy"),
    },
    {
      key: "dueDate",
      title: "Due Date",
      sortable: true,
      render: (value: string) => format(new Date(value), "MMM dd, yyyy"),
    },
    {
      key: "status",
      title: "Status",
      render: (value: string, row: BorrowingWithDetails) => getStatusBadge(row),
    },
    {
      key: "daysInfo",
      title: "Days Info",
      render: (value: any, row: BorrowingWithDetails) => (
        <span className="text-sm">{getDaysInfo(row)}</span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (_: any, row: BorrowingWithDetails) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row)}
          >
            <Edit size={16} />
          </Button>
          {user?.isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(row.id)}
              disabled={deleteBorrowingMutation.isPending}
            >
              <Trash2 size={16} />
            </Button>
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
          <h1 className="text-2xl font-bold text-on-surface">Borrowing System</h1>
          <p className="text-text-muted">Manage book borrowings and track due dates</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedBorrowing(null)}>
              <Plus size={16} className="mr-2" />
              New Borrowing
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedBorrowing ? "Edit Borrowing" : "Create New Borrowing"}
              </DialogTitle>
              <DialogDescription>
                {selectedBorrowing 
                  ? "Update the borrowing information below." 
                  : "Create a new book borrowing record."
                }
              </DialogDescription>
            </DialogHeader>
            <BorrowForm
              borrowing={selectedBorrowing}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedBorrowing(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HandHeart className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold text-on-surface">
                  {activeBorrowings.length}
                </p>
                <p className="text-sm text-text-muted">Active Borrowings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-accent mr-3" />
              <div>
                <p className="text-2xl font-bold text-on-surface">
                  {activeBorrowings.filter(b => {
                    const daysUntilDue = differenceInDays(new Date(b.dueDate), new Date());
                    return daysUntilDue <= 3 && daysUntilDue >= 0;
                  }).length}
                </p>
                <p className="text-sm text-text-muted">Due Soon (3 days)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-destructive mr-3" />
              <div>
                <p className="text-2xl font-bold text-on-surface">
                  {overdueBorrowings.length}
                </p>
                <p className="text-sm text-text-muted">Overdue Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Borrowings Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Borrowings</CardTitle>
              <CardDescription>
                {filteredBorrowings.length} borrowing records
              </CardDescription>
            </div>
            <div className="w-80">
              <SearchInput
                placeholder="Search by member, book title, author, or ISBN..."
                onSearch={setSearchQuery}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredBorrowings}
            columns={columns}
            loading={isLoading}
            emptyMessage={
              searchQuery.length > 2 
                ? "No borrowings found matching your search." 
                : "No borrowing records yet."
            }
            pageSize={10}
          />
        </CardContent>
      </Card>
    </div>
  );
}
