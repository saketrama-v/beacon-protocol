import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldAlert } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      setAuth(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-matrix-bg flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-matrix-gradient opacity-20"></div>
      
      <Card className="w-full max-w-md glass-panel relative z-10 border-matrix-primary/50">
        <CardHeader className="space-y-1 flex flex-col items-center border-b border-matrix-border pb-6">
          <ShieldAlert className="w-12 h-12 text-matrix-primary mb-4 animate-pulse-fast" />
          <CardTitle className="text-2xl font-bold tracking-widest text-matrix-primary">BEACON</CardTitle>
          <p className="text-sm text-matrix-text opacity-70">Acknowledge. Decide. Resolve.</p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-matrix-critical/10 border border-matrix-critical text-matrix-critical rounded text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-matrix-primary">Email</label>
              <Input 
                type="email" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-black/50 border-matrix-border text-matrix-primary focus-visible:ring-matrix-primary"
                placeholder="admin@org.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-matrix-primary">Password</label>
              <Input 
                type="password" 
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-black/50 border-matrix-border text-matrix-primary focus-visible:ring-matrix-primary"
                placeholder="••••••••"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full matrix-btn-primary"
              disabled={loading}
            >
              {loading ? 'INITIALIZING...' : 'ENTER SYSTEM'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
