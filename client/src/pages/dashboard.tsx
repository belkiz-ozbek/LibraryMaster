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
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: popularBooks } = useQuery({
    queryKey: ["/api/stats/popular-books"],
  });

  const { data: activeUsers } = useQuery({
    queryKey: ["/api/stats/active-users"],
  });

  const { data: overdueBorrowings } = useQuery({
    queryKey: ["/api/borrowings/overdue"],
  });

  const { data: activeBorrowings } = useQuery({
    queryKey: ["/api/borrowings/active"],
  });

  const recentActivities = activeBorrowings?.slice(0, 5) || [];

  const overdueColumns = [
    {
      key: "user.name",
      title: t("borrowing.member"),
      render: (value: string, row: any) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-text-muted/20 rounded-full flex items-center justify-center mr-3">
            <span className="text-xs font-medium text-text-muted">
              {value?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
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
      render: (value: string, row: any) => (
        <div>
          <p className="font-medium text-on-surface">{value}</p>
          <p className="text-sm text-text-muted font-mono">ISBN: {row.book.isbn}</p>
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
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title={t("statistics.totalBooks")}
          value={stats?.totalBooks || 0}
          change={t("dashboard.changeBooks")}
          changeType="positive"
          icon={<Book size={20} />}
          iconColor="bg-primary/10 text-primary"
        />
        <StatsCard
          title={t("statistics.activeMembers")}
          value={stats?.totalUsers || 0}
          change={t("dashboard.changeMembers")}
          changeType="positive"
          icon={<Users size={20} />}
          iconColor="bg-secondary/10 text-secondary"
        />
        <StatsCard
          title={t("dashboard.booksBorrowed")}
          value={stats?.activeBorrowings || 0}
          change={t("dashboard.avgDays")}
          changeType="neutral"
          icon={<HandHeart size={20} />}
          iconColor="bg-accent/10 text-accent"
        />
        <StatsCard
          title={t("dashboard.overdueItems")}
          value={stats?.overdueBorrowings || 0}
          change={t("dashboard.requiresAttention")}
          changeType="negative"
          icon={<AlertTriangle size={20} />}
          iconColor="bg-destructive/10 text-destructive"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.quickActions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/books">
              <Button variant="outline" className="w-full h-auto p-4 flex items-center justify-start group border-primary/20 hover:border-primary hover:bg-primary/5">
                <div className="w-10 h-10 bg-primary/10 group-hover:bg-primary/20 rounded-lg flex items-center justify-center mr-3">
                  <Plus className="text-primary" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-on-surface">{t("books.addBook")}</p>
                  <p className="text-sm text-text-muted">{t("dashboard.addBookDesc")}</p>
                </div>
              </Button>
            </Link>
            
            <Link href="/members">
              <Button variant="outline" className="w-full h-auto p-4 flex items-center justify-start group border-secondary/20 hover:border-secondary hover:bg-secondary/5">
                <div className="w-10 h-10 bg-secondary/10 group-hover:bg-secondary/20 rounded-lg flex items-center justify-center mr-3">
                  <UserPlus className="text-secondary" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-on-surface">{t("members.addMember")}</p>
                  <p className="text-sm text-text-muted">{t("dashboard.addMemberDesc")}</p>
                </div>
              </Button>
            </Link>
            
            <Link href="/borrowing">
              <Button variant="outline" className="w-full h-auto p-4 flex items-center justify-start group border-accent/20 hover:border-accent hover:bg-accent/5">
                <div className="w-10 h-10 bg-accent/10 group-hover:bg-accent/20 rounded-lg flex items-center justify-center mr-3">
                  <BarChart3 className="text-accent" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-on-surface">{t("dashboard.quickBorrow")}</p>
                  <p className="text-sm text-text-muted">{t("dashboard.quickBorrowDesc")}</p>
                </div>
              </Button>
            </Link>
            
            <Link href="/returns">
              <Button variant="outline" className="w-full h-auto p-4 flex items-center justify-start group border-destructive/20 hover:border-destructive hover:bg-destructive/5">
                <div className="w-10 h-10 bg-destructive/10 group-hover:bg-destructive/20 rounded-lg flex items-center justify-center mr-3">
                  <Undo2 className="text-destructive" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-on-surface">{t("dashboard.processReturn")}</p>
                  <p className="text-sm text-text-muted">{t("dashboard.processReturnDesc")}</p>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("dashboard.recentActivity")}</CardTitle>
            <Button variant="link" size="sm">{t("dashboard.viewAll")}</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <p className="text-center text-text-muted py-8">{t("dashboard.noRecentActivity")}</p>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Book className="text-secondary" size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-on-surface">
                        <span className="font-medium">{activity.user.name}</span> {t("dashboard.borrowed")} <span className="font-medium">"{activity.book.title}"</span>
                      </p>
                      <p className="text-xs text-text-muted">
                        {format(new Date(activity.borrowDate), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Popular Books */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("dashboard.mostBorrowedBooks")}</CardTitle>
            <Button variant="link" size="sm">{t("dashboard.viewAll")}</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!popularBooks || popularBooks.length === 0 ? (
                <p className="text-center text-text-muted py-8">{t("dashboard.noDataAvailable")}</p>
              ) : (
                popularBooks.slice(0, 5).map((book, index) => (
                  <div key={book.id} className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-primary">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-on-surface truncate">{book.title}</p>
                      <p className="text-sm text-text-muted">{book.author}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-on-surface">{t("dashboard.times", { count: book.borrowCount })}</p>
                      <div className="flex items-center mt-1">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ 
                              width: `${Math.min(100, (book.borrowCount / (popularBooks[0]?.borrowCount || 1)) * 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Items */}
      {overdueBorrowings && overdueBorrowings.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <TriangleAlert className="text-destructive mr-2" size={20} />
              {t("dashboard.overdueItemsAttention")}
            </CardTitle>
            <Badge variant="destructive">
              {overdueBorrowings.length} {t("dashboard.items")}
            </Badge>
          </CardHeader>
          <CardContent>
            <DataTable
              data={overdueBorrowings.slice(0, 10)}
              columns={overdueColumns}
              pageSize={5}
              emptyMessage={t("dashboard.noOverdueItems")}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
