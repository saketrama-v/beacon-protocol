import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { ShieldAlert, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AppLayout = () => {
  const { user, logout } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-matrix-bg">
      {/* Sidebar */}
      <aside className="w-64 border-r border-matrix-border bg-matrix-surface backdrop-blur-md flex flex-col">
        <div className="p-6 border-b border-matrix-border flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-matrix-primary" />
          <h1 className="text-xl font-bold text-matrix-primary tracking-widest">BEACON</h1>
        </div>
        
        <nav className="flex-1 p-4 flex flex-col gap-2">
          <Link to="/" className="flex items-center gap-3 p-3 rounded text-matrix-text hover:bg-matrix-border hover:text-matrix-primary transition-colors">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link to="/settings" className="flex items-center gap-3 p-3 rounded text-matrix-text hover:bg-matrix-border hover:text-matrix-primary transition-colors">
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-matrix-border">
          <div className="text-sm text-matrix-text mb-4 truncate">{user.email}</div>
          <Button 
            variant="outline" 
            className="w-full matrix-btn-outline flex items-center gap-2 justify-center"
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute inset-0 pointer-events-none bg-matrix-gradient opacity-20"></div>
        <div className="relative z-10 p-8 h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
