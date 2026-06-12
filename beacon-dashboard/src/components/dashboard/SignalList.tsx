import { useState } from 'react';
import { useSignals } from '@/hooks/useSignals';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { SignalModal } from './SignalModal';

const UrgencyBadge = ({ urgency }: { urgency: string }) => {
  switch (urgency) {
    case 'CRITICAL': return <Badge variant="destructive" className="bg-matrix-critical/20 text-matrix-critical border-matrix-critical animate-pulse-fast">CRITICAL</Badge>;
    case 'HIGH': return <Badge className="bg-matrix-high/20 text-matrix-high border-matrix-high">HIGH</Badge>;
    case 'MEDIUM': return <Badge className="bg-matrix-medium/20 text-matrix-medium border-matrix-medium">MEDIUM</Badge>;
    default: return <Badge className="bg-matrix-low/20 text-matrix-low border-matrix-low">LOW</Badge>;
  }
};

export const SignalList = () => {
  const { signals } = useSignals();
  const [selectedSignal, setSelectedSignal] = useState<any | null>(null);

  if (!signals || signals.length === 0) {
    return <div className="text-center p-8 text-matrix-text opacity-70">No anomalies detected.</div>;
  }

  return (
    <div className="glass-panel rounded-md">
      <Table>
        <TableHeader className="border-b border-matrix-border">
          <TableRow className="hover:bg-matrix-border/20">
            <TableHead className="text-matrix-primary">Agent</TableHead>
            <TableHead className="text-matrix-primary">Urgency</TableHead>
            <TableHead className="text-matrix-primary">Status</TableHead>
            <TableHead className="text-matrix-primary">Trigger</TableHead>
            <TableHead className="text-matrix-primary">Time</TableHead>
            <TableHead className="text-matrix-primary text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {signals.map((signal) => (
            <TableRow key={signal.id} className="border-b border-matrix-border/50 hover:bg-matrix-border/20">
              <TableCell className="font-medium text-matrix-text">
                {signal.agent?.name || signal.agentId}
              </TableCell>
              <TableCell>
                <UrgencyBadge urgency={signal.urgency} />
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="border-matrix-primary text-matrix-primary">
                  {signal.status}
                </Badge>
              </TableCell>
              <TableCell className="text-matrix-text">
                {signal.triggerType}
              </TableCell>
              <TableCell className="text-matrix-text opacity-80 text-sm">
                {formatDistanceToNow(new Date(signal.receivedAt), { addSuffix: true })}
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  size="sm" 
                  className={signal.status === 'PENDING' ? "matrix-btn-primary" : "matrix-btn-outline"}
                  onClick={() => setSelectedSignal(signal)}
                >
                  {signal.status === 'PENDING' ? 'REVIEW' : 'VIEW'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
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
