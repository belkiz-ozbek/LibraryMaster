import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Link } from "wouter";
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
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { motion } from "framer-motion";
import { tr, enUS } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";

interface Stats {
  totalBooks: number;
  totalUsers: number;
  activeBorrowings: number;
  overdueBorrowings: number;
  borrowCount: number;
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
  user: { name: string; email: string };
  book: { title: string; isbn: string };
  dueDate: string;
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
      <div className="bg-card p-3 rounded-lg border border-border shadow-lg">
        <p className="font-medium text-card-foreground">{label}</p>
        <p style={{ color: payload[0].color }}>
          {`${payload[0].name}: ${payload[0].value}`}
        </p>
        <p style={{ color: payload[1].color }}>
          {`${payload[1].name}: ${payload[1].value}`}
        </p>
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

  const { data: overdueBorrowings } = useQuery<OverdueBorrowing[]>({
    queryKey: ["/api/borrowings/overdue"],
  });

  console.log("Gecikmiş Kitaplar (API'den gelen):", overdueBorrowings);

  const { data: recentActivities } = useQuery<RecentActivity[]>({
    queryKey: ["/api/activities/recent"],
  });

  const overdueColumns = [
    {
      key: "user.name",
      title: t("borrowing.member"),
      render: (value: string, row: any) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mr-3">
            <span className="text-xs font-medium text-muted-foreground">
              {value?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground">{row.user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "book.title",
      title: t("borrowing.book"),
      render: (value: string, row: any) => (
        <div>
          <p className="font-medium text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground font-mono">ISBN: {row.book.isbn}</p>
        </div>
      ),
    },
    {
      key: "dueDate",
      title: t("borrowing.dueDate"),
      render: (value: string) => format(new Date(value), "MMM dd, yyyy"),
    },
    {
      key: "dueDate",
      title: t("dashboard.daysOverdue"),
      render: (value: string) => {
        const daysOverdue = Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24));
        return (
          <Badge variant="destructive">
            {t("dashboard.days", { count: daysOverdue })}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      title: t("dashboard.action"),
      render: () => (
        <div className="flex items-center space-x-2">
          <Button variant="link" size="sm">{t("dashboard.sendReminder")}</Button>
          <Button variant="link" size="sm">{t("dashboard.extendDueDate")}</Button>
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
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.quickActions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/books?action=add">
                <div className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-muted transition-colors text-center h-full">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-2">
                    <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="font-semibold text-sm">{t("books.addBook")}</p>
                  <p className="text-xs text-muted-foreground">{t("dashboard.addBookDesc")}</p>
                </div>
              </Link>
              <Link to="/members?action=add">
                <div className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-muted transition-colors text-center h-full">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full mb-2">
                    <UserPlus className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="font-semibold text-sm">{t("members.addMember")}</p>
                  <p className="text-xs text-muted-foreground">{t("dashboard.addMemberDesc")}</p>
                </div>
              </Link>
               <Link to="/borrowing?action=add">
                <div className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-muted transition-colors text-center h-full">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-2">
                    <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <p className="font-semibold text-sm">{t("dashboard.quickBorrow")}</p>
                  <p className="text-xs text-muted-foreground">{t("dashboard.quickBorrowDesc")}</p>
                </div>
              </Link>
              <Link to="/returns">
                <div className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-muted transition-colors text-center h-full">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full mb-2">
                    <Undo2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="font-semibold text-sm">{t("dashboard.processReturn")}</p>
                  <p className="text-xs text-muted-foreground">{t("dashboard.processReturnDesc")}</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants}>
        <StatsCard
          title={t("statistics.totalBooks")}
          value={stats?.totalBooks || 0}
          change={t("dashboard.changeBooks")}
          changeType="positive"
          icon={<Book size={20} />}
          iconColor="bg-primary/10 text-primary"
        />
        </motion.div>
        <motion.div variants={itemVariants}>
        <StatsCard
          title={t("statistics.activeMembers")}
          value={stats?.totalUsers || 0}
          change={t("dashboard.changeMembers")}
          changeType="positive"
          icon={<Users size={20} />}
          iconColor="bg-secondary/10 text-secondary"
        />
        </motion.div>
        <motion.div variants={itemVariants}>
        <StatsCard
          title={t("dashboard.booksBorrowed")}
          value={stats?.activeBorrowings || 0}
          change={t("dashboard.avgDays")}
          changeType="neutral"
          icon={<HandHeart size={20} />}
          iconColor="bg-accent/10 text-accent"
        />
        </motion.div>
        <motion.div variants={itemVariants}>
        <StatsCard
          title={t("dashboard.overdueItems")}
          value={stats?.overdueBorrowings || 0}
          change={t("dashboard.requiresAttention")}
          changeType="negative"
          icon={<AlertTriangle size={20} />}
          iconColor="bg-destructive/10 text-destructive"
        />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Weekly Activity Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
      <Card>
        <CardHeader>
              <CardTitle>Haftalık Aktivite</CardTitle>
              <CardDescription>Son 7 gündeki ödünç alma ve iade işlemleri.</CardDescription>
        </CardHeader>
        <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={[
                    { day: 'Pzt', borrowed: 12, returned: 8 },
                    { day: 'Sal', borrowed: 15, returned: 10 },
                    { day: 'Çar', borrowed: 8, returned: 5 },
                    { day: 'Per', borrowed: 18, returned: 12 },
                    { day: 'Cum', borrowed: 23, returned: 18 },
                    { day: 'Cmt', borrowed: 10, returned: 7 },
                    { day: 'Paz', borrowed: 5, returned: 3 },
                  ]}
                  margin={{ top: 5, right: 20, left: -10, bottom: 0 }}
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--accent) / 0.1)" }}
                    content={<CustomTooltip />}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                  <Bar dataKey="borrowed" fill="hsl(var(--primary))" name="Ödünç Alınan" radius={[4, 4, 0, 0]} barSize={15} />
                  <Bar dataKey="returned" fill="hsl(var(--secondary))" name="İade Edilen" radius={[4, 4, 0, 0]} barSize={15} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Genre Distribution Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Koleksiyon Dağılımı</CardTitle>
              <CardDescription>Kitapların türlere göre dağılımı.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Roman', value: 400 },
                      { name: 'Bilim Kurgu', value: 240 },
                      { name: 'Tarih', value: 180 },
                      { name: 'Felsefe', value: 120 },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="hsl(var(--primary))" />
                    <Cell fill="hsl(var(--secondary))" />
                    <Cell fill="hsl(var(--accent))" />
                    <Cell fill="hsl(var(--muted-foreground))" />
                  </Pie>
                  <Tooltip cursor={{ fill: "hsl(var(--accent) / 0.1)" }} />
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
                <Link to="/borrowing">{t("dashboard.viewAll")}</Link>
              </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {recentActivities?.map((activity) => (
                  <div key={`${activity.type}-${activity.id}`} className="flex items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center mr-4 ${activity.type === 'borrowing' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                      {activity.type === 'borrowing' ? (
                        <Book size={16} className="text-green-600 dark:text-green-400" />
                      ) : (
                        <Undo2 size={16} className="text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{activity.user.name}</span>
                        {activity.type === 'borrowing' ? ` ${t("dashboard.borrowed")} ` : ` ${t("dashboard.returned")} `}
                        <span className="font-medium">"{activity.book.title}"</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.date), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
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
          <CardContent>
              <ul className="space-y-4">
                {popularBooks?.slice(0,5).map((book, index) => (
                  <li key={book.id} className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{book.title}</p>
                      <p className="text-sm text-muted-foreground">{book.author}</p>
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
            </div>
            {overdueBorrowings && overdueBorrowings.length > 0 && (
              <Badge variant="destructive">{t("dashboard.itemCount", { count: overdueBorrowings.length })}</Badge>
            )}
          </CardHeader>
          <CardContent>
            {overdueBorrowings && overdueBorrowings.length > 0 ? (
              <DataTable
                columns={overdueColumns}
                data={overdueBorrowings}
                emptyMessage={t("dashboard.noOverdueItems")}
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
  );
}
