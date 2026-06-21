import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Brain, 
  CheckSquare, 
  Bell, 
  Users, 
  FileText, 
  Cpu, 
  Settings as SettingsIcon,
  Activity
} from "lucide-react";
import { useGetSettings } from "@workspace/api-client-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: settings } = useGetSettings();
  
  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/chats", label: "Chats", icon: MessageSquare },
    { href: "/memory", label: "Memory", icon: Brain },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/reminders", label: "Reminders", icon: Bell },
    { href: "/team", label: "Team", icon: Users },
    { href: "/documents", label: "Documents", icon: FileText },
    { href: "/ai", label: "AI Providers", icon: Cpu },
    { href: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen w-full bg-background text-foreground dark">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Activity className="w-6 h-6" />
            <span className="font-bold tracking-wider uppercase text-sm">NEXUS</span>
          </div>
          {settings?.appMode === 'development' && (
            <span className="text-[10px] font-mono bg-primary/20 text-primary px-2 py-1 rounded">DEV MODE</span>
          )}
        </div>
        
        <nav className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/4 w-1/2 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        
        <main className="flex-1 overflow-y-auto p-8 relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
