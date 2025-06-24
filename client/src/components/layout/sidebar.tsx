import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
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
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React from "react";

export default function ModernSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const navigation = [
    { name: t("navigation.dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("navigation.books"), href: "/books", icon: Book },
    { name: t("navigation.members"), href: "/members", icon: Users },
    { name: t("navigation.borrowing"), href: "/borrowing", icon: HandHeart },
    { name: t("navigation.returns"), href: "/returns", icon: Undo2 },
  ];

  const adminNavigation = [
    { name: t("navigation.evaluations"), href: "/evaluations", icon: Star },
    { name: t("navigation.statistics"), href: "/statistics", icon: BarChart3 },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <SidebarProvider>
      <Sidebar
        className="bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 shadow-material transition-all duration-300"
      >
        <SidebarHeader className="flex flex-col items-center gap-2 py-6">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
            <Book className="text-white" size={36} />
          </div>
          <span className="text-xl font-bold text-on-surface tracking-tight">LibraryMS</span>
          <span className="text-xs text-text-muted">{t('sidebar.managementSystem')}</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navigation.map((item) => {
              const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.name}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      size="lg"
                      className={cn(
                        "group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-base font-medium",
                        "hover:scale-105 hover:bg-primary/20 hover:shadow-lg",
                        isActive ? "bg-primary/15 text-primary" : "text-text-muted hover:text-primary",
                        "focus-visible:ring-2 focus-visible:ring-primary"
                      )}
                    >
                      <Icon size={28} className="transition-transform duration-200 group-hover:scale-125" />
                      <span>{item.name}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              );
            })}
            {user?.isAdmin && (
              <>
                <div className="mt-6 mb-2 px-4 text-xs font-semibold text-text-muted uppercase tracking-wider opacity-80">
                  {t('sidebar.admin')}
                </div>
                {adminNavigation.map((item) => {
                  const isActive = location === item.href;
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.name}>
                      <Link href={item.href}>
                        <SidebarMenuButton
                          isActive={isActive}
                          size="lg"
                          className={cn(
                            "group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-base font-medium",
                            "hover:scale-105 hover:bg-primary/20 hover:shadow-lg",
                            isActive ? "bg-primary/15 text-primary" : "text-text-muted hover:text-primary",
                            "focus-visible:ring-2 focus-visible:ring-primary"
                          )}
                        >
                          <Icon size={28} className="transition-transform duration-200 group-hover:scale-125" />
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  );
                })}
              </>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="mt-auto flex flex-col items-center gap-4 py-6 border-t border-white/30 dark:border-slate-700/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white text-lg font-bold">
              {user ? getInitials(user.name) : "U"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-on-surface truncate max-w-[120px]">{user?.name || t('sidebar.user')}</span>
              <span className="text-xs text-text-muted">{user?.isAdmin ? t('sidebar.administrator') : t('sidebar.staff')}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-text-muted hover:text-destructive transition-colors"
              title={t('sidebar.logout')}
            >
              <LogOut size={20} />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}
