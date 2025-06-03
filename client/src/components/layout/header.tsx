import { useState } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Bell, Globe } from "lucide-react";
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

  const currentTitle = pageTitle[location as keyof typeof pageTitle] || t("header.pageNotFound");
  const currentDescription = pageDescription[location as keyof typeof pageDescription] || "";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement global search functionality
    console.log("Searching for:", searchQuery);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-on-surface">{currentTitle}</h1>
          {currentDescription && (
            <p className="text-sm text-text-muted">{currentDescription}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search Box */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={16} />
            <Input
              type="text"
              placeholder={t("header.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-80 pl-10 pr-4 py-2"
            />
          </form>
          
          {/* Notification Bell */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell size={20} className="text-text-muted" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              3
            </Badge>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => changeLanguage('tr')}>
                {t('common.turkish')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('en')}>
                {t('common.english')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" onClick={logout}>
            {t('auth.logout')}
          </Button>
        </div>
      </div>
    </header>
  );
}
