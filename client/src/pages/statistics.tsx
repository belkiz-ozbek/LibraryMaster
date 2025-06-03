import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { useAuth } from "@/lib/auth";
import { 
  BarChart3, 
  Users, 
  Book, 
  TrendingUp, 
  Star, 
  Clock,
  Activity,
  Award
} from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

export default function Statistics() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: popularBooks = [] } = useQuery<any[]>({
    queryKey: ["/api/stats/popular-books"],
  });

  const { data: activeUsers = [] } = useQuery<any[]>({
    queryKey: ["/api/stats/active-users"],
  });

  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const { data: allBooks = [] } = useQuery<any[]>({
    queryKey: ["/api/books"],
  });

  const { data: allBorrowings = [] } = useQuery<any[]>({
    queryKey: ["/api/borrowings"],
  });

  // Calculate additional statistics
  const totalCopies = allBooks.reduce((sum: number, book: any) => sum + book.totalCopies, 0);
  const availableCopies = allBooks.reduce((sum: number, book: any) => sum + book.availableCopies, 0);
  const utilizationRate = totalCopies > 0 ? ((totalCopies - availableCopies) / totalCopies * 100) : 0;
  
  const ratedMembers = allUsers.filter((user: any) => user.adminRating && !user.isAdmin);
  const averageRating = ratedMembers.length > 0 
    ? ratedMembers.reduce((sum: number, user: any) => sum + (user.adminRating || 0), 0) / ratedMembers.length 
    : 0;

  const returnedBorrowings = allBorrowings.filter((b: any) => b.status === "returned");
  const onTimeReturns = returnedBorrowings.filter((b: any) => 
    new Date(b.returnDate!) <= new Date(b.dueDate)
  ).length;
  const onTimeRate = returnedBorrowings.length > 0 
    ? (onTimeReturns / returnedBorrowings.length * 100) 
    : 0;

  const popularBooksColumns = [
    {
      key: "rank",
      title: t("statistics.rank"),
      render: (_: any, row: any, index: number) => (
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-primary">{index + 1}</span>
        </div>
      ),
    },
    {
      key: "title",
      title: t("borrowing.book"),
      sortable: true,
      render: (value: string, row: any) => (
        <div>
          <p className="font-medium text-on-surface">{value}</p>
          <p className="text-sm text-text-muted">{row.author}</p>
        </div>
      ),
    },
    {
      key: "genre",
      title: t("books.genre"),
      render: (value: string) => (
        <Badge variant="secondary">{value}</Badge>
      ),
    },
    {
      key: "borrowCount",
      title: t("statistics.timesBorrowed"),
      sortable: true,
      render: (value: number) => (
        <div className="text-center">
          <span className="font-semibold">{value}</span>
        </div>
      ),
    },
    {
      key: "popularity",
      title: t("statistics.popularity"),
      render: (value: any, row: any) => {
        const maxBorrows = popularBooks[0]?.borrowCount || 1;
        const percentage = (row.borrowCount / maxBorrows) * 100;
        return (
          <div className="flex items-center">
            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full" 
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="ml-2 text-sm text-text-muted">{percentage.toFixed(0)}%</span>
          </div>
        );
      },
    },
  ];

  const activeUsersColumns = [
    {
      key: "rank",
      title: t("statistics.rank"),
      render: (_: any, row: any, index: number) => (
        <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-secondary">{index + 1}</span>
        </div>
      ),
    },
    {
      key: "name",
      title: t("members.name"),
      sortable: true,
      render: (value: string, row: any) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
            <span className="text-xs font-medium text-primary">
              {value.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-on-surface">{value}</p>
            <p className="text-sm text-text-muted">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "borrowCount",
      title: t("statistics.booksBorrowed"),
      sortable: true,
      render: (value: number) => (
        <div className="text-center">
          <span className="font-semibold">{value}</span>
        </div>
      ),
    },
    {
      key: "adminRating",
      title: t("statistics.rating"),
      render: (value: number | null) => {
        if (!value) return <span className="text-text-muted">{t("statistics.notRated")}</span>;
        
        return (
          <div className="flex items-center">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                size={14}
                className={i < value ? "text-accent fill-current" : "text-gray-300"}
              />
            ))}
            <span className="ml-1 text-sm text-text-muted">({value}/5)</span>
          </div>
        );
      },
    },
    {
      key: "membershipDate",
      title: t("statistics.memberSince"),
      render: (value: string) => format(new Date(value), "MMM yyyy"),
    },
  ];

  // Show admin access required if not admin
  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <BarChart3 className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-on-surface mb-2">{t("statistics.adminAccessRequired")}</h2>
            <p className="text-text-muted">
              {t("statistics.adminAccessRequiredDesc")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-on-surface">{t("statistics.titleAndReports")}</h1>
        <p className="text-text-muted">{t("statistics.analyticsDesc")}</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title={t("statistics.totalBooks")}
          value={stats?.totalBooks || 0}
          change={t("statistics.totalCopies", { count: totalCopies })}
          changeType="neutral"
          icon={<Book size={20} />}
          iconColor="bg-primary/10 text-primary"
        />
        <StatsCard
          title={t("statistics.activeMembers")}
          value={stats?.totalUsers || 0}
          change={t("statistics.avgRating", { rating: averageRating.toFixed(1) })}
          changeType="positive"
          icon={<Users size={20} />}
          iconColor="bg-secondary/10 text-secondary"
        />
        <StatsCard
          title={t("statistics.activeBorrowings")}
          value={stats?.activeBorrowings || 0}
          change={t("statistics.utilizationRate", { rate: utilizationRate.toFixed(0) })}
          changeType="neutral"
          icon={<Activity size={20} />}
          iconColor="bg-accent/10 text-accent"
        />
        <StatsCard
          title={t("statistics.onTimeReturns")}
          value={`${onTimeRate.toFixed(0)}%`}
          change={t("statistics.returnsCount", { onTime: onTimeReturns, total: returnedBorrowings.length })}
          changeType={onTimeRate >= 80 ? "positive" : onTimeRate >= 60 ? "neutral" : "negative"}
          icon={<Clock size={20} />}
          iconColor="bg-primary/10 text-primary"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-accent mr-3" />
              <div>
                <p className="text-2xl font-bold text-on-surface">
                  {utilizationRate.toFixed(1)}%
                </p>
                <p className="text-sm text-text-muted">{t("statistics.collectionUtilization")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-accent mr-3" />
              <div>
                <p className="text-2xl font-bold text-on-surface">
                  {averageRating.toFixed(1)}/5
                </p>
                <p className="text-sm text-text-muted">{t("statistics.avgMemberRating")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-secondary mr-3" />
              <div>
                <p className="text-2xl font-bold text-on-surface">
                  {ratedMembers.filter(u => u.adminRating! >= 4).length}
                </p>
                <p className="text-sm text-text-muted">{t("statistics.highlyRatedMembers")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Borrowed Books */}
        <Card>
          <CardHeader>
            <CardTitle>{t("statistics.mostBorrowedBooks")}</CardTitle>
            <CardDescription>
              {t("statistics.topPopularBooks", { count: Math.min(10, popularBooks.length) })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={popularBooks.slice(0, 10)}
              columns={popularBooksColumns}
              pageSize={5}
              emptyMessage={t("statistics.noBorrowingData")}
            />
          </CardContent>
        </Card>
        {/* Most Active Users */}
        <Card>
          <CardHeader>
            <CardTitle>{t("statistics.mostActiveMembers")}</CardTitle>
            <CardDescription>
              {t("statistics.topActiveMembers", { count: Math.min(10, activeUsers.length) })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={activeUsers.filter(u => !u.isAdmin).slice(0, 10)}
              columns={activeUsersColumns}
              pageSize={5}
              emptyMessage={t("statistics.noMemberActivity")}
            />
          </CardContent>
        </Card>
      </div>

      {/* Collection Overview */}
      <Card>
        <CardHeader>
          <CardTitle>{t("statistics.collectionOverview")}</CardTitle>
          <CardDescription>{t("statistics.collectionOverviewDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(new Set(allBooks.map(book => book.genre))).map(genre => {
              const genreBooks = allBooks.filter(book => book.genre === genre);
              const totalInGenre = genreBooks.reduce((sum, book) => sum + book.totalCopies, 0);
              const availableInGenre = genreBooks.reduce((sum, book) => sum + book.availableCopies, 0);
              const genreUtilization = totalInGenre > 0 ? ((totalInGenre - availableInGenre) / totalInGenre * 100) : 0;
              return (
                <div key={genre} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-on-surface">{genre}</h3>
                    <Badge variant="outline">{genreBooks.length} {t("statistics.titles")}</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-text-muted">
                    <div className="flex justify-between">
                      <span>{t("statistics.totalCopiesLabel")}</span>
                      <span>{totalInGenre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("statistics.availableLabel")}</span>
                      <span>{availableInGenre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("statistics.utilizationLabel")}</span>
                      <span>{genreUtilization.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${genreUtilization}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
