import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Undo2, Check, Clock, AlertTriangle, Calendar } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import type { BorrowingWithDetails } from "@shared/schema";
import { useTranslation } from "react-i18next";

export default function Returns() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBorrowing, setSelectedBorrowing] = useState<BorrowingWithDetails | null>(null);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnNotes, setReturnNotes] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: activeBorrowings = [], isLoading } = useQuery<BorrowingWithDetails[]>({
    queryKey: ["/api/borrowings/active"],
  });

  const { data: overdueBorrowings = [] } = useQuery<BorrowingWithDetails[]>({
    queryKey: ["/api/borrowings/overdue"],
  });

  const { data: allBorrowings = [] } = useQuery<BorrowingWithDetails[]>({
    queryKey: ["/api/borrowings"],
  });

  const returnBookMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PUT", `/api/borrowings/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/borrowings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/borrowings/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/borrowings/overdue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setIsReturnDialogOpen(false);
      setSelectedBorrowing(null);
      setReturnNotes("");
      toast({
        title: "Book returned",
        description: "The book has been successfully returned.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process return.",
        variant: "destructive",
      });
    },
  });

  const extendDueDateMutation = useMutation({
    mutationFn: ({ id, newDueDate }: { id: number; newDueDate: string }) => 
      apiRequest("PUT", `/api/borrowings/${id}`, { dueDate: newDueDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/borrowings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/borrowings/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/borrowings/overdue"] });
      toast({
        title: "Due date extended",
        description: "The due date has been successfully extended.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to extend due date.",
        variant: "destructive",
      });
    },
  });

  const filteredBorrowings = searchQuery.length > 2 
    ? activeBorrowings.filter((borrowing: BorrowingWithDetails) => 
        borrowing.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        borrowing.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        borrowing.book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        borrowing.book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        borrowing.book.isbn.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeBorrowings;

  const recentReturns = allBorrowings
    .filter((b: BorrowingWithDetails) => b.status === "returned")
    .sort((a: BorrowingWithDetails, b: BorrowingWithDetails) => new Date(b.returnDate!).getTime() - new Date(a.returnDate!).getTime())
    .slice(0, 10);

  const handleReturn = (borrowing: BorrowingWithDetails) => {
    setSelectedBorrowing(borrowing);
    setReturnDate(new Date().toISOString().split('T')[0]);
    setReturnNotes("");
    setIsReturnDialogOpen(true);
  };

  const handleExtendDueDate = (borrowing: BorrowingWithDetails) => {
    const newDueDate = new Date(borrowing.dueDate);
    newDueDate.setDate(newDueDate.getDate() + 7); // Extend by 7 days
    
    if (confirm(`Extend due date to ${format(newDueDate, "MMM dd, yyyy")}?`)) {
      extendDueDateMutation.mutate({
        id: borrowing.id,
        newDueDate: format(newDueDate, 'yyyy-MM-dd')
      });
    }
  };

  const confirmReturn = () => {
    if (!selectedBorrowing) return;
    
    returnBookMutation.mutate({
      id: selectedBorrowing.id,
      data: {
        status: "returned",
        returnDate: returnDate,
        notes: returnNotes || selectedBorrowing.notes
      }
    });
  };

  const getStatusBadge = (borrowing: BorrowingWithDetails) => {
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
    
    if (daysDiff < 0) {
      return `${Math.abs(daysDiff)} days overdue`;
    }
    
    if (daysDiff === 0) {
      return "Due today";
    }
    
    return `${daysDiff} days remaining`;
  };

  const activeColumns = [
    {
      key: "user.name",
      title: t("borrowing.member"),
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
      title: t("borrowing.book"),
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
      key: "dueDate",
      title: t("borrowing.dueDate"),
      sortable: true,
      render: (value: string) => format(new Date(value), "MMM dd, yyyy"),
    },
    {
      key: "status",
      title: t("borrowing.status"),
      render: (value: string, row: BorrowingWithDetails) => getStatusBadge(row),
    },
    {
      key: "daysInfo",
      title: t("borrowing.daysInfo"),
      render: (value: any, row: BorrowingWithDetails) => (
        <span className="text-sm">{getDaysInfo(row)}</span>
      ),
    },
    {
      key: "actions",
      title: t("common.actions"),
      render: (_: any, row: BorrowingWithDetails) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => handleReturn(row)}
            disabled={returnBookMutation.isPending}
          >
            <Check size={14} className="mr-1" />
            {t("returns.return")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExtendDueDate(row)}
            disabled={extendDueDateMutation.isPending}
          >
            <Calendar size={14} className="mr-1" />
            {t("returns.extend")}
          </Button>
        </div>
      ),
    },
  ];

  const recentReturnsColumns = [
    {
      key: "user.name",
      title: t("borrowing.member"),
      render: (value: string) => value,
    },
    {
      key: "book.title",
      title: t("borrowing.book"),
      render: (value: string, row: BorrowingWithDetails) => (
        <div>
          <p className="font-medium text-on-surface">{value}</p>
          <p className="text-sm text-text-muted">{row.book.author}</p>
        </div>
      ),
    },
    {
      key: "returnDate",
      title: t("returns.returnedOn"),
      render: (value: string) => format(new Date(value), "MMM dd, yyyy"),
    },
    {
      key: "status",
      title: t("borrowing.status"),
      render: (value: string, row: BorrowingWithDetails) => {
        const wasOverdue = new Date(row.returnDate!) > new Date(row.dueDate);
        return (
          <Badge variant={wasOverdue ? "destructive" : "secondary"}>
            {wasOverdue ? t("returns.returnedLate") : t("returns.returnedOnTime")}
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">{t("returns.management")}</h1>
          <p className="text-text-muted">{t("returns.managementDesc")}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold text-on-surface">
                  {activeBorrowings.length}
                </p>
                <p className="text-sm text-text-muted">{t("returns.activeBorrowings")}</p>
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
                <p className="text-sm text-text-muted">{t("returns.overdueItems")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Undo2 className="h-8 w-8 text-secondary mr-3" />
              <div>
                <p className="text-2xl font-bold text-on-surface">
                  {recentReturns.length}
                </p>
                <p className="text-sm text-text-muted">{t("returns.recentReturns")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Borrowings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("returns.activeBorrowingsTitle")}</CardTitle>
              <CardDescription>
                {t("returns.activeBorrowingsDesc")}
              </CardDescription>
            </div>
            <div className="w-80">
              <SearchInput
                placeholder={t("returns.searchPlaceholder")}
                onSearch={setSearchQuery}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredBorrowings}
            columns={activeColumns}
            loading={isLoading}
            emptyMessage={
              searchQuery.length > 2 
                ? t("returns.noActiveBorrowingsFound")
                : t("returns.noActiveBorrowingsYet")
            }
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Recent Returns */}
      <Card>
        <CardHeader>
          <CardTitle>{t("returns.recentReturnsTitle")}</CardTitle>
          <CardDescription>{t("returns.recentReturnsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={recentReturns}
            columns={recentReturnsColumns}
            emptyMessage={t("returns.noRecentReturns")}
            pageSize={5}
          />
        </CardContent>
      </Card>

      {/* Return Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("returns.processReturnTitle")}</DialogTitle>
            <DialogDescription>
              {selectedBorrowing && (
                <>
                  {t("returns.returningBook", { book: selectedBorrowing.book.title, user: selectedBorrowing.user.name })}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="returnDate">{t("returns.returnDate")}</Label>
              <Input
                id="returnDate"
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="returnNotes">{t("returns.notes")}</Label>
              <Textarea
                id="returnNotes"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder={t("returns.notesPlaceholder")}
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setIsReturnDialogOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button 
                onClick={confirmReturn}
                disabled={returnBookMutation.isPending}
              >
                {returnBookMutation.isPending ? t("returns.processing") : t("returns.confirmReturn")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
