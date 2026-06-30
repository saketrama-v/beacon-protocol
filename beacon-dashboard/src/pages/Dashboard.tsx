import { useEffect, useState } from 'react';
import { useSignals } from '@/hooks/useSignals';
import { SignalList } from '@/components/dashboard/SignalList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
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
      <div className="relative">
        <motion.h2 variants={itemVariants} className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-matrix-text to-matrix-primary mb-2 font-space uppercase drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
          System Overview
        </motion.h2>
        <motion.p variants={itemVariants} className="text-matrix-text/70">
          Monitoring live autonomous anomalies and global operator interventions.
        </motion.p>
      </div>

      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-panel group hover:border-matrix-primary hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all duration-500 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-matrix-text/80 font-space uppercase tracking-widest group-hover:text-matrix-primary transition-colors">Active Agents</CardTitle>
            <Activity className="h-5 w-5 text-matrix-primary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">{stats.activeAgents}</div>
          </CardContent>
        </Card>

        <Card className="glass-panel group hover:border-yellow-500 hover:shadow-[0_0_30px_rgba(234,179,8,0.15)] transition-all duration-500 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-matrix-text/80 font-space uppercase tracking-widest group-hover:text-yellow-500 transition-colors">Pending Interventions</CardTitle>
            <AlertTriangle className="h-5 w-5 text-yellow-500 animate-pulse-fast drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]">{stats.pendingSignals}</div>
          </CardContent>
        </Card>

        <Card className="glass-panel group hover:border-red-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.15)] transition-all duration-500 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-matrix-text/80 font-space uppercase tracking-widest group-hover:text-red-500 transition-colors">Timed Out</CardTitle>
            <Clock className="h-5 w-5 text-red-500 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">{stats.timedOutSignals}</div>
          </CardContent>
        </Card>

        <Card className="glass-panel group hover:border-matrix-primary hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all duration-500 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-matrix-text/80 font-space uppercase tracking-widest group-hover:text-matrix-primary transition-colors">Total Handled</CardTitle>
            <CheckCircle className="h-5 w-5 text-matrix-primary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">{stats.totalSignals}</div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="pt-6 relative">
        <div className="absolute top-0 left-0 w-32 h-[1px] bg-gradient-to-r from-matrix-primary to-transparent"></div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-matrix-text font-space uppercase tracking-widest flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-matrix-primary animate-ping"></span>
            Active Anomalies
          </h3>
        </div>
        <div className="relative z-10">
          <SignalList />
        </div>
      </motion.div>
    </motion.div>
  );
};
