import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, BookOpen, Star, Calendar, Award, BarChart3, CheckCircle2, TimerReset, AlarmClockOff, History } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import type { User, BorrowingWithDetails } from "@shared/schema";
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

export default function MemberDetails() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const id = params?.id;

  const { data: member, isLoading: memberLoading } = useQuery<User>({
    queryKey: ["/api/users", id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${id}`);
      return response.json();
    },
    enabled: !!id,
  });

  const { data: borrowings = [], isLoading: borrowingsLoading } = useQuery<BorrowingWithDetails[]>({
    queryKey: ["/api/users", id, "borrowings"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${id}/borrowings`);
      return response.json();
    },
    enabled: !!id,
  });

  useEffect(() => {
    document.title = t('members.details.title') + ' | LibraryMS';
  }, [t]);

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-muted-foreground">{t('members.details.noRating')}</span>;
    
    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={14}
            className={i < rating ? "text-yellow-500 fill-current" : "text-gray-300"}
          />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">({rating}/5)</span>
      </div>
    );
  };

  const getStatusBadge = (status: string, row?: BorrowingWithDetails) => {
    // Show 'Gecikmiş' if overdue (dueDate < today, not returned)
    if (
      row &&
      status === "borrowed" &&
      !row.returnDate &&
      new Date(row.dueDate) < new Date()
    ) {
      return <Badge variant="destructive">{t('members.details.borrowings.statuses.overdue')}</Badge>;
    }
    if (
      status === "returned" &&
      row?.returnDate &&
      new Date(row.returnDate) > new Date(row.dueDate)
    ) {
      return <Badge variant="destructive">{t('members.details.borrowings.lateReturn')}</Badge>;
    }
    switch (status) {
      case "borrowed":
        return <Badge variant="default">{t('members.details.borrowings.statuses.borrowed')}</Badge>;
      case "returned":
        return <Badge variant="secondary">{t('members.details.borrowings.statuses.returned')}</Badge>;
      case "overdue":
        return <Badge variant="destructive">{t('members.details.borrowings.statuses.overdue')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const borrowingColumns = [
    {
      key: "book.title",
      title: t('members.details.borrowings.book'),
      render: (_: any, row: BorrowingWithDetails) => (
        <div className="flex items-center">
          <BookOpen className="h-4 w-4 mr-2 text-primary" />
          <div>
            <p className="font-medium">{row.book.title}</p>
            <p className="text-sm text-muted-foreground">{row.book.author}</p>
          </div>
        </div>
      ),
    },
    {
      key: "borrowDate",
      title: t('members.details.borrowings.borrowDate'),
      render: (value: string) => format(new Date(value), "dd MMM yyyy", { locale: tr }),
    },
    {
      key: "dueDate",
      title: t('members.details.borrowings.dueDate'),
      render: (value: string) => format(new Date(value), "dd MMM yyyy", { locale: tr }),
    },
    {
      key: "returnDate",
      title: t('members.details.borrowings.returnDate'),
      render: (value: string | null) =>
        value ? format(new Date(value), "dd MMM yyyy", { locale: tr }) : "-",
    },
    {
      key: "status",
      title: t('members.details.borrowings.status'),
      render: (value: string, row: BorrowingWithDetails) => getStatusBadge(value, row),
    },
  ];

  const calculateStats = () => {
    const totalBorrowed = borrowings.length;
    const returned = borrowings.filter((b: BorrowingWithDetails) => b.status === "returned").length;
    const overdue = borrowings.filter((b: BorrowingWithDetails) => b.status === "overdue").length;
    const currentlyBorrowed = borrowings.filter((b: BorrowingWithDetails) => b.status === "borrowed").length;
    
    return { totalBorrowed, returned, overdue, currentlyBorrowed };
  };

  const stats = calculateStats();

  if (memberLoading) {
    return <LoadingScreen />;
  }

  if (!member) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('members.details.memberNotFound')}</p>
        <Button onClick={() => setLocation("/members")} className="mt-4">
          {t('members.details.backToMembers')}
        </Button>
      </div>
    );
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
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/members")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft size={16} />
            <span>{t('members.details.back')}</span>
          </Button>
        </div>
      </motion.div>

      {/* Member Info Card */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-xl rounded-2xl border-0 bg-white/90 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-4">
              <Avatar className="h-16 w-16 shadow-md border-2 border-primary/30">
                <div className="h-full w-full bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </span>
                </div>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">{member.name}</h2>
                <p className="text-base text-muted-foreground">{member.email}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-primary/70" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">{t('members.details.membershipDate')}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(member.membershipDate), "dd MMMM yyyy", { locale: tr })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Award className="h-5 w-5 text-yellow-500/80" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">{t('members.details.adminRating')}</p>
                  <div className="flex items-center">{renderStars(member.adminRating)}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Award className="h-5 w-5 text-blue-500/80" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">{t('members.details.role')}</p>
                  <Badge className="px-3 py-1 rounded-full text-xs font-semibold shadow" variant={member.isAdmin ? "default" : "secondary"}>
                    {member.isAdmin ? t('members.details.admin') : t('members.details.member')}
                  </Badge>
                </div>
              </div>
            </div>
            {member.adminNotes && (
              <>
                <Separator className="my-6" />
                <div>
                  <p className="text-sm font-semibold mb-2 text-gray-700">{t('members.details.adminNotes')}</p>
                  <p className="text-sm text-muted-foreground">{member.adminNotes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-lg rounded-xl border-0 bg-gradient-to-br from-primary/10 to-white/80">
          <CardContent className="p-6 flex items-center space-x-4">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBorrowed}</p>
              <p className="text-sm text-muted-foreground">{t('members.details.stats.totalBorrowed')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg rounded-xl border-0 bg-gradient-to-br from-green-100/60 to-white/80">
          <CardContent className="p-6 flex items-center space-x-4">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.returned}</p>
              <p className="text-sm text-muted-foreground">{t('members.details.stats.returned')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg rounded-xl border-0 bg-gradient-to-br from-blue-100/60 to-white/80">
          <CardContent className="p-6 flex items-center space-x-4">
            <TimerReset className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.currentlyBorrowed}</p>
              <p className="text-sm text-muted-foreground">{t('members.details.stats.currentlyBorrowed')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg rounded-xl border-0 bg-gradient-to-br from-red-100/60 to-white/80">
          <CardContent className="p-6 flex items-center space-x-4">
            <AlarmClockOff className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
              <p className="text-sm text-muted-foreground">{t('members.details.stats.overdue')}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="borrowings" className="space-y-4">
        <div className="w-fit mx-auto">
          <TabsList className="relative flex gap-1 bg-muted/60 shadow rounded-xl p-1 border border-blue-100">
            <TabsTrigger
              value="borrowings"
              className="relative flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-base transition-all duration-200
                data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow
                hover:bg-blue-100/60 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <History className="w-5 h-5 mr-1" />
              {t('members.details.tabs.borrowings')}
            </TabsTrigger>
            <TabsTrigger
              value="currently-borrowed"
              className="relative flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-base transition-all duration-200
                data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow
                hover:bg-blue-100/60 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <TimerReset className="w-5 h-5 mr-1" />
              {t('members.details.tabs.currentlyBorrowed')}
            </TabsTrigger>
            <TabsTrigger
              value="overdue"
              className="relative flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-base transition-all duration-200
                data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow
                hover:bg-red-100/60 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-400/60"
            >
              <AlarmClockOff className="w-5 h-5 mr-1" />
              {t('members.details.tabs.overdue')}
            </TabsTrigger>
          </TabsList>
        </div>
        {/* Tab içerikleri ve tablolar aynı yerde kalacak */}
        <TabsContent value="borrowings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('members.details.borrowings.title')}</CardTitle>
              <CardDescription>
                {t('members.details.borrowings.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {borrowingsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : borrowings.length > 0 ? (
                <DataTable
                  data={borrowings}
                  columns={borrowingColumns}
                />
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('members.details.borrowings.noBorrowings')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="currently-borrowed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('members.details.currentlyBorrowed.title')}</CardTitle>
              <CardDescription>
                {t('members.details.currentlyBorrowed.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {borrowingsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                (() => {
                  const currentlyBorrowed = borrowings.filter((b: BorrowingWithDetails) => b.status === "borrowed");
                  return currentlyBorrowed.length > 0 ? (
                    <DataTable
                      data={currentlyBorrowed}
                      columns={borrowingColumns}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">{t('members.details.currentlyBorrowed.noBooks')}</p>
                    </div>
                  );
                })()
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('members.details.overdue.title')}</CardTitle>
              <CardDescription>
                {t('members.details.overdue.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {borrowingsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                (() => {
                  const today = new Date();
                  const overdue = borrowings.filter((b: BorrowingWithDetails) => {
                    const due = new Date(b.dueDate);
                    // Only show books that are overdue, not returned, and status is 'borrowed' or 'overdue'
                    return due < today && (b.status === "borrowed" || b.status === "overdue") && !b.returnDate;
                  });
                  return overdue.length > 0 ? (
                    <DataTable
                      data={overdue}
                      columns={borrowingColumns}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">{t('members.details.overdue.noBooks')}</p>
                    </div>
                  );
                })()
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
} 