import { useState } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Bell } from "lucide-react";

const pageTitle = {
  "/": "Dashboard",
  "/dashboard": "Dashboard", 
  "/books": "Book Management",
  "/members": "Member Management",
  "/borrowing": "Borrowing System",
  "/returns": "Return Processing",
  "/evaluations": "Member Evaluations",
  "/statistics": "Statistics & Reports",
};

const pageDescription = {
  "/": "Library overview and quick actions",
  "/dashboard": "Library overview and quick actions",
  "/books": "Manage your book catalog",
  "/members": "Manage library members",
  "/borrowing": "Process book borrowings",
  "/returns": "Process book returns",
  "/evaluations": "Rate and evaluate members",
  "/statistics": "View reports and analytics",
};

export default function Header() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const currentTitle = pageTitle[location as keyof typeof pageTitle] || "Page Not Found";
  const currentDescription = pageDescription[location as keyof typeof pageDescription] || "";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement global search functionality
    console.log("Searching for:", searchQuery);
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
              placeholder="Search books, members..."
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
        </div>
      </div>
    </header>
  );
}
