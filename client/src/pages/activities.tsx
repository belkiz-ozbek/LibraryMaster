import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityTimeline, ActivityItem } from "@/components/ui/activity-timeline";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Filter, 
  LayoutGrid,
  RefreshCw,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";
import LoadingScreen from "@/components/ui/loading-screen";
import { apiRequest } from "@/lib/queryClient";
import type { PaginatedResponse } from "@/components/ui/data-table";

interface ActivityStats {
  total: number;
  borrowing: number;
  returns: number;
  overdue: number;
  newMembers: number;
  newBooks: number;
}

export default function Activities() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>('all');
  const [variant, setVariant] = useState<'default' | 'compact' | 'detailed'>('default');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: activitiesResponse, isLoading, refetch } = useQuery<PaginatedResponse<any>>({
    queryKey: ["/api/activities/feed", page, pageSize],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/activities/feed?page=${page}&limit=${pageSize}`);
      return response.json();
    },
    refetchOnWindowFocus: true,
  });

  const activities = activitiesResponse?.data || [];
  const pagination = activitiesResponse?.pagination;

  // Aktivite verilerini dönüştür
  const transformedActivities: ActivityItem[] = activities.map((activity) => ({
    id: activity.id,
    type: activity.type,
    title: activity.title,
    description: activity.description,
    user: activity.user,
    book: activity.book,
    date: activity.date,
    status: activity.status,
    metadata: activity.metadata
  }));

  // Filtreleme
  const filteredActivities = filter === 'all' 
    ? transformedActivities 
    : transformedActivities.filter(activity => activity.type === filter);

  // Server-side pagination kullanıldığı için client-side pagination kaldırıldı
  const paginatedActivities = filteredActivities;
  const totalPages = pagination?.totalPages || 1;

  // İstatistikler
  const stats: ActivityStats = {
    total: transformedActivities.length,
    borrowing: transformedActivities.filter(a => a.type === 'borrowing').length,
    returns: transformedActivities.filter(a => a.type === 'return').length,
    overdue: transformedActivities.filter(a => a.type === 'overdue').length,
    newMembers: transformedActivities.filter(a => a.type === 'member_added').length,
    newBooks: transformedActivities.filter(a => a.type === 'book_added').length,
  };

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const prev = JSON.stringify(activities);
    try {
      const { data: newData } = await refetch();
      setIsRefreshing(false);
      if (JSON.stringify(newData) === prev) {
        toast({
          title: t("activities.refreshNoNew"),
          description: t("activities.refreshNoNew"),
          variant: "default",
        });
      } else {
        toast({
          title: t("activities.refreshSuccess"),
          description: t("activities.refreshSuccess"),
          variant: "default",
        });
      }
    } catch (err) {
      setIsRefreshing(false);
      toast({
        title: t("activities.refreshError"),
        description: t("activities.refreshError"),
        variant: "destructive",
      });
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-end">
          <Button 
            onClick={handleRefresh}
            variant="modern"
            size="lg"
            className={`font-semibold shadow-lg hover:shadow-xl transition-all duration-200
              ${isRefreshing ? 'bg-gray-100 text-gray-500 cursor-wait' : ''}`}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 size={18} className="animate-spin mr-1" />
            ) : (
              <RefreshCw size={16} className="mr-1" />
            )}
            {isRefreshing ? t("activities.refreshing") : t("activities.refresh")}
          </Button>
        </div>
      </motion.div>

      {/* İstatistik Kartları */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">{t("activities.stats.total")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.borrowing}</p>
                <p className="text-sm text-muted-foreground">{t("activities.stats.borrowing")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.returns}</p>
                <p className="text-sm text-muted-foreground">{t("activities.stats.returns")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.overdue}</p>
                <p className="text-sm text-muted-foreground">{t("activities.stats.overdue")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.newMembers}</p>
                <p className="text-sm text-muted-foreground">{t("activities.stats.newMembers")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.newBooks}</p>
                <p className="text-sm text-muted-foreground">{t("activities.stats.newBooks")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filtreler */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-muted-foreground" />
        </div>
        
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("activities.filters.all")}</SelectItem>
            <SelectItem value="borrowing">{t("activities.filters.borrowing")}</SelectItem>
            <SelectItem value="return">{t("activities.filters.return")}</SelectItem>
            <SelectItem value="overdue">{t("activities.filters.overdue")}</SelectItem>
            <SelectItem value="member_added">{t("activities.filters.member_added")}</SelectItem>
            <SelectItem value="book_added">{t("activities.filters.book_added")}</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-muted-foreground" />
        </div>
        
        <Select value={variant} onValueChange={(value: 'default' | 'compact' | 'detailed') => setVariant(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">{t("activities.filters.default")}</SelectItem>
            <SelectItem value="compact">{t("activities.filters.compact")}</SelectItem>
            {user?.isAdmin && (
              <SelectItem value="detailed">{t("activities.filters.detailed")}</SelectItem>
            )}
          </SelectContent>
        </Select>

        <Badge variant="secondary" className="ml-auto">
          {filteredActivities.length} {t("activities.badge.count")}
        </Badge>
      </motion.div>

      {/* Aktivite Timeline */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>{t("activities.title")}</CardTitle>
            <CardDescription>
              {t("activities.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">{t("activities.timeline.loading")}</p>
              </div>
            ) : (
              <ActivityTimeline 
                activities={paginatedActivities}
                showAvatars={true}
                variant={variant}
              />
            )}
          </CardContent>
        </Card>
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            <button
              className="px-3 py-1 rounded bg-muted text-sm font-medium disabled:opacity-50"
              onClick={() => handlePageChange(page - 1)}
              disabled={!pagination.hasPrev}
            >
              {t("activities.pagination.previous")}
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`px-3 py-1 rounded text-sm font-medium ${page === i + 1 ? 'bg-primary text-white' : 'bg-muted'}`}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="px-3 py-1 rounded bg-muted text-sm font-medium disabled:opacity-50"
              onClick={() => handlePageChange(page + 1)}
              disabled={!pagination.hasNext}
            >
              {t("activities.pagination.next")}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
} 