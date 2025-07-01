import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityTimeline, ActivityItem } from "@/components/ui/activity-timeline";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Filter, 
  RefreshCw,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useState } from "react";

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
  const [filter, setFilter] = useState<string>('all');
  const [variant, setVariant] = useState<'default' | 'compact' | 'detailed'>('default');

  const { data: activities = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/activities/feed"],
    refetchOnWindowFocus: true,
  });

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

  return (
    <div className="space-y-6">
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Aktivite Akışı</h1>
            <p className="text-muted-foreground">
              Kütüphane sistemindeki tüm aktiviteleri takip edin
            </p>
          </div>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            size="sm"
            className="transition-colors hover:bg-primary hover:text-white active:scale-95 focus:ring-2 focus:ring-primary/50"
          >
            <RefreshCw size={16} className="mr-2" />
            Yenile
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
                <p className="text-sm text-muted-foreground">Toplam</p>
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
                <p className="text-sm text-muted-foreground">Ödünç Alma</p>
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
                <p className="text-sm text-muted-foreground">İade</p>
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
                <p className="text-sm text-muted-foreground">Gecikmiş</p>
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
                <p className="text-sm text-muted-foreground">Yeni Üye</p>
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
                <p className="text-sm text-muted-foreground">Yeni Kitap</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filtreler */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium">Filtre:</span>
        </div>
        
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Aktiviteler</SelectItem>
            <SelectItem value="borrowing">Ödünç Almalar</SelectItem>
            <SelectItem value="return">İadeler</SelectItem>
            <SelectItem value="overdue">Gecikmiş</SelectItem>
            <SelectItem value="member_added">Yeni Üyeler</SelectItem>
            <SelectItem value="book_added">Yeni Kitaplar</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Görünüm:</span>
        </div>
        
        <Select value={variant} onValueChange={(value: 'default' | 'compact' | 'detailed') => setVariant(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Varsayılan</SelectItem>
            <SelectItem value="compact">Kompakt</SelectItem>
            <SelectItem value="detailed">Detaylı</SelectItem>
          </SelectContent>
        </Select>

        <Badge variant="secondary" className="ml-auto">
          {filteredActivities.length} aktivite
        </Badge>
      </motion.div>

      {/* Aktivite Timeline */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Aktivite Akışı</CardTitle>
            <CardDescription>
              Sistemdeki son aktiviteleri kronolojik sırayla görüntüleyin
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Aktiviteler yükleniyor...</p>
              </div>
            ) : (
              <ActivityTimeline 
                activities={filteredActivities}
                showAvatars={true}
                variant={variant}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 