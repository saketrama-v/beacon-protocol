import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSignals } from '@/hooks/useSignals';

export const SignalModal = ({ signal, isOpen, onClose }: { signal: any, isOpen: boolean, onClose: () => void }) => {
  const { resolveSignal } = useSignals();
  const [loading, setLoading] = useState(false);
  const [resolutionText, setResolutionText] = useState('');

  const decisionNeeded = signal.decisionNeeded || {};

  const handleResolve = async (optionId: string) => {
    setLoading(true);
    try {
      await resolveSignal(signal.id, optionId, resolutionText || 'Resolved via Dashboard');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-panel text-matrix-text border-matrix-border sm:max-w-2xl bg-matrix-bg">
        <DialogHeader>
          <DialogTitle className="text-2xl text-matrix-primary tracking-widest">INTERVENTION REQUIRED</DialogTitle>
          <DialogDescription className="text-matrix-medium">
            Agent {signal.agent?.name || signal.agentId} is blocked and requires human decision.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-4">
          {/* Context Snippet */}
          <div className="p-4 border border-matrix-border/50 rounded bg-black/50">
            <h4 className="text-matrix-primary mb-2 text-sm font-bold">Context Snapshot</h4>
            <p className="text-sm opacity-80 mb-2"><span className="text-matrix-primary">Task:</span> {signal.contextSnapshot?.task_description}</p>
            <p className="text-sm opacity-80"><span className="text-matrix-primary">Current State:</span> {signal.contextSnapshot?.current_state}</p>
          </div>

          {/* Question */}
          <div className="p-4 border border-matrix-primary/50 rounded bg-matrix-primary/5">
            <h4 className="text-matrix-primary mb-2 text-lg font-bold">{decisionNeeded.question}</h4>
            <div className="grid grid-cols-1 gap-3 mt-4">
              {decisionNeeded.options?.map((opt: any) => (
                <div key={opt.option_id} className="flex flex-col gap-2 p-3 border border-matrix-border/30 rounded hover:border-matrix-primary/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-matrix-text">{opt.label}</span>
                    <Button 
                      onClick={() => handleResolve(opt.option_id)}
                      disabled={loading || signal.status !== 'PENDING'}
                      className="matrix-btn-primary h-8"
                    >
                      EXECUTE
                    </Button>
                  </div>
                  <span className="text-xs text-matrix-text opacity-60">Consequence: {opt.consequence}</span>
                </div>
              ))}
            </div>
          </div>

          {signal.status !== 'PENDING' && (
            <div className="p-3 bg-matrix-border/20 text-center rounded border border-matrix-primary text-matrix-primary">
              This signal is already {signal.status}.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
