import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, Activity, AlertTriangle, Users } from 'lucide-react';
import { SignalList } from '@/components/dashboard/SignalList';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const Dashboard = () => {
  const { token } = useAuthStore();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_URL}/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      }
    };
    fetchStats();
  }, [token]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-wider text-matrix-primary">SYSTEM STATUS</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-panel border-matrix-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-matrix-text">Total Signals</CardTitle>
            <Activity className="h-4 w-4 text-matrix-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-matrix-primary">{stats?.totalSignals || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="glass-panel border-matrix-medium/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-matrix-medium">Pending Review</CardTitle>
            <ShieldAlert className="h-4 w-4 text-matrix-medium" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-matrix-medium">{stats?.pendingSignals || 0}</div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-matrix-critical/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-matrix-critical">Timed Out</CardTitle>
            <AlertTriangle className="h-4 w-4 text-matrix-critical" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-matrix-critical">{stats?.timedOutSignals || 0}</div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-matrix-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-matrix-text">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-matrix-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-matrix-primary">{stats?.activeAgents || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-bold tracking-wider text-matrix-primary mb-4">ACTIVE ANOMALIES</h3>
        <SignalList />
      </div>
    </div>
  );
};
