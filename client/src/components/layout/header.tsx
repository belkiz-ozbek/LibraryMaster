import { useState, useRef } from "react";
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
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>({ books: [], users: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.length < 2) return;
    setSearchLoading(true);
    try {
      const [booksRes, usersRes] = await Promise.all([
        fetch(`/api/books/search?q=${encodeURIComponent(searchQuery)}`),
        fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`),
      ]);
      const [books, users] = await Promise.all([
        booksRes.json(),
        usersRes.json(),
      ]);
      setSearchResults({ books, users });
      setShowDropdown(true);
    } catch (err) {
      setSearchResults({ books: [], users: [] });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.length >= 2) {
      handleSearch(new Event('submit') as any);
    } else {
      setShowDropdown(false);
      setSearchResults({ books: [], users: [] });
    }
  };

  const handleResultClick = (type: string, id: number) => {
    setShowDropdown(false);
    setSearchQuery("");
    setSearchResults({ books: [], users: [] });
    if (type === "book") setLocation(`/books/${id}`);
    if (type === "user") setLocation(`/members/${id}`);
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
          <div className="relative">
            <form onSubmit={handleSearch} autoComplete="off">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                type="text"
                placeholder="Üye ara"
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
                className="w-80 pl-9 pr-3 py-2 rounded-lg bg-white border border-gray-200 focus:ring-2 focus:ring-blue-200 text-sm placeholder-gray-400"
              />
            </form>
            {showDropdown && (searchQuery.length >= 2) && (
              <div className="absolute z-50 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-96 overflow-auto">
                {searchLoading ? (
                  <div className="p-4 text-center text-gray-500 text-sm">Aranıyor...</div>
                ) : (
                  <>
                    {searchResults.users.length > 0 && (
                      <div>
                        <div className="px-6 pt-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Üyeler</div>
                        {searchResults.users.map((user: any) => (
                          <div
                            key={user.id}
                            className="flex items-center gap-4 px-6 py-3 cursor-pointer hover:bg-blue-50 transition-colors rounded-lg mb-1"
                            onClick={() => handleResultClick('user', user.id)}
                          >
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg uppercase shadow-sm">
                              {user.name?.[0] || '?'}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900 text-base">{user.name}</span>
                              <span className="text-xs text-gray-500">{user.email}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults.users.length === 0 && (
                      <div className="p-6 text-center text-gray-500 text-sm">Sonuç bulunamadı</div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          
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
