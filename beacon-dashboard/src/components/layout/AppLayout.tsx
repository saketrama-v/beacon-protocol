import { Link, useLocation } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';
import { ShieldAlert, LayoutDashboard, Settings, Activity } from 'lucide-react';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-matrix-bg">
      {/* Sidebar */}
      <aside className="w-72 border-r border-matrix-border bg-black/60 backdrop-blur-xl flex flex-col relative z-20 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
        <div className="p-8 border-b border-matrix-border flex items-center gap-4">
          <div className="relative">
            <ShieldAlert className="w-10 h-10 text-matrix-primary relative z-10" />
            <div className="absolute inset-0 bg-matrix-primary blur-lg opacity-30 animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-matrix-primary tracking-widest font-mono uppercase shadow-matrix-primary">BEACON</h1>
            <p className="text-xs text-matrix-text opacity-50 font-mono tracking-widest">v1.0.0-beta</p>
          </div>
        </div>
        
        <nav className="flex-1 p-6 flex flex-col gap-3 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className="relative group">
                {isActive && (
                  <motion.div 
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-matrix-primary/10 border border-matrix-primary/50 rounded-lg shadow-[inset_0_0_15px_rgba(0,255,65,0.1)]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className={`relative flex items-center gap-4 p-4 rounded-lg font-mono tracking-wide transition-colors ${
                  isActive ? "text-matrix-primary" : "text-matrix-text hover:text-matrix-primary"
                }`}>
                  <item.icon className={`w-5 h-5 ${isActive ? "drop-shadow-[0_0_8px_rgba(0,255,65,0.8)]" : "opacity-70 group-hover:opacity-100"}`} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Status Indicator */}
        <div className="mx-6 p-4 mb-6 rounded-lg border border-matrix-border/50 bg-matrix-surface/30 flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-matrix-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-matrix-primary drop-shadow-[0_0_5px_rgba(0,255,65,1)]"></span>
          </div>
          <span className="text-xs text-matrix-primary font-mono uppercase tracking-widest">System Online</span>
        </div>

        <div className="p-6 border-t border-matrix-border flex items-center gap-4 bg-black/40">
          <div className="relative z-50">
            <UserButton appearance={{
              elements: {
                userButtonAvatarBox: "w-10 h-10 border border-matrix-primary shadow-[0_0_10px_rgba(0,255,65,0.2)]",
                userButtonPopoverCard: "bg-matrix-surface border border-matrix-border",
                userButtonPopoverActionButtonText: "text-matrix-text font-mono",
                userButtonPopoverActionButtonIcon: "text-matrix-primary",
                userButtonPopoverFooter: "hidden"
              }
            }} />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-matrix-primary font-mono truncate tracking-wider">{user?.firstName || 'Operator'}</span>
            <span className="text-xs text-matrix-text opacity-70 font-mono truncate">{user?.primaryEmailAddress?.emailAddress}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-matrix-bg">
        <div className="absolute inset-0 pointer-events-none bg-matrix-gradient opacity-20 z-0"></div>
        <div className="relative z-10 p-8 h-full">
          {children}
        </div>
      </main>
    </div>
  );
};
