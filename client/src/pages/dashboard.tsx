import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ServerDataTable } from "@/components/ui/data-table";
import { ActivityTimeline, ActivityItem } from "@/components/ui/activity-timeline";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { PaginatedResponse } from "@/components/ui/data-table";
import { 
  Book, 
  Users, 
  HandHeart, 
  AlertTriangle, 
  Plus, 
  UserPlus, 
  BarChart3, 
  Undo2,
  ArrowUp,
  Clock,
  TriangleAlert
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, Area, AreaChart } from "recharts";
import { motion } from "framer-motion";
import { tr, enUS } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { capitalizeWords } from "@/lib/utils";
import LoadingScreen from "@/components/ui/loading-screen";

interface Stats {
  totalBooks: number;
  totalUsers: number;
  activeBorrowings: number;
  overdueBorrowings: number;
  borrowCount: number;
  totalBooksChangePercent?: number;
  totalUsersChangePercent?: number;
  avgBorrowDays?: number;
}

interface PopularBook {
  id: number;
  title: string;
  author: string;
  borrowCount: number;
}

interface ActiveUser {
  id: number;
  name: string;
  borrowCount: number;
}

interface OverdueBorrowing {
  id: number;
  bookId: number;
  userId: number;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  status: string;
  extensionRequested: boolean;
  notes: string | null;
  book: {
    id: number;
    title: string;
    author: string;
    isbn: string;
    genre: string;
    publishYear: number;
    shelfNumber: string;
    availableCopies: number;
    totalCopies: number;
    pageCount: number;
    createdAt: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface RecentActivity {
  type: 'borrowing' | 'return';
  id: number;
  date: string;
  user: { name: string };
  book: { title: string };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card p-3 rounded-lg border border-border shadow-lg backdrop-blur-sm">
        <p className="font-medium text-card-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
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

// Dark theme uyumlu renk paleti
const chartColors = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))", 
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted-foreground))",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "hsl(var(--destructive))",
  info: "#3b82f6"
};

// Daha fazla ve farklı renkler içeren dizi
const pieColors = [
  '#FFB300', // Amber
  '#1E88E5', // Blue
  '#43A047', // Green
  '#E53935', // Red
  '#8E24AA', // Purple
  '#FDD835', // Yellow
  '#00ACC1', // Cyan
  '#FB8C00', // Orange
  '#6D4C41', // Brown
  '#3949AB', // Indigo
  '#C0CA33', // Lime
  '#D81B60', // Pink
  '#00897B', // Teal
  '#F4511E', // Deep Orange
  '#757575', // Grey
];

export default function Dashboard() {
  const { t, i18n } = useTranslation();

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: popularBooks } = useQuery<PopularBook[]>({
    queryKey: ["/api/stats/popular-books"],
  });

  const { data: activeUsers } = useQuery<ActiveUser[]>({
    queryKey: ["/api/stats/active-users"],
  });

  const [overduePage, setOverduePage] = useState(1);
  const overduePageSize = 5;

  const { data: overdueBorrowingsResponse } = useQuery<PaginatedResponse<OverdueBorrowing>>({
    queryKey: ["/api/borrowings/overdue", overduePage, overduePageSize],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/borrowings/overdue?page=${overduePage}&limit=${overduePageSize}`);
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
    },
  });

  // Debug log
  console.log('overduePage', overduePage, 'overdueBorrowingsResponse', overdueBorrowingsResponse);
  console.log('overdueBorrowingsResponse.data', overdueBorrowingsResponse?.data);

  const overdueBorrowings = overdueBorrowingsResponse?.data || [];
  const overduePagination = overdueBorrowingsResponse?.pagination;

  // Tabloya doğrudan overdueBorrowingsResponse ver
  const normalizedOverdueData = overdueBorrowingsResponse;

  const { data: recentActivities } = useQuery<RecentActivity[]>({
    queryKey: ["/api/activities/recent"],
  });

  // Gelişmiş aktivite feed verisi
  const { data: activityFeed = [] } = useQuery<any[]>({
    queryKey: ["/api/activities/feed"],
  });

  // Aktivite verilerini dönüştür
  const transformedActivities: ActivityItem[] = activityFeed.map((activity) => ({
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

  // Haftalık aktivite verisi
  const { data: weeklyActivity = [] } = useQuery<any[]>({
    queryKey: ["/api/stats/weekly-activity"],
  });

  // Gün kısaltmalarını çeviri sistemi ile eşleştir
  const dayMap: Record<string, string> = {
    "Pzt": "mon",
    "Sal": "tue",
    "Çar": "wed",
    "Per": "thu",
    "Cum": "fri",
    "Cmt": "sat",
    "Paz": "sun",
    "mon": "mon",
    "tue": "tue",
    "wed": "wed",
    "thu": "thu",
    "fri": "fri",
    "sat": "sat",
    "sun": "sun"
  };
  const getDayTranslation = (dayKey: string) => {
    return t(`common.days.${dayMap[dayKey] || dayKey}`);
  };

  // Weekly activity verilerini çeviri ile dönüştür
  const translatedWeeklyActivity = weeklyActivity.map(item => ({
    ...item,
    day: getDayTranslation(item.day)
  }));

  // Tür dağılımı verisi
  const { data: genreDistribution = [] } = useQuery<any[]>({
    queryKey: ["/api/stats/genre-distribution"],
  });

  const overdueColumns = [
    {
      key: "user.name",
      title: t("borrowing.member"),
      render: (value: string, row: any) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-destructive/20 rounded-full flex items-center justify-center mr-3">
            <span className="text-sm font-medium text-destructive">
              {value?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <div>
            <Link to={`/members/${row.user.id || row.user.email}`}
              className="font-medium text-on-surface hover:underline hover:text-primary transition-colors"
            >
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
      render: (value: string, row: any) => (
        <div>
          <p className="font-medium text-on-surface">{value}</p>
          <p className="text-sm text-text-muted">{row.book.author}</p>
        </div>
      ),
    },
    {
      key: "borrowDate",
      title: t("borrowing.borrowDate"),
      render: (value: string) => value ? format(new Date(value), "MMM dd, yyyy") : "-",
    },
    {
      key: "dueDate",
      title: t("borrowing.dueDate"),
      render: (value: string) => value ? format(new Date(value), "MMM dd, yyyy") : "-",
    },
    {
      key: "dueDate",
      title: t("borrowing.delayDays"),
      render: (value: string) => {
        const daysOverdue = Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24));
        return (
          <span className="font-bold text-destructive text-lg">{daysOverdue}</span>
        );
      },
    },
  ];

  return (
    <div>
      <motion.div
        className="space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
              <h3 className="text-base font-semibold text-gray-800">{t("dashboard.quickActions")}</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/books?action=add" className="flex-1 min-w-[140px]">
                <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 border border-blue-200/30 hover:border-blue-300/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative p-4 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mb-3 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                      <Plus className="h-5 w-5 text-white" />
                    </div>
                    <p className="font-semibold text-sm text-gray-800 mb-1">{t("books.addBook")}</p>
                    <p className="text-xs text-gray-600 leading-tight">{t("dashboard.addBookDesc")}</p>
                  </div>
                </div>
              </Link>
              
              <Link to="/members?action=add" className="flex-1 min-w-[140px]">
                <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-100/50 hover:from-green-100 hover:to-emerald-200/50 border border-green-200/30 hover:border-green-300/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative p-4 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mb-3 shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform duration-300">
                      <UserPlus className="h-5 w-5 text-white" />
                    </div>
                    <p className="font-semibold text-sm text-gray-800 mb-1">{t("members.addMember")}</p>
                    <p className="text-xs text-gray-600 leading-tight">{t("dashboard.addMemberDesc")}</p>
                  </div>
                </div>
              </Link>
              
              <Link to="/borrowing?action=add" className="flex-1 min-w-[140px]">
                <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-amber-100/50 hover:from-orange-100 hover:to-amber-200/50 border border-orange-200/30 hover:border-orange-300/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative p-4 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl mb-3 shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <p className="font-semibold text-sm text-gray-800 mb-1">{t("dashboard.quickBorrow")}</p>
                    <p className="text-xs text-gray-600 leading-tight">{t("dashboard.quickBorrowDesc")}</p>
                  </div>
                </div>
              </Link>
              
              <Link to="/returns" className="flex-1 min-w-[140px]">
                <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-red-50 to-pink-100/50 hover:from-red-100 hover:to-pink-200/50 border border-red-200/30 hover:border-red-300/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative p-4 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl mb-3 shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform duration-300">
                      <Undo2 className="h-5 w-5 text-white" />
                    </div>
                    <p className="font-semibold text-sm text-gray-800 mb-1">{t("dashboard.processReturn")}</p>
                    <p className="text-xs text-gray-600 leading-tight">{t("dashboard.processReturnDesc")}</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div 
            variants={itemVariants}
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
          >
          <StatsCard
            title={t("statistics.totalBooks")}
            value={stats?.totalBooks || 0}
            change={typeof stats?.totalBooksChangePercent === 'number' ? 
              `${stats.totalBooksChangePercent > 0 ? '+' : ''}${stats.totalBooksChangePercent}%` : 
              t("dashboard.changeBooks")
            }
            changeType={typeof stats?.totalBooksChangePercent === 'number' ? 
              (stats.totalBooksChangePercent > 0 ? "positive" : stats.totalBooksChangePercent < 0 ? "negative" : "neutral") : 
              "neutral"
            }
            icon={<Book size={20} />}
            iconColor="bg-emerald-500/20 text-emerald-400"
          />
          </motion.div>
          <motion.div 
            variants={itemVariants}
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
          >
          <StatsCard
            title={t("statistics.activeMembers")}
            value={stats?.totalUsers || 0}
            change={typeof stats?.totalUsersChangePercent === 'number' ? 
              `${stats.totalUsersChangePercent > 0 ? '+' : ''}${stats.totalUsersChangePercent}%` : 
              t("dashboard.changeMembers")
            }
            changeType={typeof stats?.totalUsersChangePercent === 'number' ? 
              (stats.totalUsersChangePercent > 0 ? "positive" : stats.totalUsersChangePercent < 0 ? "negative" : "neutral") : 
              "neutral"
            }
            icon={<Users size={20} />}
            iconColor="bg-blue-500/20 text-blue-400"
          />
          </motion.div>
          <motion.div 
            variants={itemVariants}
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
          >
          <StatsCard
            title={t("dashboard.booksBorrowed")}
            value={stats?.activeBorrowings || 0}
            change={typeof stats?.avgBorrowDays === 'number' ? 
              `${stats.avgBorrowDays} gün` : 
              t("dashboard.avgDays")
            }
            changeType="neutral"
            icon={<HandHeart size={20} />}
            iconColor="bg-purple-500/20 text-purple-400"
          />
          </motion.div>
          <motion.div 
            variants={itemVariants}
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
          >
          <StatsCard
            title={t("dashboard.overdueItems")}
            value={stats?.overdueBorrowings || 0}
            change={stats?.overdueBorrowings && stats.overdueBorrowings > 0 ? 
              `${stats.overdueBorrowings} gecikmiş` : 
              t("dashboard.requiresAttention")
            }
            changeType="negative"
            icon={<AlertTriangle size={20} />}
            iconColor="bg-red-500/20 text-red-400"
          />
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Weekly Activity Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.weeklyActivity")}</CardTitle>
                <CardDescription>{t("dashboard.weeklyActivityDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={translatedWeeklyActivity}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorBorrowed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorReturned" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.secondary} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={chartColors.secondary} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                    <XAxis 
                      dataKey="day" 
                      tickLine={false} 
                      axisLine={false} 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--accent) / 0.1)" }}
                      content={<CustomTooltip />}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="circle" />
                    <Area 
                      type="monotone" 
                      dataKey="borrowed" 
                      stroke={chartColors.primary} 
                      fillOpacity={1} 
                      fill="url(#colorBorrowed)" 
                      name={t("dashboard.borrowed")}
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="returned" 
                      stroke={chartColors.secondary} 
                      fillOpacity={1} 
                      fill="url(#colorReturned)" 
                      name={t("dashboard.returned")}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Genre Distribution Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.collectionDistribution")}</CardTitle>
                <CardDescription>{t("dashboard.collectionDistributionDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={genreDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                      label={false} // Etiketleri kaldır
                      labelLine={false}
                    >
                      {genreDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={pieColors[index % pieColors.length]}
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Legend 
                      verticalAlign="bottom" 
                      align="center"
                      iconType="circle"
                      wrapperStyle={{
                        fontFamily: 'inherit',
                        fontSize: 14,
                        fontWeight: 500,
                        color: 'hsl(var(--foreground))',
                        marginTop: 16
                      }}
                      formatter={(value) => {
                        const key = (value || '')
                          .toLowerCase()
                          .replace(/ /g, '')
                          .replace(/ç/g, 'c')
                          .replace(/ı/g, 'i')
                          .replace(/ş/g, 's')
                          .replace(/ü/g, 'u')
                          .replace(/ö/g, 'o')
                          .replace(/ğ/g, 'g');
                        return t('genres.' + key);
                      }}
                    />
                    <Tooltip 
                      cursor={{ fill: "hsl(var(--accent) / 0.1)" }}
                      content={<CustomTooltip />}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Son Aktiviteler */}
          <motion.div variants={itemVariants}>
            <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("dashboard.recentActivity")}</CardTitle>
                <Button variant="link" size="sm" asChild>
                  <Link to="/activities">{t("dashboard.viewAll")}</Link>
                </Button>
            </CardHeader>
            <CardContent className="h-full">
              <ActivityTimeline 
                activities={transformedActivities}
                maxItems={5}
                showAvatars={true}
                variant="compact"
              />
            </CardContent>
          </Card>
          </motion.div>

          {/* En Çok Ödünç Alınan Kitaplar */}
          <motion.div variants={itemVariants}>
            <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("dashboard.mostBorrowedBooks")}</CardTitle>
                <Button variant="link" size="sm" asChild>
                  <Link to="/statistics">{t("dashboard.viewAll")}</Link>
                </Button>
            </CardHeader>
            <CardContent className="h-full">
                <ul className="space-y-4">
                  {popularBooks?.slice(0,6).map((book, index) => (
                    <li key={book.id} className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{capitalizeWords(book.title)}</p>
                        <p className="text-sm text-muted-foreground">{capitalizeWords(book.author)}</p>
                      </div>
                      <div className="w-28 text-right ml-4">
                        <span className="text-sm font-semibold text-foreground mr-2">
                          {t('dashboard.borrowCount', {count: book.borrowCount})}
                        </span>
                        <Progress value={(book.borrowCount / (popularBooks[0]?.borrowCount || 1)) * 100} className="h-2 mt-1" />
                      </div>
                    </li>
                  ))}
                </ul>
            </CardContent>
          </Card>
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <TriangleAlert className="h-5 w-5 text-destructive" />
                <CardTitle>{t("dashboard.overdueItemsAttention")}</CardTitle>
                {overdueBorrowingsResponse && overdueBorrowingsResponse.data && overdueBorrowingsResponse.data.length > 0 && (
                  <Badge variant="destructive">{t("dashboard.itemCount", { count: overdueBorrowingsResponse.data.length })}</Badge>
                )}
              </div>
              <Button variant="link" size="sm" asChild>
                <Link to="/borrowing?filter=overdue">{t("dashboard.viewAll")}</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {overdueBorrowingsResponse && overdueBorrowingsResponse.data && overdueBorrowingsResponse.data.length > 0 ? (
                <ServerDataTable
                  columns={overdueColumns}
                  data={normalizedOverdueData || { data: [], pagination: { page: 1, limit: 5, total: 0, totalPages: 1, hasNext: false, hasPrev: false } }}
                  emptyMessage={t("dashboard.noOverdueItems")}
                  onPageChange={setOverduePage}
                />
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">{t("dashboard.noOverdueItems")}</p>
                  <p className="text-sm text-muted-foreground">{t("dashboard.noOverdueItemsDesc")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
