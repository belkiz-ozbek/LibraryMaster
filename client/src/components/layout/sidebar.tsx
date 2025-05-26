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
  LogOut 
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Books", href: "/books", icon: Book },
  { name: "Members", href: "/members", icon: Users },
  { name: "Borrowing", href: "/borrowing", icon: HandHeart },
  { name: "Returns", href: "/returns", icon: Undo2 },
];

const adminNavigation = [
  { name: "Evaluations", href: "/evaluations", icon: Star },
  { name: "Statistics", href: "/statistics", icon: BarChart3 },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

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
    <aside className="w-64 bg-white shadow-material flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Book className="text-white text-lg" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-on-surface">LibraryMS</h1>
            <p className="text-sm text-text-muted">Management System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={`w-full justify-start ${
                  isActive 
                    ? "bg-primary/10 text-primary hover:bg-primary/15" 
                    : "text-text-muted hover:bg-gray-50 hover:text-on-surface"
                }`}
              >
                <Icon size={18} className="mr-3" />
                {item.name}
              </Button>
            </Link>
          );
        })}

        {/* Admin Section */}
        {user?.isAdmin && (
          <div className="pt-6 mt-6 border-t border-gray-200">
            <p className="px-4 mb-3 text-xs font-medium text-text-muted uppercase tracking-wider">
              Admin
            </p>
            {adminNavigation.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${
                      isActive 
                        ? "bg-primary/10 text-primary hover:bg-primary/15" 
                        : "text-text-muted hover:bg-gray-50 hover:text-on-surface"
                    }`}
                  >
                    <Icon size={18} className="mr-3" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-white">
              {user ? getInitials(user.name) : "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-on-surface truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-text-muted">
              {user?.isAdmin ? "Administrator" : "Staff"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-text-muted hover:text-on-surface"
          >
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </aside>
  );
}
