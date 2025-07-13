import { useState, useRef, useMemo, useCallback, useEffect } from "react";
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
import { apiRequest } from "@/lib/queryClient";

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
  onResultClick,
  setShowDropdown
}: {
  searchQuery: string;
  onSearch: (e: React.FormEvent) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  searchLoading: boolean;
  showDropdown: boolean;
  searchResults: SearchResults;
  onResultClick: (type: string, id: number) => void;
  setShowDropdown: (show: boolean) => void;
}) => {
  const { t } = useTranslation();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, setShowDropdown]);

  return (
    <div className="relative" ref={searchRef}>
      <form onSubmit={onSearch} autoComplete="off">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        <Input
          type="text"
          placeholder={t("header.searchMember")}
          value={searchQuery}
          onChange={onInputChange}
          onFocus={() => searchQuery.length >= 1 && setShowDropdown(true)}
          className="w-60 sm:w-80 pl-9 pr-3 py-2 rounded-lg bg-white border border-gray-200 focus:ring-2 focus:ring-blue-200 text-sm placeholder-gray-400"
        />
      </form>
      {showDropdown && (searchQuery.length >= 1) && (
        <div className="absolute z-50 mt-2 w-full bg-white/80 backdrop-blur-md border border-gray-200 shadow-lg shadow-blue-100/40 border-t-2 border-blue-100 rounded-2xl max-h-96 overflow-auto transition-all">
          {searchLoading ? (
            <div className="p-4 text-center text-gray-500 text-sm">Aranıyor...</div>
          ) : (
            <>
              {searchResults.users.length > 0 && (
                <div>
                  <div className="px-6 pt-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Üyeler</div>
                  <div className="h-px bg-blue-50 mx-4 my-2 rounded" />
                  {searchResults.users.map((user: SearchResult, idx: number) => (
                    <>
                      <div
                        key={user.id}
                        className="flex items-center gap-3 px-5 py-2.5 cursor-pointer bg-transparent border border-transparent hover:bg-blue-50/60 hover:text-blue-700 hover:scale-[1.03] hover:shadow-md transition-all duration-150 rounded-xl"
                        onClick={() => onResultClick('user', user.id)}
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-200 to-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                          {user.name?.[0] || '?'}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-normal text-gray-800 text-base truncate group-hover:text-blue-700">{user.name}</span>
                          <span className="text-xs text-gray-400 truncate group-hover:text-blue-500">{user.email}</span>
                        </div>
                      </div>
                      {idx < searchResults.users.length - 1 && (
                        <div className="h-px bg-blue-50 mx-8 my-1 rounded" />
                      )}
                    </>
                  ))}
                </div>
              )}
              {searchResults.users.length === 0 && searchQuery.length >= 1 && (
                <div className="p-8 text-center text-gray-400 text-base font-medium">Sonuç bulunamadı</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

const LanguageSelector = ({ 
  i18n, 
  changeLanguage 
}: { 
  i18n: any; 
  changeLanguage: (lng: string) => void; 
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button 
        variant="ghost" 
        size="default"
        className="h-10 px-3 py-2 bg-transparent border-0 hover:bg-transparent shadow-none hover:shadow-none transition-all duration-300"
      >
        <div className="flex items-center space-x-1">
          <Globe className="h-4 w-4 text-blue-600" />
          <span className="text-xs font-semibold text-blue-600 uppercase">
            {i18n.language}
          </span>
        </div>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-36 p-1 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
      <DropdownMenuItem 
        onClick={() => changeLanguage('tr')} 
        className={`cursor-pointer p-2 rounded-md transition-all duration-200 ${
          i18n.language === 'tr' 
            ? 'bg-blue-100 text-blue-700' 
            : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center space-x-2 w-full">
          <span className="text-lg">🇹🇷</span>
          <span className="text-sm font-medium">Türkçe</span>
          {i18n.language === 'tr' && (
            <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
          )}
        </div>
      </DropdownMenuItem>
      <DropdownMenuItem 
        onClick={() => changeLanguage('en')} 
        className={`cursor-pointer p-2 rounded-md transition-all duration-200 ${
          i18n.language === 'en' 
            ? 'bg-blue-100 text-blue-700' 
            : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center space-x-2 w-full">
          <span className="text-lg">🇺🇸</span>
          <span className="text-sm font-medium">English</span>
          {i18n.language === 'en' && (
            <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
          )}
        </div>
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
        title: t("activities.title"), 
        description: t("activities.description") 
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
      console.log('Searching for:', searchQuery);
      const [booksRes, usersRes] = await Promise.all([
        apiRequest("GET", `/api/books/search?q=${encodeURIComponent(searchQuery)}`),
        apiRequest("GET", `/api/users/search?q=${encodeURIComponent(searchQuery)}`),
      ]);
      
      console.log('Books response status:', booksRes.status);
      console.log('Users response status:', usersRes.status);
      
      if (!booksRes.ok || !usersRes.ok) {
        throw new Error('Search request failed');
      }
      
      const [books, users] = await Promise.all([
        booksRes.json(),
        usersRes.json(),
      ]);
      
      console.log('Search results:', { books, users });
      setSearchResults({ books: books.data ?? books, users: users.data ?? users });
      setShowDropdown(true);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults({ books: [], users: [] });
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (searchQuery.length < 1) {
      setShowDropdown(false);
      setSearchResults({ books: [], users: [] });
      return;
    }
    setSearchLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const [booksRes, usersRes] = await Promise.all([
          apiRequest("GET", `/api/books/search?q=${encodeURIComponent(searchQuery)}`),
          apiRequest("GET", `/api/users/search?q=${encodeURIComponent(searchQuery)}`),
        ]);
        if (!booksRes.ok || !usersRes.ok) throw new Error('Search request failed');
        const [books, users] = await Promise.all([
          booksRes.json(),
          usersRes.json(),
        ]);
        setSearchResults({ books: books.data ?? books, users: users.data ?? users });
        setShowDropdown(true);
      } catch (err) {
        setSearchResults({ books: [], users: [] });
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleResultClick = useCallback((type: string, id: number) => {
    setShowDropdown(false);
    setSearchQuery("");
    setSearchResults({ books: [], users: [] });
    if (type === "book") setLocation(`/books/${id}`);
    if (type === "user") setLocation(`/members/${id}`);
  }, [setLocation]);

  const changeLanguage = useCallback((lng: string) => {
    i18n.changeLanguage(lng);
    // Save language preference to localStorage
    localStorage.setItem("preferredLanguage", lng);
  }, [i18n]);

  return (
    <header className="bg-white border-b border-gray-100 px-4 sm:px-8 py-3 sm:py-5 transition-all duration-300">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight truncate">
            {currentPageInfo.title}
          </h1>
          {currentPageInfo.description && (
            <p className="text-xs text-gray-400 font-normal mt-0.5 truncate">
              {currentPageInfo.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-6 flex-shrink-0">
          <SearchBox 
            searchQuery={searchQuery}
            onSearch={handleSearch}
            onInputChange={handleInputChange}
            searchLoading={searchLoading}
            showDropdown={showDropdown}
            searchResults={searchResults}
            onResultClick={handleResultClick}
            setShowDropdown={setShowDropdown}
          />
          
          <LanguageSelector i18n={i18n} changeLanguage={changeLanguage} />

          <Button 
            variant="ghost" 
            onClick={logout} 
            className="rounded-full px-2 sm:px-3 py-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors font-normal flex items-center gap-1 sm:gap-2 text-sm"
          >
            <span className="hidden sm:inline">{t('auth.logout')}</span>
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </header>
  );
}
