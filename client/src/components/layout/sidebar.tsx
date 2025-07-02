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
    <aside className={`relative bg-white/90 backdrop-blur-md flex flex-col border-r border-gray-100 shadow-lg transition-all duration-300 ${isCollapsed ? 'w-24' : 'w-60'} h-screen overflow-visible`}>
      {/* Daralt/Genişlet Butonu */}
      <button
        className="absolute top-16 -right-6 z-10 w-9 h-9 flex items-center justify-center rounded-full overflow-visible bg-white/80 border border-gray-200 shadow-sm hover:bg-blue-50 transition-all duration-300"
        onClick={() => setIsCollapsed((prev) => !prev)}
        type="button"
        tabIndex={0}
        aria-label={isCollapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
      >
        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
      <TooltipProvider>
      {/* Header */}
      <div className={`p-6 border-b border-gray-100 flex items-center space-x-3 ${isCollapsed ? 'justify-center' : ''} transition-all duration-300 bg-white/80`}> 
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-400 rounded-xl flex items-center justify-center shadow-md ring-2 ring-blue-100">
          <Book className="text-white" size={20} />
        </div>
        {!isCollapsed && (
          <div className="transition-opacity duration-300 opacity-100">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">LibraryMS</h1>
            <p className="text-xs text-gray-400 font-medium">{t('sidebar.managementSystem')}</p>
          </div>
        )}
      </div>
      {/* Navigation */}
      <nav className={`flex-1 px-3 py-6 space-y-1 ${isCollapsed ? 'px-1' : ''} transition-all duration-300`}>
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
                      className={`w-full justify-center rounded-lg ${isActive 
                        ? "bg-gradient-to-r from-blue-100/80 to-purple-100/80 text-blue-700 shadow-md border-l-4 border-blue-400" 
                        : "text-gray-400 hover:bg-blue-50/60 hover:text-blue-600"} px-0 transition-all duration-200 h-11`}
                    >
                      <Icon size={19} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.name}</TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  variant="ghost"
                  className={`w-full justify-start rounded-lg font-medium ${isActive 
                    ? "bg-gradient-to-r from-blue-100/80 to-purple-100/80 text-blue-700 shadow-md border-l-4 border-blue-400" 
                    : "text-gray-600 hover:bg-blue-50/60 hover:text-blue-600"} transition-all duration-200 h-11 group px-3`}
                >
                  <span className={`flex items-center space-x-3`}>
                    <Icon size={19} />
                    <span className="transition-opacity duration-200 opacity-100 text-[15px] tracking-tight">{item.name}</span>
                  </span>
                </Button>
              )}
            </Link>
          );
        })}
        {/* Admin Section */}
        {user?.isAdmin && (
          <div className={`pt-5 mt-5 border-t border-gray-100 ${isCollapsed ? 'px-1' : ''} transition-all duration-300`}> 
            {!isCollapsed && (
              <p className="px-3 mb-2 text-[11px] font-semibold text-purple-500 uppercase tracking-widest flex items-center gap-1">
                <Star size={13} className="inline-block text-purple-300 mr-1" /> {t('sidebar.admin')}
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
                          className={`w-full justify-center rounded-lg ${isActive 
                            ? "bg-gradient-to-r from-purple-100/80 to-blue-100/80 text-purple-700 shadow-md border-l-4 border-purple-400" 
                            : "text-gray-400 hover:bg-purple-50/60 hover:text-purple-600"} px-0 transition-all duration-200 h-11`}
                        >
                          <Icon size={19} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.name}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button
                      variant="ghost"
                      className={`w-full justify-start rounded-lg font-medium ${isActive 
                        ? "bg-gradient-to-r from-purple-100/80 to-blue-100/80 text-purple-700 shadow-md border-l-4 border-purple-400" 
                        : "text-gray-600 hover:bg-purple-50/60 hover:text-purple-600"} transition-all duration-200 h-11 group px-3`}
                    >
                      <span className={`flex items-center space-x-3`}>
                        <Icon size={19} />
                        <span className="transition-opacity duration-200 opacity-100 text-[15px] tracking-tight">{item.name}</span>
                      </span>
                    </Button>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </nav>
      {/* User Profile */}
      <div className={`p-4 border-t border-gray-100 flex items-center space-x-3 ${isCollapsed ? 'justify-center' : ''} transition-all duration-300 bg-white/80`}> 
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow ring-2 ring-blue-100">
          <span className="text-sm font-semibold text-blue-700 select-none">
            {user ? getInitials(user.name) : "U"}
          </span>
        </div>
        {!isCollapsed && (
          <div className="flex-1 min-w-0 transition-opacity duration-200 opacity-100">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user?.name || t('sidebar.user')}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${user?.isAdmin ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}> 
                {user?.isAdmin ? t('sidebar.administrator') : t('sidebar.staff')}
              </span>
            </div>
          </div>
        )}
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-500 transition-colors duration-200"
            aria-label="Çıkış yap"
          >
            <LogOut size={17} />
          </Button>
        )}
      </div>
      </TooltipProvider>
    </aside>
  );
}
