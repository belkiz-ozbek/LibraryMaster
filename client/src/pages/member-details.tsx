import { useState } from "react";
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
import { ArrowLeft, BookOpen, Star, Calendar, Award } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import type { User, BorrowingWithDetails } from "@shared/schema";

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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">{t('members.details.loading')}</p>
        </div>
      </div>
    );
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
          <div>
            <h1 className="text-2xl font-bold">{t('members.details.title')}</h1>
            <p className="text-muted-foreground">{t('members.details.subtitle')}</p>
          </div>
        </div>
      </motion.div>

      {/* Member Info Card */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <div className="h-full w-full bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-primary">
                    {member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </span>
                </div>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{member.name}</h2>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('members.details.membershipDate')}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(member.membershipDate), "dd MMMM yyyy", { locale: tr })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Award className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('members.details.adminRating')}</p>
                  <div className="flex items-center">
                    {renderStars(member.adminRating)}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Award className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('members.details.role')}</p>
                  <Badge variant={member.isAdmin ? "default" : "secondary"}>
                    {member.isAdmin ? t('members.details.admin') : t('members.details.member')}
                  </Badge>
                </div>
              </div>
            </div>

            {member.adminNotes && (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="text-sm font-medium mb-2">{t('members.details.adminNotes')}</p>
                  <p className="text-sm text-muted-foreground">{member.adminNotes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalBorrowed}</p>
                <p className="text-sm text-muted-foreground">{t('members.details.stats.totalBorrowed')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.returned}</p>
                <p className="text-sm text-muted-foreground">{t('members.details.stats.returned')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.currentlyBorrowed}</p>
                <p className="text-sm text-muted-foreground">{t('members.details.stats.currentlyBorrowed')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.overdue}</p>
                <p className="text-sm text-muted-foreground">{t('members.details.stats.overdue')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="borrowings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="borrowings">{t('members.details.tabs.borrowings')}</TabsTrigger>
            <TabsTrigger value="currently-borrowed">{t('members.details.tabs.currentlyBorrowed')}</TabsTrigger>
            <TabsTrigger value="overdue">{t('members.details.tabs.overdue')}</TabsTrigger>
          </TabsList>

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
                    const overdue = borrowings.filter((b: BorrowingWithDetails) => b.status === "overdue");
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
    </motion.div>
  );
} 