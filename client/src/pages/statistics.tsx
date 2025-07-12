import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { useAuth } from "@/lib/auth";
import { 
  BarChart3, 
  Users, 
  Book as BookIcon, 
  TrendingUp, 
  Star, 
  Clock,
  Activity,
  Award,
  Crown
} from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import type { User, Book, Borrowing } from "@shared/schema";
import { useEffect, useRef, useState } from "react";
import Confetti from 'react-dom-confetti';
import Player from 'lottie-react';
import { Link } from "react-router-dom";
import { capitalizeWords } from "@/lib/utils";
import LoadingScreen from "@/components/ui/loading-screen";

interface Stats {
  totalBooks: number;
  totalUsers: number;
  activeBorrowings: number;
}

interface PopularBook extends Book {
  borrowCount: number;
}

interface ActiveUser extends User {
  borrowCount: number;
}

interface TopReader {
  userId: number;
  name: string;
  email: string;
  totalPagesRead: number;
}

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

export default function Statistics() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: popularBooks = [] } = useQuery<PopularBook[]>({
    queryKey: ["/api/stats/popular-books"],
  });

  const { data: activeUsers = [] } = useQuery<ActiveUser[]>({
    queryKey: ["/api/stats/active-users"],
  });

  const { data: topReaders = [] } = useQuery<TopReader[]>({
    queryKey: ["/api/stats/top-readers-month"],
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: allBooks = [] } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  const { data: allBorrowings = [] } = useQuery<Borrowing[]>({
    queryKey: ["/api/borrowings"],
  });

  // Calculate additional statistics
  const totalCopies = allBooks?.reduce((sum, book) => sum + book.totalCopies, 0) || 0;
  const availableCopies = allBooks?.reduce((sum, book) => sum + book.availableCopies, 0) || 0;
  const utilizationRate = totalCopies > 0 ? ((totalCopies - availableCopies) / totalCopies * 100) : 0;
  
  const ratedMembers = allUsers?.filter((user) => user.adminRating) || [];
  const averageRating = ratedMembers.length > 0 
    ? ratedMembers.reduce((sum, user) => sum + (user.adminRating || 0), 0) / ratedMembers.length 
    : 0;

  const returnedBorrowings = allBorrowings?.filter((b) => b.status === "returned") || [];
  const onTimeReturns = returnedBorrowings.filter((b) => 
    new Date(b.returnDate!) <= new Date(b.dueDate)
  ).length;
  const onTimeRate = returnedBorrowings.length > 0 
    ? (onTimeReturns / returnedBorrowings.length * 100) 
    : 0;

  const popularBooksColumns = [
    {
      key: "rank",
      title: t("statistics.rank"),
      render: (_: any, __: any, index: number) => (
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-primary">{index + 1}</span>
        </div>
      ),
    },
    {
      key: "title",
      title: t("borrowing.book"),
      sortable: true,
      render: (value: string, row: PopularBook) => (
        <div>
          <p className="font-medium text-on-surface">{capitalizeWords(value)}</p>
          <p className="text-sm text-text-muted">{capitalizeWords(row.author)}</p>
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
      render: (_: any, row: PopularBook) => {
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
      render: (_: any, __: any, index: number) => (
        <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-secondary">{index + 1}</span>
        </div>
      ),
    },
    {
      key: "name",
      title: t("members.name"),
      sortable: true,
      render: (value: string, row: ActiveUser) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
            <span className="text-xs font-medium text-primary">
              {value.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <div>
            <Link to={`/members/${row.id}`} className="font-medium text-on-surface hover:underline hover:text-primary transition-colors">
              {capitalizeWords(value)}
            </Link>
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

  const [showChampions, setShowChampions] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const podiumRef = useRef<HTMLDivElement>(null);
  const confettiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showChampions && topReaders && topReaders.length >= 3) {
      const timer = setTimeout(() => setConfettiActive(true), 700);
      return () => clearTimeout(timer);
    }
  }, [showChampions, topReaders]);

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

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Memoize expensive calculations
  const statsData = {
    totalBooks: stats?.totalBooks || 0,
    totalUsers: stats?.totalUsers || 0,
    activeBorrowings: stats?.activeBorrowings || 0,
    totalCopies,
    utilizationRate,
    averageRating,
    onTimeRate,
    onTimeReturns,
    returnedBorrowingsLength: returnedBorrowings.length,
    highlyRatedMembers: ratedMembers.filter(u => u.adminRating! >= 4).length
  };

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        {/* Başlık ve açıklama kaldırıldı, sadece header'da görünecek */}
      </motion.div>

      {/* Top Readers of the Month - SAHNE/PODYUM EFEKTİ */}
      <motion.div variants={itemVariants}>
        <div>
          <AnimatePresence mode="wait">
            {!showChampions ? (
              <motion.div
                key="show-button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4 }}
                className="flex justify-center"
              >
                <button
                  onClick={() => setShowChampions(true)}
                  className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  🏆 {t("statistics.showTopReadersButton")}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="champions-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative max-w-3xl mx-auto rounded-2xl overflow-hidden border border-[#ede7f6] shadow-none bg-gradient-to-tr from-[#e0c3fc] via-[#f3e7fa] via-[#ede7f6] via-[#d4e0fc] via-[#eaf6fb] to-[#a1c4fd] bg-opacity-100 backdrop-blur-0 mt-8 mb-8"
              >
                {/* Canlı Arka Plan */}
                <div className="absolute inset-0 -z-10 overflow-hidden rounded-2xl pointer-events-none">
                  {/* Soft pastel confetti veya blur efekti istenirse buraya eklenebilir */}
                </div>

                {/* Başlık */}
                <motion.div
                  className="w-full flex flex-col items-center mb-4 px-4 pt-5"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: { transition: { staggerChildren: 0.1 } },
                  }}
                >
                  {/* Crown Icon */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: -50 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
                    }}
                  >
                    <Crown className="text-amber-400 drop-shadow-md" size={32} />
                  </motion.div>

                  {/* Text with Masking Animation */}
                  <div className="bg-gradient-to-r from-yellow-500 to-amber-300 bg-clip-text text-transparent drop-shadow-sm text-2xl md:text-3xl font-semibold tracking-tight mt-1">
                    <motion.div
                      className="flex"
                      variants={{
                        visible: { transition: { staggerChildren: 0.05 } },
                      }}
                    >
                      {t("statistics.topReadersOfMonth").split("").map((char, index) => (
                        <div key={index} className="overflow-hidden py-1">
                          <motion.span
                            className="inline-block"
                            variants={{
                              hidden: { y: "100%", opacity: 0.5 },
                              visible: { y: "0%", opacity: 1, transition: { duration: 0.5, ease: "circOut" } },
                            }}
                          >
                            {char === " " ? "\u00A0" : char}
                          </motion.span>
                        </div>
                      ))}
                    </motion.div>
                  </div>
                </motion.div>

                {/* Podyum ve Confetti */}
                <div ref={podiumRef} className="relative w-full flex flex-col items-center justify-center overflow-visible pb-4 px-2">
                  {/* Konfeti animasyonu */}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 30 }}>
                    <div style={{ marginTop: 40 }}>
                      <Confetti active={confettiActive} config={{
                        angle: 90,
                        spread: 120,
                        startVelocity: 50,
                        elementCount: 200,
                        dragFriction: 0.1,
                        duration: 2500,
                        stagger: 3,
                        width: '12px',
                        height: '20px',
                        colors: ['#FFD700', '#FF69B4', '#7FDBFF', '#B10DC9', '#FFF', '#F5F5F5'],
                      }} />
                    </div>
                  </div>
                  {/* Podyum ve kullanıcılar */}
                  <div className="relative flex items-end justify-center gap-12 z-10 mt-6 w-[340px] mx-auto">
                    {/* 2. */}
                    <PodiumUser
                      place={2}
                      reader={topReaders[1]}
                      height="h-20"
                      podiumColor="bg-gradient-to-t from-blue-100 via-gray-100 to-gray-200"
                      borderColor="border-blue-200"
                      avatarBg="bg-gradient-to-br from-gray-300 via-gray-100 to-blue-100"
                      delay={1.1}
                      t={t}
                    />
                    {/* 1. */}
                    <PodiumUser
                      place={1}
                      reader={topReaders[0]}
                      height="h-28"
                      podiumColor="bg-gradient-to-t from-yellow-200 via-yellow-50 to-yellow-100"
                      borderColor="border-yellow-300"
                      avatarBg="bg-gradient-to-br from-yellow-200 via-yellow-50 to-yellow-100"
                      delay={0.5}
                      t={t}
                    />
                    {/* 3. */}
                    <PodiumUser
                      place={3}
                      reader={topReaders[2]}
                      height="h-16"
                      podiumColor="bg-gradient-to-t from-orange-200 via-orange-100 to-yellow-100"
                      borderColor="border-orange-300"
                      avatarBg="bg-gradient-to-br from-orange-300 via-orange-100 to-yellow-100"
                      delay={1.7}
                      t={t}
                    />
                  </div>
                  {/* Podyum taban */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[340px] h-7 bg-gradient-to-t from-black/10 to-transparent rounded-b-2xl blur-sm z-0" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        <motion.div variants={itemVariants} className="h-full w-full">
          <StatsCard
            title={t("statistics.totalBooks")}
            value={statsData.totalBooks}
            change={t("statistics.totalCopies", { count: totalCopies })}
            changeType="neutral"
            icon={<BookIcon size={20} />}
            iconColor="bg-primary/10 text-primary"
          />
        </motion.div>
        <motion.div variants={itemVariants} className="h-full w-full">
          <StatsCard
            title={t("statistics.activeMembers")}
            value={statsData.totalUsers}
            change={t("statistics.avgRating", { rating: averageRating.toFixed(1) })}
            changeType="positive"
            icon={<Users size={20} />}
            iconColor="bg-secondary/10 text-secondary"
          />
        </motion.div>
        <motion.div variants={itemVariants} className="h-full w-full">
          <StatsCard
            title={t("statistics.activeBorrowings")}
            value={statsData.activeBorrowings}
            change={`%${utilizationRate.toFixed(0)} kullanım`}
            changeType="neutral"
            icon={<Activity size={20} />}
            iconColor="bg-accent/10 text-accent"
          />
        </motion.div>
        <motion.div variants={itemVariants} className="h-full w-full">
          <StatsCard
            title={t("statistics.onTimeReturns")}
            value={`${onTimeRate.toFixed(0)}%`}
            change={t("statistics.returnsCount", { onTime: onTimeReturns, total: returnedBorrowings.length })}
            changeType={onTimeRate >= 80 ? "positive" : onTimeRate >= 60 ? "neutral" : "negative"}
            icon={<Clock size={20} />}
            iconColor="bg-primary/10 text-primary"
          />
        </motion.div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="h-full">
          <CardContent className="min-h-[60px] sm:min-h-[90px] p-2 sm:p-4 h-full flex items-center">
            <div className="flex items-center w-full">
              <TrendingUp className="h-8 w-8 text-accent mr-3 flex-shrink-0" />
              <div>
                <p className="text-2xl font-bold text-on-surface">
                  {utilizationRate.toFixed(1)}%
                </p>
                <p className="text-sm text-text-muted">{t("statistics.collectionUtilization")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="min-h-[60px] sm:min-h-[90px] p-2 sm:p-4 h-full flex items-center">
            <div className="flex items-center w-full">
              <Star className="h-8 w-8 text-accent mr-3 flex-shrink-0" />
              <div>
                <p className="text-2xl font-bold text-on-surface">
                  {averageRating.toFixed(1)}/5
                </p>
                <p className="text-sm text-text-muted">{t("statistics.avgMemberRating")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="min-h-[60px] sm:min-h-[90px] p-2 sm:p-4 h-full flex items-center">
            <div className="flex items-center w-full">
              <Award className="h-8 w-8 text-secondary mr-3 flex-shrink-0" />
              <div>
                <p className="text-2xl font-bold text-on-surface">
                  {statsData.highlyRatedMembers}
                </p>
                <p className="text-sm text-text-muted">{t("statistics.highlyRatedMembers")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Most Borrowed Books */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>{t("statistics.mostBorrowedBooks")}</CardTitle>
              <CardDescription>
                {t("statistics.topPopularBooks", { count: 5 })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={popularBooks.slice(0, 5)}
                columns={popularBooksColumns}
                emptyMessage={t("statistics.noBorrowingData")}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Most Active Members */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>{t("statistics.mostActiveMembers")}</CardTitle>
              <CardDescription>
                {t("statistics.topActiveMembers", { count: 5 })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={activeUsers.slice(0, 5)}
                columns={activeUsersColumns}
                emptyMessage={t("statistics.noMemberActivity")}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

// --- SAHNE BİLEŞENLERİ ---

function PodiumUser({ place, reader, height, podiumColor, borderColor, avatarBg, delay, t }: any) {
  if (!reader) return <div className={`flex flex-col items-center justify-end w-24 ${height}`}></div>;
  const avatar = reader.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
  return (
    <motion.div
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: "0%", opacity: 1 }}
      transition={{ type: "spring", stiffness: 50, damping: 15, delay, mass: 1.2 }}
      className="flex flex-col items-center justify-end w-24"
    >
      {/* Avatar ve taç */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: delay + 0.4 }}
        className="relative flex flex-col items-center mb-2"
      >
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${avatarBg} border-2 ${borderColor} shadow-lg`}>
          {avatar}
        </div>
        <span className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center rounded-full text-base font-bold bg-white border ${borderColor} text-yellow-500 shadow`}>{place}</span>
      </motion.div>
      {/* Kullanıcı adı, email ve okunan sayfa (Gecikmeli Fade-in) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.6 }}
        className="text-center"
      >
        <div className="mb-1">
          <p className="font-medium text-base text-gray-900 whitespace-nowrap">{reader.name}</p>
          <p className="text-xs text-gray-400 whitespace-nowrap">{reader.email}</p>
        </div>
        <div className="mb-2">
          <p className="font-semibold text-base text-yellow-700">{reader.totalPagesRead.toLocaleString()}</p>
          <p className="text-xs text-gray-400">{t("statistics.pagesRead")}</p>
        </div>
      </motion.div>
      {/* Podyum kutusu */}
      <motion.div
        className={`w-full ${height} ${podiumColor} border ${borderColor} rounded-t-xl flex items-end justify-center shadow-md`}
      />
    </motion.div>
  );
}
