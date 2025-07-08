import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, ServerDataTable, type PaginatedResponse } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BorrowForm } from "@/components/forms/borrow-form";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, HandHeart, Clock, AlertTriangle, Filter } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { format, differenceInDays } from "date-fns";
import type { BorrowingWithDetails } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useSearch, useLocation } from "wouter";
import { Link } from "react-router-dom";
import { capitalizeWords } from "@/lib/utils";
import LoadingScreen from "@/components/ui/loading-screen";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

export default function Borrowing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBorrowing, setSelectedBorrowing] = useState<BorrowingWithDetails | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [borrowingToDelete, setBorrowingToDelete] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const search = useSearch();
  const [location, setLocation] = useLocation();

  const urlParams = new URLSearchParams(search);
  const filter = urlParams.get("filter");

  // statusFilter'ı URL'deki filter parametresiyle senkronize et
  useEffect(() => {
    if (filter && filter !== statusFilter) {
      setStatusFilter(filter);
      setCurrentPage(1);
    }
    if (!filter && statusFilter !== "all") {
      setStatusFilter("all");
      setCurrentPage(1);
    }
    // eslint-disable-next-line
  }, [filter]);

  // Server-side pagination queries
  const { data: allBorrowingsData, isLoading: isLoadingAll } = useQuery<PaginatedResponse<BorrowingWithDetails>>({
    queryKey: ["/api/borrowings", { page: currentPage, limit: 10 }],
    enabled: !filter,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/borrowings?page=${currentPage}&limit=10`);
      const data = await response.json();
      if (Array.isArray(data)) {
        return {
          data,
          pagination: {
            page: 1,
            limit: data.length,
            total: data.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          }
        };
      }
      return data;
    }
  });

  const { data: activeBorrowingsData, isLoading: isLoadingActive } = useQuery<PaginatedResponse<BorrowingWithDetails>>({
    queryKey: ["/api/borrowings/active", { page: currentPage, limit: 10 }],
    enabled: filter === "active",
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/borrowings/active?page=${currentPage}&limit=10`);
      const data = await response.json();
      if (Array.isArray(data)) {
        return {
          data,
          pagination: {
            page: 1,
            limit: data.length,
            total: data.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          }
        };
      }
      return data;
    }
  });

  const { data: overdueBorrowingsData, isLoading: isLoadingOverdue } = useQuery<PaginatedResponse<BorrowingWithDetails>>({
    queryKey: ["/api/borrowings/overdue", { page: currentPage, limit: 10 }],
    enabled: filter === "overdue",
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/borrowings/overdue?page=${currentPage}&limit=10`);
      const data = await response.json();
      if (Array.isArray(data)) {
        return {
          data,
          pagination: {
            page: 1,
            limit: data.length,
            total: data.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          }
        };
      }
      return data;
    }
  });

  const { data: returnedBorrowingsData, isLoading: isLoadingReturned } = useQuery<PaginatedResponse<BorrowingWithDetails>>({
    queryKey: ["/api/borrowings/returned", { page: currentPage, limit: 10 }],
    enabled: filter === "returned",
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/borrowings/returned?page=${currentPage}&limit=10`);
      const data = await response.json();
      if (Array.isArray(data)) {
        return {
          data,
          pagination: {
            page: 1,
            limit: data.length,
            total: data.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          }
        };
      }
      return data;
    }
  });

  // Fallback to non-paginated data for backward compatibility
  const { data: allBorrowings = [], isLoading: isLoadingAllLegacy } = useQuery<BorrowingWithDetails[]>({
    queryKey: ["/api/borrowings"],
    enabled: !filter && !allBorrowingsData,
  });

  const { data: activeBorrowings = [], isLoading: isLoadingActiveLegacy } = useQuery<BorrowingWithDetails[]>({
    queryKey: ["/api/borrowings/active"],
    enabled: filter === "active" && !activeBorrowingsData,
  });

  const { data: overdueBorrowings = [], isLoading: isLoadingOverdueLegacy } = useQuery<BorrowingWithDetails[]>({
    queryKey: ["/api/borrowings/overdue"],
    enabled: filter === "overdue" && !overdueBorrowingsData,
  });

  // borrowingsData seçiminde statusFilter === 'returned' ise returnedBorrowingsData kullan
  const borrowingsData = filter === "overdue" ? overdueBorrowingsData : (filter === "active" ? activeBorrowingsData : (filter === "returned" ? returnedBorrowingsData : allBorrowingsData));
  const borrowings = filter === "overdue" ? overdueBorrowings : (filter === "active" ? activeBorrowings : allBorrowings);
  const isLoading = isLoadingAll || isLoadingActive || isLoadingOverdue || isLoadingAllLegacy || isLoadingActiveLegacy || isLoadingOverdueLegacy;

  const deleteBorrowingMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/borrowings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/borrowings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/borrowings/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/borrowings/overdue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
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

  const filteredBorrowings = borrowings.filter((borrowing: BorrowingWithDetails) => 
    searchQuery.length === 0 ||
    borrowing.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (borrowing.user.email && borrowing.user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    borrowing.book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    borrowing.book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (borrowing.book.isbn?.toLowerCase() ?? "").includes(searchQuery.toLowerCase())
  );

  const statusFilteredBorrowings = statusFilter === "all"
    ? filteredBorrowings
    : filteredBorrowings.filter(b => {
        if (statusFilter === "active") return b.status === "borrowed";
        if (statusFilter === "overdue") return b.status === "overdue" || (b.status === "borrowed" && new Date(b.dueDate) < new Date() && !b.returnDate);
        if (statusFilter === "returned") return b.status === "returned";
        return true;
      });

  // Server-side search (kitaplar mantığı)
  const { data: searchResults = [] } = useQuery<BorrowingWithDetails[]>({
    queryKey: ["/api/borrowings/search", { q: searchQuery }],
    enabled: searchQuery.length > 0,
    queryFn: async () => {
      const res = await fetch(`/api/borrowings/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error("Arama başarısız");
      return res.json();
    },
  });

  // Tabloya verilecek veri
  const displayBorrowings: BorrowingWithDetails[] = searchQuery.length > 0 ? searchResults : (borrowingsData?.data ?? []);

  // Arama kutusu değişince sayfayı sıfırla
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
  };

  const handleEdit = (borrowing: BorrowingWithDetails) => {
    setSelectedBorrowing(borrowing);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    setBorrowingToDelete(id);
    setDeleteDialogOpen(true);
  };
  const confirmDelete = () => {
    if (borrowingToDelete !== null) {
      deleteBorrowingMutation.mutate(borrowingToDelete);
      setDeleteDialogOpen(false);
      setBorrowingToDelete(null);
    }
  };
  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setBorrowingToDelete(null);
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
      const wasOverdue = new Date(borrowing.returnDate!) > new Date(borrowing.dueDate);
      return (
        <Badge variant={wasOverdue ? "destructive" : "secondary"}>
          {wasOverdue ? t("borrowing.returnedLate") : t("borrowing.statusReturned")}
        </Badge>
      );
    }
    
    const today = new Date();
    const dueDate = new Date(borrowing.dueDate);
    
    if (today > dueDate) {
      return <Badge variant="destructive">{t("borrowing.statusOverdue")}</Badge>;
    }
    
    const daysUntilDue = differenceInDays(dueDate, today);
    if (daysUntilDue <= 3) {
      return <Badge variant="outline" className="border-accent text-accent">{t("borrowing.statusDueSoon")}</Badge>;
    }
    
    return <Badge variant="default">{t("borrowing.statusActive")}</Badge>;
  };

  const getDaysInfo = (borrowing: BorrowingWithDetails) => {
    const today = new Date();
    const dueDate = new Date(borrowing.dueDate);
    const daysDiff = differenceInDays(dueDate, today);
    
    if (borrowing.status === "returned") {
      return format(new Date(borrowing.returnDate!), "dd MMM yyyy");
    }
    
    if (daysDiff < 0) {
      const count = Math.abs(daysDiff);
      return t(count === 1 ? "borrowing.dayOverdue" : "borrowing.daysOverdue", { count });
    }
    
    if (daysDiff === 0) {
      return t("borrowing.dueToday");
    }
    
    const count = daysDiff;
    return t(count === 1 ? "borrowing.dayRemaining" : "borrowing.daysRemaining", { count });
  };

  const columns = [
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
              {capitalizeWords(value)}
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
          <p className="text-sm text-text-muted">{capitalizeWords(row.book.author)}</p>
          <p className="text-xs text-text-muted font-mono">{row.book.isbn ?? "-"}</p>
        </div>
      ),
    },
    {
      key: "borrowDate",
      title: t("borrowing.borrowDate"),
      sortable: true,
      render: (value: string) => format(new Date(value), "dd MMM yyyy"),
    },
    {
      key: "dueDate",
      title: t("borrowing.dueDate"),
      sortable: true,
      render: (value: string) => format(new Date(value), "dd MMM yyyy"),
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
      title: t("borrowing.actions"),
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
            <AlertDialog open={deleteDialogOpen && borrowingToDelete === row.id} onOpenChange={(open) => {
              if (!open) cancelDelete();
            }}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(row.id)}
                  disabled={deleteBorrowingMutation.isPending}
                >
                  <Trash2 size={16} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("borrowing.deleteTitle", "Ödünç Alma Kaydını Sil")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("borrowing.deleteDescription", "Bu ödünç alma kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={cancelDelete}>{t("common.cancel", "İptal")}</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDelete} disabled={deleteBorrowingMutation.isPending}>
                    {t("borrowing.deleteConfirm", "Sil")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      ),
    },
  ];

  // statusFilter değiştiğinde hem currentPage'i 1 yap hem de URL'deki filter parametresini güncelle
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
    // URL'deki filter parametresini güncelle
    const params = new URLSearchParams(search);
    if (value === "all") {
      params.delete("filter");
    } else {
      params.set("filter", value);
    }
    setLocation(`/borrowing${params.toString() ? `?${params.toString()}` : ""}`);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  console.log('searchQuery:', searchQuery);
  console.log('searchResults:', searchResults);
  console.log('displayBorrowings:', displayBorrowings);
  console.log('borrowingsData:', borrowingsData);
  console.log('columns:', columns);

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex gap-4 items-center">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="overdue">Gecikmiş</SelectItem>
              <SelectItem value="returned">İade Edildi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedBorrowing(null)}>
              <Plus size={16} className="mr-2" />
              {t("borrowing.newBorrowing")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedBorrowing ? t("borrowing.editBorrowing") : t("borrowing.createBorrowing")}
              </DialogTitle>
              <DialogDescription>
                {selectedBorrowing 
                  ? t("borrowing.updateBorrowingInfo")
                  : t("borrowing.createBorrowingDesc")
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
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HandHeart className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold text-on-surface">
                  {activeBorrowings.length}
                </p>
                <p className="text-sm text-text-muted">{t("borrowing.activeBorrowings")}</p>
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
                <p className="text-sm text-text-muted">{t("borrowing.dueSoon")}</p>
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
                <p className="text-sm text-text-muted">{t("borrowing.overdueItems")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Borrowings Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("borrowing.allBorrowings")}</CardTitle>
                <CardDescription>
                  {statusFilteredBorrowings.length} {t("borrowing.borrowingRecords")}
                </CardDescription>
              </div>
              <div className="w-80">
                <SearchInput
                  placeholder={t("borrowing.searchPlaceholder")}
                  onSearch={handleSearch}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {searchQuery.length > 0 ? (
              <DataTable
                data={displayBorrowings}
                columns={columns}
                loading={isLoading}
                emptyMessage={
                  searchQuery.length > 0 
                    ? t("borrowing.noBorrowingsFound")
                    : t("borrowing.noBorrowingsYet")
                }
                pageSize={10}
              />
            ) : (
              <ServerDataTable
                data={borrowingsData!}
                columns={columns}
                loading={isLoading}
                emptyMessage={t("borrowing.noBorrowingsYet")}
                onPageChange={setCurrentPage}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
