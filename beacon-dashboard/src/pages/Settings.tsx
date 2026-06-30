import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Key, Copy, CheckCircle2, Shield, Server, Activity, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

export const Settings = () => {
  const { getToken } = useAuth();
  const [agents, setAgents] = useState<any[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentFramework, setNewAgentFramework] = useState('custom');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreateAgent = async () => {
    try {
      setErrorMsg(null);
      const token = await getToken();
      if (!token) {
        setErrorMsg('Authentication token missing. Please sign in again.');
        return;
      }
      const res = await axios.post(`${API_URL}/agents`, {
        name: newAgentName,
        framework: newAgentFramework
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAgents([res.data, ...agents]);
      setIsDialogOpen(false);
      setNewAgentName('');
    } catch (err: any) {
      console.error('Failed to create agent', err);
      setErrorMsg(err.response?.data?.error || err.message || 'An unknown error occurred');
    }
  };

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await axios.get(`${API_URL}/agents`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAgents(res.data);
      } catch (err) {
        console.error('Failed to fetch agents', err);
      }
    };
    fetchAgents();
  }, [getToken]);

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <motion.div 
      className="space-y-8 max-w-5xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div>
        <motion.h2 variants={itemVariants} className="text-3xl font-bold tracking-tight text-matrix-primary mb-2 font-mono uppercase flex items-center gap-3">
          <Shield className="w-8 h-8" />
          System Settings
        </motion.h2>
        <motion.p variants={itemVariants} className="text-matrix-text opacity-70 font-mono">
          Manage your autonomous agents, API keys, and secure connections.
        </motion.p>
      </div>

      <motion.div variants={itemVariants} className="grid gap-8">
        <Card className="glass-panel border-matrix-border bg-black/40 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-matrix-gradient opacity-50"></div>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-medium text-matrix-text font-mono uppercase tracking-wider flex items-center gap-2">
                <Key className="w-5 h-5 text-matrix-primary" />
                Agent Connections
              </CardTitle>
              <CardDescription className="text-matrix-text opacity-60 font-mono">
                Use these secure API keys to connect your Python or Node.js agents to your specific dashboard.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-matrix-primary/50 text-matrix-primary hover:bg-matrix-primary/10">
                  <Plus className="w-4 h-4 mr-2" />
                  Provision Agent
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black border border-matrix-primary/50 text-matrix-text font-mono">
                <DialogHeader>
                  <DialogTitle className="text-matrix-primary uppercase">Provision New Agent</DialogTitle>
                  <DialogDescription className="opacity-70">
                    Create a secure API key for a new agent.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {errorMsg && (
                    <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm font-mono">
                      {errorMsg}
                    </div>
                  )}
                  <div className="grid gap-2">
                    <label className="text-sm">Agent Name</label>
                    <Input 
                      className="bg-black/50 border-matrix-border focus-visible:ring-matrix-primary text-matrix-text" 
                      placeholder="e.g. FinanceBot-01" 
                      value={newAgentName}
                      onChange={(e) => setNewAgentName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm">Framework</label>
                    <Input 
                      className="bg-black/50 border-matrix-border focus-visible:ring-matrix-primary text-matrix-text" 
                      placeholder="e.g. mcp, langchain, crewai" 
                      value={newAgentFramework}
                      onChange={(e) => setNewAgentFramework(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-matrix-border hover:bg-white/10 text-white">Cancel</Button>
                  <Button onClick={handleCreateAgent} className="bg-matrix-primary text-black hover:bg-matrix-primary/80">Generate API Key</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-4">
            {agents.map((agent) => (
              <div key={agent.id} className="p-4 border border-matrix-border/50 rounded-lg bg-matrix-surface/30 hover:border-matrix-primary/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-matrix-primary/10 text-matrix-primary group-hover:scale-110 transition-transform">
                    <Server className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-matrix-primary font-bold font-mono tracking-wider">{agent.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-xs text-matrix-text opacity-70 font-mono border border-matrix-border/50 px-2 py-0.5 rounded-full bg-black/50">
                        <Activity className="w-3 h-3 text-matrix-primary" />
                        {agent.framework}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-black/60 p-2 pl-4 rounded-md border border-matrix-border/30 w-full md:w-auto">
                  <code className="text-matrix-text font-mono text-sm opacity-90 truncate max-w-[200px] md:max-w-[300px]">
                    {agent.apiKey}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="hover:bg-matrix-primary/20 hover:text-matrix-primary text-matrix-text transition-colors"
                    onClick={() => handleCopy(agent.apiKey)}
                  >
                    {copiedKey === agent.apiKey ? <CheckCircle2 className="w-4 h-4 text-matrix-primary" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            ))}

            {agents.length === 0 && (
              <div className="text-center p-8 border border-dashed border-matrix-border/50 rounded-lg">
                <span className="text-matrix-text opacity-60 font-mono tracking-widest uppercase">No agents provisioned.</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
