import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Users,
  ChevronLeft,
  Shield,
  DollarSign,
  Activity,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const menuItems = [
  { title: "Vista General", url: "/admin", icon: LayoutDashboard },
  { title: "Financiero", url: "/admin/financial", icon: DollarSign },
  { title: "Actividad", url: "/admin/activity", icon: Activity },
  { title: "Usuarios", url: "/admin/users-dashboard", icon: UserCircle },
  { title: "Organizaciones", url: "/admin/organizations", icon: Building2 },
  { title: "Suscripciones", url: "/admin/subscriptions", icon: CreditCard },
  { title: "Lista Usuarios", url: "/admin/users", icon: Users },
];

interface AdminSidebarContentProps {
  onNavigate?: () => void;
}

export function AdminSidebarContent({ onNavigate }: AdminSidebarContentProps) {
  const location = useLocation();

  const isActive = (url: string) => {
    if (url === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(url);
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-600">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">Super Admin</h2>
            <p className="text-xs text-muted-foreground">Panel de Plataforma</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.url}
              to={item.url}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive(item.url)
                  ? "bg-purple-600 text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
          <Link to="/dashboard" onClick={onNavigate}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
