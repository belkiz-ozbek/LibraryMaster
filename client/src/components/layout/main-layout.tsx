import { ReactNode, useState, useMemo } from "react";
import ModernSidebar from "./sidebar";
import Header from "./header";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Menu } from "lucide-react";
import { useTranslation } from "react-i18next";

interface MainLayoutProps {
  children: ReactNode;
}

// Extracted Components
const MobileMenuButton = ({ onOpen }: { onOpen: () => void }) => (
  <button 
    className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow border border-gray-200 hover:bg-gray-50 transition-colors"
    onClick={onOpen}
    aria-label="Menüyü aç"
  >
    <Menu size={24} />
  </button>
);

const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="w-full py-2 text-center text-xs text-muted-foreground bg-background flex items-center justify-center gap-2">
      {t("footer.developedBy")}
      <img 
        src="/ahdevefa-logo.png" 
        alt={t("footer.ahdevefaLogo")}
        className="h-5 inline-block align-middle"
        loading="lazy"
      />
    </footer>
  );
};

export default function MainLayout({ children }: MainLayoutProps) {
  const [open, setOpen] = useState(false);
  
  // Memoized handlers
  const handleOpenChange = useMemo(() => (newOpen: boolean) => {
    setOpen(newOpen);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <ModernSidebar />
      </div>
      
      {/* Mobile Menu */}
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>
          <MobileMenuButton onOpen={() => setOpen(true)} />
        </DrawerTrigger>
        <DrawerContent className="p-0 max-w-xs">
          <ModernSidebar />
        </DrawerContent>
      </Drawer>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
}
