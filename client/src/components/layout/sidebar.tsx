import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { 
  Book, 
  Users, 
  HandHeart, 
  Undo2, 
  Star, 
  BarChart3, 
  LayoutDashboard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Activity
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation = [
    { name: t("navigation.dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("navigation.books"), href: "/books", icon: Book },
    { name: t("navigation.members"), href: "/members", icon: Users },
    { name: t("navigation.borrowing"), href: "/borrowing", icon: HandHeart },
    { name: t("navigation.returns"), href: "/returns", icon: Undo2 },
    { name: t("navigation.activities"), href: "/activities", icon: Activity },
  ];

  const adminNavigation = [
    { name: t("navigation.evaluations"), href: "/evaluations", icon: Star },
    { name: t("navigation.statistics"), href: "/statistics", icon: BarChart3 },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className={`relative bg-white shadow-material flex flex-col border-r border-gray-200 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} h-screen`}>
      {/* Daralt/Genişlet Butonu */}
      <button
        className="absolute top-6 -right-4 z-10 w-8 h-8 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center hover:bg-gray-50 transition-colors duration-300"
        onClick={() => setIsCollapsed((prev) => !prev)}
        type="button"
        tabIndex={0}
        aria-label={isCollapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
      >
        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
      <TooltipProvider>
      {/* Header */}
      <div className={`p-6 border-b border-gray-200 flex items-center space-x-3 ${isCollapsed ? 'justify-center' : ''} transition-all duration-300`}> 
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center transition-all duration-300">
          <Book className="text-white text-lg" size={20} />
        </div>
        {!isCollapsed && (
          <div className="transition-opacity duration-300 opacity-100">
            <h1 className="text-xl font-medium text-on-surface">LibraryMS</h1>
            <p className="text-sm text-text-muted">{t('sidebar.managementSystem')}</p>
          </div>
        )}
      </div>
      {/* Navigation */}
      <nav className={`flex-1 px-4 py-6 space-y-2 ${isCollapsed ? 'px-2' : ''} transition-all duration-300`}>
        {navigation.map((item) => {
          const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href}>
              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-center ${isActive 
                        ? "bg-primary/10 text-primary hover:bg-primary/15" 
                        : "text-text-muted hover:bg-gray-50 hover:text-on-surface"} px-2 transition-all duration-300`}
                    >
                      <Icon size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.name}</TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${isActive 
                    ? "bg-primary/10 text-primary hover:bg-primary/15" 
                    : "text-text-muted hover:bg-gray-50 hover:text-on-surface"} transition-all duration-300`}
                >
                  <Icon size={18} className="mr-3" />
                  <span className="transition-opacity duration-300 opacity-100">{item.name}</span>
                </Button>
              )}
            </Link>
          );
        })}
        {/* Admin Section */}
        {user?.isAdmin && (
          <div className={`pt-6 mt-6 border-t border-gray-200 ${isCollapsed ? 'px-2' : ''} transition-all duration-300`}>
            {!isCollapsed && (
              <p className="px-4 mb-3 text-xs font-medium text-text-muted uppercase tracking-wider transition-opacity duration-300 opacity-100">
                {t('sidebar.admin')}
              </p>
            )}
            {adminNavigation.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          className={`w-full justify-center ${isActive 
                            ? "bg-primary/10 text-primary hover:bg-primary/15" 
                            : "text-text-muted hover:bg-gray-50 hover:text-on-surface"} px-2 transition-all duration-300`}
                        >
                          <Icon size={18} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.name}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${isActive 
                        ? "bg-primary/10 text-primary hover:bg-primary/15" 
                        : "text-text-muted hover:bg-gray-50 hover:text-on-surface"} transition-all duration-300`}
                    >
                      <Icon size={18} className="mr-3" />
                      <span className="transition-opacity duration-300 opacity-100">{item.name}</span>
                    </Button>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </nav>
      {/* User Profile */}
      <div className={`p-4 border-t border-gray-200 flex items-center space-x-3 ${isCollapsed ? 'justify-center' : ''} transition-all duration-300`}>
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center transition-all duration-300">
          <span className="text-xs font-medium text-white">
            {user ? getInitials(user.name) : "U"}
          </span>
        </div>
        {!isCollapsed && (
          <div className="flex-1 min-w-0 transition-opacity duration-300 opacity-100">
            <p className="text-sm font-medium text-on-surface truncate">
              {user?.name || t('sidebar.user')}
            </p>
            <p className="text-xs text-text-muted">
              {user?.isAdmin ? t('sidebar.administrator') : t('sidebar.staff')}
            </p>
          </div>
        )}
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-text-muted hover:text-on-surface"
          >
            <LogOut size={16} />
          </Button>
        )}
      </div>
      </TooltipProvider>
    </aside>
  );
}
