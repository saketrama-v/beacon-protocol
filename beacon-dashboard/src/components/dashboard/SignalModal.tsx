import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useSignals } from '@/hooks/useSignals';
import { motion, AnimatePresence } from 'framer-motion';

export const SignalModal = ({ signal, isOpen, onClose }: { signal: any, isOpen: boolean, onClose: () => void }) => {
  const { resolveSignal } = useSignals();
  const [loading, setLoading] = useState(false);
  const resolutionText = '';

  const decisionNeeded = signal.decisionNeeded || {};

  const handleResolve = async (optionId: string) => {
    setLoading(true);
    try {
      await resolveSignal(signal.id, optionId, resolutionText || 'Resolved via Dashboard');
      onClose();
    } catch (err: any) {
      console.error(err);
      alert('Error: ' + (err?.response?.data?.error || err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-panel text-matrix-text border-matrix-border sm:max-w-2xl bg-matrix-bg p-0 overflow-hidden">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0, filter: "blur(10px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              exit={{ scale: 0.9, opacity: 0, filter: "blur(10px)" }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="p-6"
            >
              <DialogHeader>
                <DialogTitle className="text-2xl text-matrix-primary tracking-widest font-mono uppercase">INTERVENTION REQUIRED</DialogTitle>
                <DialogDescription className="text-matrix-medium font-mono">
                  Agent {signal.agent?.name || signal.agentId} is blocked and requires human decision.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 my-4">
                {/* Context Snippet */}
                <div className="p-4 border border-matrix-border/50 rounded bg-black/50 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-matrix-primary opacity-50"></div>
                  <h4 className="text-matrix-primary mb-2 text-sm font-bold font-mono uppercase tracking-widest">Context Snapshot</h4>
                  <p className="text-sm opacity-80 mb-2 font-mono"><span className="text-matrix-primary">Task:</span> {signal.contextSnapshot?.task_description}</p>
                  <p className="text-sm opacity-80 font-mono"><span className="text-matrix-primary">Current State:</span> {signal.contextSnapshot?.current_state}</p>
                </div>

                {/* Question */}
                <div className="p-4 border border-matrix-primary/50 rounded bg-matrix-primary/5 shadow-[inset_0_0_20px_rgba(0,255,65,0.05)]">
                  <h4 className="text-matrix-primary mb-2 text-lg font-bold font-mono">{decisionNeeded.question}</h4>
                  <div className="grid grid-cols-1 gap-3 mt-4">
                    {decisionNeeded.options?.map((opt: any) => (
                      <div key={opt.option_id} className="flex flex-col gap-2 p-3 border border-matrix-border/30 rounded hover:border-matrix-primary/50 transition-colors bg-black/30">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-matrix-text font-mono tracking-wide">{opt.label}</span>
                          <motion.button 
                            whileHover={signal.status === 'PENDING' && !loading ? { scale: 1.05, boxShadow: "0 0 15px rgba(0,255,65,0.4)" } : {}}
                            whileTap={signal.status === 'PENDING' && !loading ? { scale: 0.95 } : {}}
                            onClick={() => handleResolve(opt.option_id)}
                            disabled={loading || signal.status !== 'PENDING'}
                            className={`px-4 py-2 rounded font-mono font-bold text-sm tracking-wider transition-colors ${
                              signal.status === 'PENDING' 
                                ? "bg-matrix-primary text-black hover:bg-matrix-primary/80" 
                                : "bg-matrix-border text-matrix-text opacity-50 cursor-not-allowed"
                            }`}
                          >
                            EXECUTE
                          </motion.button>
                        </div>
                        <span className="text-xs text-matrix-text opacity-60 font-mono">Consequence: {opt.consequence}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {signal.status !== 'PENDING' && (
                  <div className="p-3 bg-matrix-border/20 text-center rounded border border-matrix-primary text-matrix-primary font-mono tracking-widest uppercase">
                    This signal is already {signal.status}.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
