import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Key, Copy, CheckCircle2, Shield, Server, Activity, Plus, Trash2 } from 'lucide-react';
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

  const handleDeleteAgent = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      await axios.delete(`${API_URL}/agents/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAgents(agents.filter(agent => agent.id !== id));
    } catch (err) {
      console.error('Failed to delete agent', err);
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
      <div className="relative">
        <motion.h2 variants={itemVariants} className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-matrix-text to-matrix-primary mb-2 font-space uppercase drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center gap-3">
          <Shield className="w-8 h-8 text-matrix-primary" />
          System Settings
        </motion.h2>
        <motion.p variants={itemVariants} className="text-matrix-text/70">
          Manage your autonomous agents, API keys, and secure connections.
        </motion.p>
      </div>

      <motion.div variants={itemVariants} className="grid gap-8">
        <Card className="glass-panel group border-matrix-border overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-matrix-primary to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-8">
            <div>
              <CardTitle className="text-xl font-medium text-matrix-text font-space uppercase tracking-widest flex items-center gap-3">
                <div className="p-2 bg-matrix-primary/10 rounded-lg">
                  <Key className="w-5 h-5 text-matrix-primary" />
                </div>
                Agent Connections
              </CardTitle>
              <CardDescription className="text-matrix-text/60 mt-2">
                Use these secure API keys to connect your Python or Node.js agents to your specific dashboard.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="matrix-btn-outline bg-black/40 backdrop-blur-md font-space uppercase tracking-wider">
                  <Plus className="w-4 h-4 mr-2" />
                  Provision Agent
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-matrix-bg/95 backdrop-blur-xl border border-matrix-primary/30 text-white font-space shadow-[0_0_50px_rgba(16,185,129,0.15)] rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-matrix-primary uppercase tracking-widest text-xl flex items-center gap-2">
                    <Server className="w-5 h-5" /> Provision New Agent
                  </DialogTitle>
                  <DialogDescription className="text-matrix-text/70">
                    Create a secure API key for a new autonomous agent.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-5 py-6">
                  {errorMsg && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                      {errorMsg}
                    </div>
                  )}
                  <div className="grid gap-2">
                    <label className="text-sm text-matrix-text uppercase tracking-wider">Agent Name</label>
                    <Input 
                      className="bg-black/50 border-matrix-border focus-visible:ring-matrix-primary focus-visible:border-matrix-primary text-white font-mono h-11" 
                      placeholder="e.g. FinanceBot-01" 
                      value={newAgentName}
                      onChange={(e) => setNewAgentName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm text-matrix-text uppercase tracking-wider">Framework</label>
                    <Input 
                      className="bg-black/50 border-matrix-border focus-visible:ring-matrix-primary focus-visible:border-matrix-primary text-white font-mono h-11" 
                      placeholder="e.g. mcp, langchain, crewai" 
                      value={newAgentFramework}
                      onChange={(e) => setNewAgentFramework(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-matrix-border/50 hover:bg-white/5 text-white/70">Cancel</Button>
                  <Button onClick={handleCreateAgent} className="matrix-btn-primary font-space uppercase tracking-widest">Generate API Key</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-4 pb-8">
            {agents.map((agent) => (
              <div key={agent.id} className="p-5 border border-matrix-border/30 rounded-xl bg-gradient-to-r from-matrix-primary/5 to-transparent hover:border-matrix-primary/50 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-black/60 border border-matrix-border/30 text-matrix-primary group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">
                    <Server className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold font-space text-lg tracking-wider group-hover:text-matrix-primary transition-colors">{agent.name}</h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="flex items-center gap-1.5 text-xs text-matrix-text/80 uppercase font-space tracking-wider border border-matrix-primary/20 px-2.5 py-1 rounded-full bg-matrix-primary/5">
                        <Activity className="w-3.5 h-3.5 text-matrix-primary" />
                        {agent.framework}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-black/80 p-2 pl-4 rounded-lg border border-matrix-border/30 w-full md:w-auto shadow-inner">
                  <code className="text-matrix-primary font-mono text-sm opacity-90 truncate max-w-[200px] md:max-w-[300px]">
                    {agent.apiKey}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="hover:bg-matrix-primary/20 hover:text-matrix-primary text-matrix-text transition-colors rounded-md h-8 w-8 p-0"
                    onClick={() => handleCopy(agent.apiKey)}
                  >
                    {copiedKey === agent.apiKey ? <CheckCircle2 className="w-4 h-4 text-matrix-primary" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="hover:bg-red-500/20 hover:text-red-500 text-matrix-text/50 hover:text-red-500 transition-colors rounded-md h-8 w-8 p-0"
                    onClick={() => handleDeleteAgent(agent.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {agents.length === 0 && (
              <div className="text-center p-12 border border-dashed border-matrix-border/30 rounded-xl bg-black/20">
                <div className="w-16 h-16 rounded-full bg-matrix-primary/5 border border-matrix-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Key className="w-8 h-8 text-matrix-text/30" />
                </div>
                <span className="text-matrix-text/50 font-space tracking-widest uppercase">No agents provisioned yet.</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
