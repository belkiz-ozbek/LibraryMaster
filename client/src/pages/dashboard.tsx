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
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-800">{t("dashboard.quickActions")}</h3>
              </div>
              <div className="text-sm text-gray-500">Hızlı erişim</div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Kitap Ekle */}
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Link to="/books?action=add" className="block">
                  <div className="group relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-blue-200 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300">
                          <Plus className="h-6 w-6 text-white" />
                        </div>
                        <motion.div
                          className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.7, 1, 0.7]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">{t("books.addBook")}</h4>
                        <p className="text-xs text-gray-500 leading-tight">Yeni kitap ekle</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Üye Ekle */}
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Link to="/members?action=add" className="block">
                  <div className="group relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-green-200 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:shadow-green-500/50 transition-all duration-300">
                          <UserPlus className="h-6 w-6 text-white" />
                        </div>
                        <motion.div
                          className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.7, 1, 0.7]
                          }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">{t("members.addMember")}</h4>
                        <p className="text-xs text-gray-500 leading-tight">Yeni üye kaydet</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Hızlı Ödünç */}
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Link to="/borrowing?action=add" className="block">
                  <div className="group relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-orange-200 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-all duration-300">
                          <BarChart3 className="h-6 w-6 text-white" />
                        </div>
                        <motion.div
                          className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.7, 1, 0.7]
                          }}
                          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">{t("dashboard.quickBorrow")}</h4>
                        <p className="text-xs text-gray-500 leading-tight">Kitap ödünç al</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* İade İşlemi */}
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Link to="/returns" className="block">
                  <div className="group relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-red-200 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:shadow-red-500/50 transition-all duration-300">
                          <Undo2 className="h-6 w-6 text-white" />
                        </div>
                        <motion.div
                          className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.7, 1, 0.7]
                          }}
                          transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">{t("dashboard.processReturn")}</h4>
                        <p className="text-xs text-gray-500 leading-tight">Kitap iade et</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
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
              <CardHeader className="bg-[#fafaff] dark:bg-[#232334] rounded-t-lg px-4 py-4 flex flex-col gap-1 border-b border-transparent">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#a78bfa] shadow-sm"></span>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">{t("dashboard.weeklyActivity")}</CardTitle>
                </div>
                <CardDescription className="text-sm text-gray-500 dark:text-gray-300 font-normal leading-snug">{t("dashboard.weeklyActivityDesc")}</CardDescription>
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
              <CardHeader className="bg-[#fff7fa] dark:bg-[#2a232a] rounded-t-lg px-4 py-4 flex flex-col gap-1 border-b border-transparent">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#f472b6] shadow-sm"></span>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">{t("dashboard.collectionDistribution")}</CardTitle>
                </div>
                <CardDescription className="text-sm text-gray-500 dark:text-gray-300 font-normal leading-snug">{t("dashboard.collectionDistributionDesc")}</CardDescription>
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
                      label={false}
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
                  <Link
                    to="/activities"
                    className="group relative text-primary text-sm font-medium transition-colors no-underline inline-block leading-tight"
                  >
                    <span className="relative">
                      {t("dashboard.viewAll")}
                      <span className="absolute left-0 right-0 bottom-[-2px] h-0.5 bg-primary transition-all duration-300 w-0 group-hover:w-full"></span>
                    </span>
                  </Link>
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
            <Card className="h-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-xl border-0">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t("dashboard.mostBorrowedBooks")}</CardTitle>
                <Button variant="link" size="sm" asChild>
                  <Link
                    to="/statistics"
                    className="group relative text-primary text-sm font-medium transition-colors no-underline inline-block leading-tight"
                  >
                    <span className="relative">
                      {t("dashboard.viewAll")}
                      <span className="absolute left-0 right-0 bottom-[-2px] h-0.5 bg-primary transition-all duration-300 w-0 group-hover:w-full"></span>
                    </span>
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="h-full">
                <ul className="flex flex-col gap-2">
                  {popularBooks?.slice(0,7).map((book, index) => (
                    <motion.li
                      key={book.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                      className="flex items-center rounded-xl bg-gradient-to-br from-blue-50/70 via-white/60 to-purple-50/60 dark:from-blue-900/30 dark:via-slate-900/60 dark:to-purple-900/30 shadow px-2 py-2 group hover:scale-[1.018] hover:shadow-md transition-all border border-blue-100/40 dark:border-blue-900/30 min-h-[48px]"
                    >
                      {/* Rank badge */}
                      <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400/80 to-purple-400/80 shadow text-white font-bold text-sm mr-2 border-2 border-white dark:border-slate-900">
                        {index + 1}
                      </div>
                      {/* Book icon */}
                      <div className="w-7 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-100/80 to-purple-100/80 dark:from-blue-900/40 dark:to-purple-900/40 mr-2">
                        <Book className="w-5 h-5 text-blue-400 dark:text-blue-300 opacity-80" />
                      </div>
                      {/* Book info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[15px] text-gray-900 dark:text-white truncate">
                          {capitalizeWords(book.title)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {capitalizeWords(book.author)}
                        </p>
                      </div>
                      {/* Borrow count and progress */}
                      <div className="flex flex-col items-end w-20 ml-2">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-300 mb-0.5">
                          {book.borrowCount} <span className="text-xs font-medium text-gray-400">{t('dashboard.borrowCountShort')}</span>
                        </span>
                        <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            className="h-1.5 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${(book.borrowCount / (popularBooks[0]?.borrowCount || 1)) * 100}%` }}
                            transition={{ duration: 0.6, delay: 0.1 + index * 0.06 }}
                          />
                        </div>
                      </div>
                    </motion.li>
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
              <Link
                to="/borrowing?filter=overdue"
                className="group relative text-primary text-sm font-medium transition-colors no-underline inline-block leading-tight"
              >
                <span className="relative">
                  {t("dashboard.viewAll")}
                  <span className="absolute left-0 right-0 bottom-[-2px] h-0.5 bg-primary transition-all duration-300 w-0 group-hover:w-full"></span>
                </span>
              </Link>
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
