import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, ServerDataTable, type PaginatedResponse } from "@/components/ui/data-table";
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
import { tr as trLocale } from "date-fns/locale";
import type { BorrowingWithDetails } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Link } from "wouter";
import LoadingScreen from "@/components/ui/loading-screen";
import { capitalizeWords } from "@/lib/utils";

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

export default function Returns() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBorrowing, setSelectedBorrowing] = useState<BorrowingWithDetails | null>(null);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnNotes, setReturnNotes] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [borrowingToExtend, setBorrowingToExtend] = useState<BorrowingWithDetails | null>(null);
  const [newDueDate, setNewDueDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  // Server-side pagination
  const { data: paginatedActiveBorrowings, isLoading: isLoadingActive } = useQuery<PaginatedResponse<BorrowingWithDetails>>({
    queryKey: ["/api/borrowings/active", { page: currentPage, limit: 10 }],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/borrowings/active?page=${currentPage}&limit=10`);
      if (!res.ok) throw new Error("Aktif iadeler yüklenemedi");
      return res.json();
    },
  });
  const { data: paginatedOverdueBorrowings, isLoading: isLoadingOverdue } = useQuery<PaginatedResponse<BorrowingWithDetails>>({
    queryKey: ["/api/borrowings/overdue", { page: currentPage, limit: 10 }],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/borrowings/overdue?page=${currentPage}&limit=10`);
      if (!res.ok) throw new Error("Gecikmiş iadeler yüklenemedi");
      return res.json();
    },
  });

  const { data: allBorrowings = [] } = useQuery<BorrowingWithDetails[]>({
    queryKey: ["/api/borrowings"],
  });

  // Server-side search (kitaplar sayfası mantığı)
  const { data: searchResults = [] } = useQuery<BorrowingWithDetails[]>({
    queryKey: ["/api/borrowings/active/search", { q: searchQuery }],
    enabled: searchQuery.length > 0,
    queryFn: async () => {
      const res = await fetch(`/api/borrowings/active/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error("Arama başarısız");
      return res.json();
    },
  });

  // Tabloya verilecek veri
  const displayBorrowings: BorrowingWithDetails[] = searchQuery.length > 0 ? searchResults : paginatedActiveBorrowings?.data ?? [];

  // Arama kutusu değişince sayfayı sıfırla
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
  };

  const returnBookMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PUT", `/api/borrowings/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/borrowings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/borrowings/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/borrowings/overdue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities/recent"] });
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

  // Recent returns için paginatedActiveBorrowings.data kullanılabilir veya allBorrowings ile devam edilebilir
  const recentReturns = allBorrowings
    .filter((b: BorrowingWithDetails) => b.status === "returned")
    .sort((a: BorrowingWithDetails, b: BorrowingWithDetails) => new Date(b.returnDate!).getTime() - new Date(a.returnDate!).getTime());

  const handleReturn = (borrowing: BorrowingWithDetails) => {
    setSelectedBorrowing(borrowing);
    setReturnDate(new Date().toISOString().split('T')[0]);
    setReturnNotes("");
    setIsReturnDialogOpen(true);
  };

  const handleExtendDueDate = (borrowing: BorrowingWithDetails) => {
    const newDue = new Date(borrowing.dueDate);
    newDue.setDate(newDue.getDate() + 7);
    setBorrowingToExtend(borrowing);
    setNewDueDate(format(newDue, "yyyy-MM-dd"));
    setExtendDialogOpen(true);
  };

  const confirmReturn = () => {
    if (!selectedBorrowing) return;
    
    returnBookMutation.mutate({
      id: selectedBorrowing.id,
      data: {
        status: "returned",
        notes: returnNotes || selectedBorrowing.notes
      }
    });
  };

  const confirmExtendDueDate = () => {
    if (borrowingToExtend && newDueDate) {
      extendDueDateMutation.mutate({
        id: borrowingToExtend.id,
        newDueDate: newDueDate
      });
      setExtendDialogOpen(false);
      setBorrowingToExtend(null);
    }
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
            <Link to={`/members/${row.user.id}`} className="font-medium text-on-surface hover:underline hover:text-primary transition-colors">
              {value}
            </Link>
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
          <p className="font-medium text-on-surface">{capitalizeWords(value)}</p>
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
            variant="gradientGreen"
            size="sm"
            onClick={() => handleReturn(row)}
            disabled={returnBookMutation.isPending}
            className="font-medium shadow-sm hover:shadow-md"
          >
            <Check size={14} className="mr-1" />
            {t("returns.return")}
          </Button>
          <Button
            variant="modern"
            size="sm"
            onClick={() => handleExtendDueDate(row)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            // disabled={extendDueDateMutation.isPending}
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
          <p className="font-medium text-on-surface">{capitalizeWords(value)}</p>
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

  if (isLoadingActive) {
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
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        {/* Başlık ve açıklama kaldırıldı, sadece header'da görünecek */}
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold text-on-surface">
                  {paginatedActiveBorrowings?.pagination?.total ?? 0}
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
                  {paginatedOverdueBorrowings?.pagination?.total ?? 0}
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
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("returns.activeBorrowingsTitle")}</CardTitle>
                <CardDescription>
                  {paginatedActiveBorrowings?.pagination?.total ?? 0} {t("returns.activeBorrowingsDesc")}
                </CardDescription>
              </div>
              <div className="w-80">
                <SearchInput
                  placeholder={t("returns.searchPlaceholder")}
                  onSearch={handleSearch}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {searchQuery.length > 0 ? (
              <DataTable
                data={displayBorrowings}
                columns={activeColumns}
                loading={isLoadingActive}
                emptyMessage={
                  searchQuery.length > 0 
                    ? t("returns.noActiveBorrowingsFound")
                    : t("returns.noActiveBorrowingsYet")
                }
                pageSize={10}
              />
            ) : (
              <ServerDataTable
                data={paginatedActiveBorrowings!}
                columns={activeColumns}
                loading={isLoadingActive}
                emptyMessage={t("returns.noActiveBorrowingsYet")}
                onPageChange={setCurrentPage}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>
      {/* Recent Returns */}
      <motion.div variants={itemVariants}>
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
              pageSize={10}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Return Dialog */}
      {isReturnDialogOpen && (
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
      )}

      {/* Süre Uzatma Onay Dialogu */}
      <AlertDialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("returns.extend")}</AlertDialogTitle>
            <AlertDialogDescription>
              {borrowingToExtend && (
                <>
                  {t("Süreyi şu tarihe uzatmak istediğinize emin misiniz?")}<br />
                  <span className="font-semibold">{format(new Date(newDueDate), "PPP", { locale: trLocale })}</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExtendDueDate}>{t("common.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
