import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import logo from "../../../assets/logo.png";
import {
  BarChart3,
  Tv,
  PlayCircle,
  Users,
  Settings,
  User
} from "lucide-react";


const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "TV Management", href: "/tvs", icon: Tv },
  { name: "Content Management", href: "/content", icon: PlayCircle },
  { name: "User Management", href: "/users", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border sidebar-transition">
        <div className="flex flex-col h-full">
          {/* Logo at the very top left */}
          <div className=" flex-col items-center  px-6 py-5 border-b border-sidebar-border">
            <img
                src={logo}
                alt="Logo"
                className="h-100 w-auto object-contain bg-white rounded-lg"
                style={{ maxWidth: "150px", maxHeight: "150px" }}
            />
            <span className="ml-2 text-xl font-bold text-sidebar-foreground">Mécaprotec Aéro</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;

              return (
                  <Link key={item.name} href={item.href}>
                    <div
                        className={cn(
                            "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                            isActive
                                ? "text-sidebar-primary-foreground bg-sidebar-primary"
                                : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
                        )}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.name}
                    </div>
                  </Link>
              );
            })}
          </nav>

          {/* User Profile at the bottom */}
          <div className="px-4 py-4 border-t border-sidebar-border mt-auto">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-sidebar-foreground">
                  {user ? `${user.firstName} ${user.lastName}` : "Guest"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.email || "guest@example.com"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}