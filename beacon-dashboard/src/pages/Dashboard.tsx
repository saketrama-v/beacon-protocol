import { useEffect, useState } from 'react';
import { useSignals } from '@/hooks/useSignals';
import { SignalList } from '@/components/dashboard/SignalList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export const Dashboard = () => {
  useSignals(); // Initialize socket connection and fetch signals
  const { getToken } = useAuth();
  const [stats, setStats] = useState({
    totalSignals: 0,
    pendingSignals: 0,
    timedOutSignals: 0,
    activeAgents: 0,
    averageResolutionTimeMs: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await axios.get(`${API_URL}/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      }
    };
    fetchStats();
    
    // Refresh stats periodically
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [getToken]);

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div>
        <motion.h2 variants={itemVariants} className="text-3xl font-bold tracking-tight text-matrix-primary mb-2 font-mono uppercase">
          System Overview
        </motion.h2>
        <motion.p variants={itemVariants} className="text-matrix-text opacity-70 font-mono">
          Monitoring live agent anomalies and interventions.
        </motion.p>
      </div>

      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-panel border-matrix-border hover:border-matrix-primary hover:shadow-[0_0_15px_rgba(0,255,65,0.2)] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-matrix-text font-mono uppercase tracking-wider">Active Agents</CardTitle>
            <Activity className="h-4 w-4 text-matrix-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-matrix-primary font-mono">{stats.activeAgents}</div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-matrix-border hover:border-yellow-500 hover:shadow-[0_0_15px_rgba(234,179,8,0.2)] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-matrix-text font-mono uppercase tracking-wider">Pending Interventions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500 animate-pulse-fast" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500 font-mono">{stats.pendingSignals}</div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-matrix-border hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-matrix-text font-mono uppercase tracking-wider">Timed Out</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500 font-mono">{stats.timedOutSignals}</div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-matrix-border hover:border-matrix-primary hover:shadow-[0_0_15px_rgba(0,255,65,0.2)] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-matrix-text font-mono uppercase tracking-wider">Total Handled</CardTitle>
            <CheckCircle className="h-4 w-4 text-matrix-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-matrix-primary font-mono">{stats.totalSignals}</div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-matrix-primary font-mono uppercase tracking-wider">Active Anomalies</h3>
        </div>
        <SignalList />
      </motion.div>
    </motion.div>
  );
};
