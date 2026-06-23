import { useState } from 'react';
import { useSignals } from '@/hooks/useSignals';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { SignalModal } from './SignalModal';
import { motion, AnimatePresence } from 'framer-motion';

const UrgencyBadge = ({ urgency }: { urgency: string }) => {
  switch (urgency) {
    case 'CRITICAL': return <Badge variant="destructive" className="bg-matrix-critical/20 text-matrix-critical border-matrix-critical animate-pulse-fast">CRITICAL</Badge>;
    case 'HIGH': return <Badge className="bg-matrix-high/20 text-matrix-high border-matrix-high">HIGH</Badge>;
    case 'MEDIUM': return <Badge className="bg-matrix-medium/20 text-matrix-medium border-matrix-medium">MEDIUM</Badge>;
    default: return <Badge className="bg-matrix-low/20 text-matrix-low border-matrix-low">LOW</Badge>;
  }
};

const MotionTableRow = motion(TableRow);

export const SignalList = () => {
  const { signals } = useSignals();
  const [selectedSignal, setSelectedSignal] = useState<any | null>(null);

  if (!signals || signals.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="text-center p-12 glass-panel rounded-md border-dashed border-matrix-border"
      >
        <span className="text-matrix-text opacity-70 font-mono tracking-widest uppercase">No anomalies detected. System Nominal.</span>
      </motion.div>
    );
  }

  return (
    <div className="glass-panel rounded-md overflow-hidden">
      <Table>
        <TableHeader className="border-b border-matrix-border bg-black/40">
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-matrix-primary font-mono uppercase tracking-wider">Agent</TableHead>
            <TableHead className="text-matrix-primary font-mono uppercase tracking-wider">Urgency</TableHead>
            <TableHead className="text-matrix-primary font-mono uppercase tracking-wider">Status</TableHead>
            <TableHead className="text-matrix-primary font-mono uppercase tracking-wider">Trigger</TableHead>
            <TableHead className="text-matrix-primary font-mono uppercase tracking-wider">Time</TableHead>
            <TableHead className="text-matrix-primary font-mono uppercase tracking-wider text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {signals.map((signal) => (
              <MotionTableRow 
                key={signal.id} 
                initial={{ opacity: 0, x: -20, backgroundColor: "rgba(0,255,65,0.2)" }}
                animate={{ opacity: 1, x: 0, backgroundColor: "transparent" }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="border-b border-matrix-border/50 hover:bg-matrix-border/20 transition-colors cursor-pointer group"
                onClick={() => setSelectedSignal(signal)}
              >
                <TableCell className="font-medium text-matrix-text font-mono group-hover:text-matrix-primary transition-colors">
                  {signal.agent?.name || signal.agentId}
                </TableCell>
                <TableCell>
                  <UrgencyBadge urgency={signal.urgency} />
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`border-matrix-primary font-mono ${signal.status === 'PENDING' ? 'text-matrix-primary bg-matrix-primary/10' : 'text-matrix-text opacity-50'}`}>
                    {signal.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-matrix-text font-mono text-sm opacity-80">
                  {signal.triggerType}
                </TableCell>
                <TableCell className="text-matrix-text opacity-60 text-sm font-mono">
                  {formatDistanceToNow(new Date(signal.receivedAt), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    size="sm" 
                    className={`font-mono transition-all duration-300 ${signal.status === 'PENDING' ? "matrix-btn-primary hover:scale-105" : "matrix-btn-outline opacity-50 group-hover:opacity-100"}`}
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
