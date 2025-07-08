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
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useSearch } from "wouter";
import { Link } from "react-router-dom";
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

export default function Borrowing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBorrowing, setSelectedBorrowing] = useState<BorrowingWithDetails | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const search = useSearch();

  const urlParams = new URLSearchParams(search);
  const filter = urlParams.get("filter");

  const { data: allBorrowings = [], isLoading: isLoadingAll } = useQuery<BorrowingWithDetails[]>({
    queryKey: ["/api/borrowings"],
    enabled: !filter,
  });

  const { data: activeBorrowings = [], isLoading: isLoadingActive } = useQuery<BorrowingWithDetails[]>({
    queryKey: ["/api/borrowings/active"],
    enabled: filter === "active",
  });

  const { data: overdueBorrowings = [], isLoading: isLoadingOverdue } = useQuery<BorrowingWithDetails[]>({
    queryKey: ["/api/borrowings/overdue"],
    enabled: filter === "overdue",
  });

  const borrowings = filter === "overdue" ? overdueBorrowings : (filter === "active" ? activeBorrowings : allBorrowings);
  const isLoading = isLoadingAll || isLoadingActive || isLoadingOverdue;

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

  const filteredBorrowings = borrowings.filter((borrowing: BorrowingWithDetails) => 
    searchQuery.length === 0 ||
    borrowing.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (borrowing.user.email && borrowing.user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    borrowing.book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    borrowing.book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (borrowing.book.isbn?.toLowerCase() ?? "").includes(searchQuery.toLowerCase())
  );

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
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-end">
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
                  {filteredBorrowings.length} {t("borrowing.borrowingRecords")}
                </CardDescription>
              </div>
              <div className="w-80">
                <SearchInput
                  placeholder={t("borrowing.searchPlaceholder")}
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
                  ? t("borrowing.noBorrowingsFound")
                  : t("borrowing.noBorrowingsYet")
              }
              pageSize={10}
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
