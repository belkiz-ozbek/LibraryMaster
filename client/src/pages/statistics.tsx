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

export default function Statistics() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: popularBooks = [] } = useQuery({
    queryKey: ["/api/stats/popular-books"],
  });

  const { data: activeUsers = [] } = useQuery({
    queryKey: ["/api/stats/active-users"],
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: allBooks = [] } = useQuery({
    queryKey: ["/api/books"],
  });

  const { data: allBorrowings = [] } = useQuery({
    queryKey: ["/api/borrowings"],
  });

  // Calculate additional statistics
  const totalCopies = allBooks.reduce((sum, book) => sum + book.totalCopies, 0);
  const availableCopies = allBooks.reduce((sum, book) => sum + book.availableCopies, 0);
  const utilizationRate = totalCopies > 0 ? ((totalCopies - availableCopies) / totalCopies * 100) : 0;
  
  const ratedMembers = allUsers.filter(user => user.adminRating && !user.isAdmin);
  const averageRating = ratedMembers.length > 0 
    ? ratedMembers.reduce((sum, user) => sum + (user.adminRating || 0), 0) / ratedMembers.length 
    : 0;

  const returnedBorrowings = allBorrowings.filter(b => b.status === "returned");
  const onTimeReturns = returnedBorrowings.filter(b => 
    new Date(b.returnDate!) <= new Date(b.dueDate)
  ).length;
  const onTimeRate = returnedBorrowings.length > 0 
    ? (onTimeReturns / returnedBorrowings.length * 100) 
    : 0;

  const popularBooksColumns = [
    {
      key: "rank",
      title: "Rank",
      render: (_: any, row: any, index: number) => (
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-primary">{index + 1}</span>
        </div>
      ),
    },
    {
      key: "title",
      title: "Book",
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
      title: "Genre",
      render: (value: string) => (
        <Badge variant="secondary">{value}</Badge>
      ),
    },
    {
      key: "borrowCount",
      title: "Times Borrowed",
      sortable: true,
      render: (value: number) => (
        <div className="text-center">
          <span className="font-semibold">{value}</span>
        </div>
      ),
    },
    {
      key: "popularity",
      title: "Popularity",
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
      title: "Rank",
      render: (_: any, row: any, index: number) => (
        <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-secondary">{index + 1}</span>
        </div>
      ),
    },
    {
      key: "name",
      title: "Member",
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
      title: "Books Borrowed",
      sortable: true,
      render: (value: number) => (
        <div className="text-center">
          <span className="font-semibold">{value}</span>
        </div>
      ),
    },
    {
      key: "adminRating",
      title: "Rating",
      render: (value: number | null) => {
        if (!value) return <span className="text-text-muted">Not rated</span>;
        
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
      title: "Member Since",
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
            <h2 className="text-xl font-semibold text-on-surface mb-2">Admin Access Required</h2>
            <p className="text-text-muted">
              You need administrator privileges to access statistics and reports.
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
        <h1 className="text-2xl font-bold text-on-surface">Statistics & Reports</h1>
        <p className="text-text-muted">View library analytics and performance metrics</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Books"
          value={stats?.totalBooks || 0}
          change={`${totalCopies} total copies`}
          changeType="neutral"
          icon={<Book size={20} />}
          iconColor="bg-primary/10 text-primary"
        />
        <StatsCard
          title="Active Members"
          value={stats?.totalUsers || 0}
          change={`Avg. rating: ${averageRating.toFixed(1)}/5`}
          changeType="positive"
          icon={<Users size={20} />}
          iconColor="bg-secondary/10 text-secondary"
        />
        <StatsCard
          title="Active Borrowings"
          value={stats?.activeBorrowings || 0}
          change={`${utilizationRate.toFixed(0)}% utilization rate`}
          changeType="neutral"
          icon={<Activity size={20} />}
          iconColor="bg-accent/10 text-accent"
        />
        <StatsCard
          title="On-Time Returns"
          value={`${onTimeRate.toFixed(0)}%`}
          change={`${onTimeReturns}/${returnedBorrowings.length} returns`}
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
                <p className="text-sm text-text-muted">Collection Utilization</p>
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
                <p className="text-sm text-text-muted">Average Member Rating</p>
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
                <p className="text-sm text-text-muted">Highly Rated Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Borrowed Books */}
        <Card>
          <CardHeader>
            <CardTitle>Most Borrowed Books</CardTitle>
            <CardDescription>
              Top {Math.min(10, popularBooks.length)} most popular books
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={popularBooks.slice(0, 10)}
              columns={popularBooksColumns}
              pageSize={5}
              emptyMessage="No borrowing data available"
            />
          </CardContent>
        </Card>

        {/* Most Active Users */}
        <Card>
          <CardHeader>
            <CardTitle>Most Active Members</CardTitle>
            <CardDescription>
              Top {Math.min(10, activeUsers.length)} most active library members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={activeUsers.filter(u => !u.isAdmin).slice(0, 10)}
              columns={activeUsersColumns}
              pageSize={5}
              emptyMessage="No member activity data available"
            />
          </CardContent>
        </Card>
      </div>

      {/* Collection Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Collection Overview</CardTitle>
          <CardDescription>Library collection statistics by genre</CardDescription>
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
                    <Badge variant="outline">{genreBooks.length} titles</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-text-muted">
                    <div className="flex justify-between">
                      <span>Total copies:</span>
                      <span>{totalInGenre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Available:</span>
                      <span>{availableInGenre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Utilization:</span>
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
