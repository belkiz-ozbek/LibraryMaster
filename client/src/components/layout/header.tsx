import { useState } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Bell, Globe, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export default function Header() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { logout } = useAuth();
  const { t, i18n } = useTranslation();

  const pageTitle = {
    "/": t("navigation.dashboard"),
    "/dashboard": t("navigation.dashboard"),
    "/books": t("books.title"),
    "/members": t("members.title"),
    "/borrowing": t("borrowing.title"),
    "/returns": t("borrowing.returnBook"),
    "/evaluations": t("navigation.evaluations"),
    "/statistics": t("navigation.statistics"),
  };

  const pageDescription = {
    "/": t("header.overview"),
    "/dashboard": t("header.overview"),
    "/books": t("header.books"),
    "/members": t("header.members"),
    "/borrowing": t("header.borrowing"),
    "/returns": t("header.returns"),
    "/evaluations": t("header.evaluations"),
    "/statistics": t("header.statistics"),
  };

  const currentTitle =
    location.startsWith("/members/")
      ? t("members.details.title")
      : location.startsWith("/activities")
        ? "Aktivite Akışı"
        : pageTitle[location as keyof typeof pageTitle] || t("header.pageNotFound");

  const currentDescription =
    location.startsWith("/members/")
      ? t("members.details.subtitle")
      : location.startsWith("/activities")
        ? "Kütüphane sistemindeki tüm aktiviteleri takip edin"
        : pageDescription[location as keyof typeof pageDescription] || "";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement global search functionality
    console.log("Searching for:", searchQuery);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <header className="bg-white border-b border-gray-100 px-8 py-5 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            {currentTitle}
          </h1>
          {currentDescription && (
            <p className="text-xs text-gray-400 font-normal mt-0.5">
              {currentDescription}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-6">
          {/* Search Box */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              type="text"
              placeholder={t("header.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 pl-9 pr-3 py-1.5 rounded-md bg-white border border-gray-200 focus:ring-1 focus:ring-blue-100 text-sm"
            />
          </form>
          
          {/* Notification Bell */}
          <Button variant="ghost" size="sm" className="relative rounded-full hover:bg-gray-50 transition-colors">
            <Bell size={20} className="text-gray-400" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              3
            </Badge>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-50 transition-colors">
                <Globe className="h-5 w-5 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px] rounded-xl shadow p-1">
              <DropdownMenuItem onClick={() => changeLanguage('tr')} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${i18n.language === 'tr' ? 'bg-blue-50 font-semibold' : ''}`}>
                <span className="text-lg">🇹🇷</span>
                <span>Turkish</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('en')} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${i18n.language === 'en' ? 'bg-blue-50 font-semibold' : ''}`}>
                <span className="text-lg">🇺🇸</span>
                <span>English</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" onClick={logout} className="rounded-full px-3 py-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors font-normal flex items-center gap-2 text-sm">
            {t('auth.logout')}
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </header>
  );
}
