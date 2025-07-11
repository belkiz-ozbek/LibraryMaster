import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Book, 
  Undo2, 
  UserPlus, 
  Plus, 
  AlertTriangle, 
  Clock,
  CheckCircle,
  XCircle,
  Star,
  TrendingUp,
  Activity
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

export interface ActivityItem {
  id: string;
  type: 'borrowing' | 'return' | 'member_added' | 'book_added' | 'overdue' | 'rating' | 'achievement';
  title: string;
  description: string;
  user?: { name: string; email?: string };
  book?: { title: string; author?: string };
  date: string;
  status?: 'completed' | 'pending' | 'failed';
  metadata?: Record<string, any>;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  maxItems?: number;
  showAvatars?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

const activityIcons = {
  borrowing: Book,
  return: Undo2,
  member_added: UserPlus,
  book_added: Plus,
  overdue: AlertTriangle,
  rating: Star,
  achievement: TrendingUp
};

const activityColors = {
  borrowing: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-800/50',
    icon: 'text-green-600 dark:text-green-400',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
  },
  return: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800/50',
    icon: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
  },
  member_added: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-200 dark:border-purple-800/50',
    icon: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
  },
  book_added: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800/50',
    icon: 'text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300'
  },
  overdue: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800/50',
    icon: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
  },
  rating: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    border: 'border-yellow-200 dark:border-yellow-800/50',
    icon: 'text-yellow-600 dark:text-yellow-400',
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
  },
  achievement: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    border: 'border-indigo-200 dark:border-indigo-800/50',
    icon: 'text-indigo-600 dark:text-indigo-400',
    badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300'
  }
};

const statusIcons = {
  completed: CheckCircle,
  pending: Clock,
  failed: XCircle
};

const statusColors = {
  completed: 'text-green-600 dark:text-green-400',
  pending: 'text-yellow-600 dark:text-yellow-400',
  failed: 'text-red-600 dark:text-red-400'
};

export function ActivityTimeline({ 
  activities, 
  maxItems, 
  showAvatars = true,
  variant = 'default',
  className = '' 
}: ActivityTimelineProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'tr' ? tr : enUS;
  
  const displayedActivities = maxItems ? activities.slice(0, maxItems) : activities;

  const getActivityIcon = (type: ActivityItem['type']) => {
    const IconComponent = activityIcons[type];
    return IconComponent ? <IconComponent size={16} /> : <Activity size={16} />;
  };

  const getTimeAgo = (date: string) => {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      console.warn('Invalid date:', date);
      return 'Geçersiz tarih';
    }
    return formatDistanceToNow(parsedDate, { 
      addSuffix: true, 
      locale 
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Compact variant için spacing değerleri
  const spacing = variant === 'compact' ? 'space-y-2' : 'space-y-4';
  const cardPadding = variant === 'compact' ? 'p-3' : 'p-4';
  const avatarSize = variant === 'compact' ? 'w-8 h-8' : 'w-12 h-12';
  const iconSize = variant === 'compact' ? 14 : 16;
  const textSize = variant === 'compact' ? 'text-xs' : 'text-sm';
  const titleSize = variant === 'compact' ? 'text-sm' : 'text-base';

  return (
    <div className={`${spacing} ${className}`}>
      <AnimatePresence>
        {displayedActivities.map((activity, index) => {
          const colors = activityColors[activity.type];
          const StatusIcon = activity.status ? statusIcons[activity.status] : null;
          
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.1,
                ease: "easeOut"
              }}
              whileHover={{ 
                scale: 1.035,
                y: -2,
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.10)",
                transition: { duration: 0.2 }
              }}
              className="relative"
            >
              {/* Timeline Line */}
              {index < displayedActivities.length - 1 && (
                <div className={`absolute left-3 top-8 w-0.5 h-8 bg-gradient-to-b from-border to-transparent ${variant === 'compact' ? 'left-4 top-6 h-6' : ''}`} />
              )}
              
              <Card className={`relative overflow-hidden transition-all duration-300 border-t border-r border-b border-gray-200 shadow-xl rounded-2xl bg-white/70 backdrop-blur-md hover:bg-white/90 group border-l-[6px] ${colors.border}`}> 
                {/* Gradient Accent */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/60 via-transparent to-blue-100/40 group-hover:from-blue-50/80 group-hover:to-purple-100/60 transition-all duration-300" />
                <CardContent className={`${cardPadding} flex items-start gap-4 relative z-10`}> 
                  {/* Avatar/Icon */}
                  <div className="flex-shrink-0">
                    <div className={`${avatarSize} rounded-full flex items-center justify-center shadow-md bg-gradient-to-br from-white via-${colors.bg.replace('bg-', '')} to-gray-100/60 border border-white/40`}>
                      <div className={`${colors.icon} drop-shadow-md`}>
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1">
                        <div className={`font-semibold ${titleSize} text-gray-900 truncate`}>
                          {t(`activity.messages.${activity.type}`, {
                            user: activity.user?.name,
                            book: activity.book?.title
                          }) || activity.title}
                        </div>
                        {(variant === 'detailed') && (
                          <div className={`mt-1 text-gray-700 font-normal text-xs`}>
                            {t(`activity.messages.${activity.type}`, {
                              user: activity.user?.name,
                              book: activity.book?.title
                            }) || activity.description}
                          </div>
                        )}
                        {(variant !== 'detailed') && (
                          <div className={`text-xs text-gray-500 truncate mt-0.5`}>
                            {t(`activity.messages.${activity.type}`, {
                              user: activity.user?.name,
                              book: activity.book?.title
                            }) || activity.description}
                          </div>
                        )}
                      </div>
                      {StatusIcon && (
                        <StatusIcon className={`w-4 h-4 ml-2 ${statusColors[activity.status!]}`} />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {/* Badge */}
                      <Badge className={`rounded-full px-2 py-0.5 text-xs font-medium shadow ${colors.badge} border-0`}>{t(`activity.types.${activity.type}`)}</Badge>
                      {/* Time */}
                      <span className={`text-[11px] text-gray-400 font-normal ml-1`}>{getTimeAgo(activity.date)}</span>
                    </div>
                    {/* Metadata kutucukları sadece detailed'da göster */}
                    {variant === 'detailed' && activity.metadata && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {Object.entries(activity.metadata).map(([key, value]) => (
                          <div key={key} className="bg-gray-100 rounded-md px-2 py-1 text-xs text-gray-600 border border-gray-200">
                            <span className="font-medium text-gray-700 mr-1">{key}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Empty State */}
      {displayedActivities.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <Activity size={32} className="mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">{t('activity.noActivities')}</p>
          <p className="text-xs text-muted-foreground/70">{t('activity.noActivitiesDesc')}</p>
        </motion.div>
      )}
    </div>
  );
} 