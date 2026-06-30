import { useState } from 'react';
import { useSignals } from '@/hooks/useSignals';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { SignalModal } from './SignalModal';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';

const UrgencyBadge = ({ urgency }: { urgency: string }) => {
  switch (urgency) {
    case 'CRITICAL': return <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/50 animate-pulse-fast font-space tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.2)]">CRITICAL</Badge>;
    case 'HIGH': return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/50 font-space tracking-widest">HIGH</Badge>;
    case 'MEDIUM': return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/50 font-space tracking-widest">MEDIUM</Badge>;
    default: return <Badge className="bg-cyan-500/10 text-cyan-500 border-cyan-500/50 font-space tracking-widest">LOW</Badge>;
  }
};

const MotionTableRow = motion(TableRow);

export const SignalList = () => {
  const { signals } = useSignals();
  const [selectedSignal, setSelectedSignal] = useState<any | null>(null);

  if (!signals || signals.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="flex flex-col items-center justify-center p-16 glass-panel rounded-xl border-dashed border-matrix-primary/20 bg-gradient-to-b from-transparent to-matrix-primary/5 shadow-inner"
      >
        <div className="w-16 h-16 rounded-full bg-matrix-primary/10 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-matrix-primary/50" />
        </div>
        <span className="text-matrix-primary/70 font-space tracking-[0.2em] uppercase text-lg">No anomalies detected. System Nominal.</span>
      </motion.div>
    );
  }

  return (
    <div className="glass-panel rounded-xl overflow-hidden shadow-2xl border border-matrix-border/30">
      <Table>
        <TableHeader className="border-b border-matrix-border/30 bg-black/60 backdrop-blur-md">
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-matrix-primary/70 font-space uppercase tracking-widest">Agent</TableHead>
            <TableHead className="text-matrix-primary/70 font-space uppercase tracking-widest">Urgency</TableHead>
            <TableHead className="text-matrix-primary/70 font-space uppercase tracking-widest">Status</TableHead>
            <TableHead className="text-matrix-primary/70 font-space uppercase tracking-widest">Trigger</TableHead>
            <TableHead className="text-matrix-primary/70 font-space uppercase tracking-widest">Time</TableHead>
            <TableHead className="text-matrix-primary/70 font-space uppercase tracking-widest text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {signals.map((signal) => (
              <MotionTableRow 
                key={signal.id} 
                initial={{ opacity: 0, x: -20, backgroundColor: "rgba(16,185,129,0.1)" }}
                animate={{ opacity: 1, x: 0, backgroundColor: "transparent" }}
                exit={{ opacity: 0, scale: 0.98, backgroundColor: "rgba(239,68,68,0.1)" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="border-b border-matrix-border/20 hover:bg-matrix-primary/5 transition-colors cursor-pointer group"
                onClick={() => setSelectedSignal(signal)}
              >
                <TableCell className="font-bold text-white font-space tracking-wider group-hover:text-matrix-primary transition-colors">
                  {signal.agent?.name || signal.agentId}
                </TableCell>
                <TableCell>
                  <UrgencyBadge urgency={signal.urgency} />
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`font-space tracking-widest border-matrix-primary/30 ${signal.status === 'PENDING' ? 'text-matrix-primary bg-matrix-primary/10 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'text-matrix-text/40'}`}>
                    {signal.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-matrix-text/90 font-mono text-sm">
                  <span className="bg-black/50 px-2 py-1 rounded border border-matrix-border/20">{signal.triggerType}</span>
                </TableCell>
                <TableCell className="text-matrix-text/60 text-sm font-mono">
                  {formatDistanceToNow(new Date(signal.receivedAt), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    size="sm" 
                    className={`font-space tracking-widest uppercase transition-all duration-300 ${signal.status === 'PENDING' ? "matrix-btn-primary hover:scale-105 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "bg-transparent border border-matrix-primary/20 text-matrix-primary/50 hover:bg-matrix-primary/10 hover:text-matrix-primary group-hover:border-matrix-primary/50"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSignal(signal);
                    }}
                  >
                    {signal.status === 'PENDING' ? 'REVIEW' : 'VIEW'}
                  </Button>
                </TableCell>
              </MotionTableRow>
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>
      
      {selectedSignal && (
        <SignalModal 
          signal={selectedSignal} 
          isOpen={!!selectedSignal} 
          onClose={() => setSelectedSignal(null)} 
        />
      )}
    </div>
  );
};
