import { useState, useRef, useMemo, useCallback } from "react";
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

// Types
interface SearchResult {
  id: number;
  name: string;
  email?: string;
}

interface SearchResults {
  books: SearchResult[];
  users: SearchResult[];
}

interface PageInfo {
  title: string;
  description: string;
}

// Extracted Components
const SearchBox = ({ 
  searchQuery, 
  onSearch, 
  onInputChange, 
  searchLoading, 
  showDropdown, 
  searchResults, 
  onResultClick 
}: {
  searchQuery: string;
  onSearch: (e: React.FormEvent) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  searchLoading: boolean;
  showDropdown: boolean;
  searchResults: SearchResults;
  onResultClick: (type: string, id: number) => void;
}) => (
  <div className="relative">
    <form onSubmit={onSearch} autoComplete="off">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
      <Input
        type="text"
        placeholder="Üye ara"
        value={searchQuery}
        onChange={onInputChange}
        onFocus={() => searchQuery.length >= 2 && onResultClick('', 0)}
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
                {searchResults.users.map((user: SearchResult) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 px-6 py-3 cursor-pointer hover:bg-blue-50 transition-colors rounded-lg mb-1"
                    onClick={() => onResultClick('user', user.id)}
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
);

const LanguageSelector = ({ 
  i18n, 
  changeLanguage 
}: { 
  i18n: any; 
  changeLanguage: (lng: string) => void; 
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-50 transition-colors">
        <Globe className="h-5 w-5 text-gray-400" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="min-w-[140px] rounded-xl shadow p-1">
      <DropdownMenuItem 
        onClick={() => changeLanguage('tr')} 
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${i18n.language === 'tr' ? 'bg-blue-50 font-semibold' : ''}`}
      >
        <span className="text-lg">🇹🇷</span>
        <span>Turkish</span>
      </DropdownMenuItem>
      <DropdownMenuItem 
        onClick={() => changeLanguage('en')} 
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${i18n.language === 'en' ? 'bg-blue-50 font-semibold' : ''}`}
      >
        <span className="text-lg">🇺🇸</span>
        <span>English</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export default function Header() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults>({ books: [], users: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { logout } = useAuth();
  const { t, i18n } = useTranslation();

  // Memoized page information
  const pageInfo = useMemo((): Record<string, PageInfo> => ({
    "/": { title: t("navigation.dashboard"), description: t("header.overview") },
    "/dashboard": { title: t("navigation.dashboard"), description: t("header.overview") },
    "/books": { title: t("books.title"), description: t("header.books") },
    "/members": { title: t("members.title"), description: t("header.members") },
    "/borrowing": { title: t("borrowing.title"), description: t("header.borrowing") },
    "/returns": { title: t("borrowing.returnBook"), description: t("header.returns") },
    "/evaluations": { title: t("navigation.evaluations"), description: t("header.evaluations") },
    "/statistics": { title: t("navigation.statistics"), description: t("header.statistics") },
  }), [t]);

  // Memoized current page info
  const currentPageInfo = useMemo((): PageInfo => {
    if (location.startsWith("/members/")) {
      return { title: t("members.details.title"), description: t("members.details.subtitle") };
    }
    if (location.startsWith("/activities")) {
      return { 
        title: "Aktivite Akışı", 
        description: "Kütüphane sistemindeki tüm aktiviteleri takip edin" 
      };
    }
    return pageInfo[location] || { title: t("header.pageNotFound"), description: "" };
  }, [location, pageInfo, t]);

  // Memoized callback functions
  const handleSearch = useCallback(async (e: React.FormEvent) => {
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
  }, [searchQuery]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.length >= 2) {
      handleSearch(new Event('submit') as any);
    } else {
      setShowDropdown(false);
      setSearchResults({ books: [], users: [] });
    }
  }, [handleSearch]);

  const handleResultClick = useCallback((type: string, id: number) => {
    setShowDropdown(false);
    setSearchQuery("");
    setSearchResults({ books: [], users: [] });
    if (type === "book") setLocation(`/books/${id}`);
    if (type === "user") setLocation(`/members/${id}`);
  }, [setLocation]);

  const changeLanguage = useCallback((lng: string) => {
    i18n.changeLanguage(lng);
  }, [i18n]);

  return (
    <header className="bg-white border-b border-gray-100 px-8 py-5 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            {currentPageInfo.title}
          </h1>
          {currentPageInfo.description && (
            <p className="text-xs text-gray-400 font-normal mt-0.5">
              {currentPageInfo.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-6">
          <SearchBox 
            searchQuery={searchQuery}
            onSearch={handleSearch}
            onInputChange={handleInputChange}
            searchLoading={searchLoading}
            showDropdown={showDropdown}
            searchResults={searchResults}
            onResultClick={handleResultClick}
          />
          
          <LanguageSelector i18n={i18n} changeLanguage={changeLanguage} />

          <Button 
            variant="ghost" 
            onClick={logout} 
            className="rounded-full px-3 py-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors font-normal flex items-center gap-2 text-sm"
          >
            {t('auth.logout')}
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </header>
  );
}
