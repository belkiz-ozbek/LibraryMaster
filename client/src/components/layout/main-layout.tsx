import { ReactNode, useState } from "react";
import ModernSidebar from "./sidebar";
import Header from "./header";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Menu } from "lucide-react";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - sadece büyük ekranda */}
      <div className="hidden lg:block">
        <ModernSidebar />
      </div>
      {/* Mobilde açılır menü */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <button className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow border border-gray-200">
            <Menu size={24} />
          </button>
        </DrawerTrigger>
        <DrawerContent className="p-0 max-w-xs">
          <ModernSidebar />
        </DrawerContent>
      </Drawer>
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
        <footer className="w-full py-2 text-center text-xs text-muted-foreground bg-background flex items-center justify-center gap-2">
          Bu sistem, Ahdevefa Sosyal Yardımlaşma Kulübü yazılım geliştirici ekibi tarafından geliştirilmiştir.
          <img src="/src/assets/ahdevefa-logo.png" alt="Ahdevefa Logo" className="h-5 inline-block align-middle" />
        </footer>
      </main>
    </div>
  );
}
