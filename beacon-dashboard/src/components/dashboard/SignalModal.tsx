import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useSignals } from '@/hooks/useSignals';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

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
      <DialogContent className="glass-panel text-white border-matrix-primary/30 sm:max-w-2xl bg-black/90 p-0 overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.2)]">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-matrix-primary to-transparent opacity-80"></div>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0, filter: "blur(5px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              exit={{ scale: 0.95, opacity: 0, filter: "blur(5px)" }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
              className="p-8"
            >
              <DialogHeader className="flex flex-row items-center gap-4 space-y-0">
                <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/30 flex-shrink-0 animate-pulse-fast">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <DialogTitle className="text-2xl text-white tracking-widest font-space uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                    Intervention Required
                  </DialogTitle>
                  <DialogDescription className="text-matrix-primary/70 font-mono mt-1">
                    Agent <strong className="text-white bg-matrix-primary/20 px-2 py-0.5 rounded border border-matrix-primary/30">{signal.agent?.name || signal.agentId}</strong> is blocked and awaits human command.
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div className="space-y-6 my-6">
                {/* Context Snippet */}
                <div className="p-5 border border-matrix-border/30 rounded-xl bg-gradient-to-r from-matrix-primary/5 to-transparent relative overflow-hidden shadow-inner">
                  <div className="absolute top-0 left-0 w-1 h-full bg-matrix-primary opacity-80"></div>
                  <h4 className="text-matrix-primary mb-3 text-sm font-bold font-space uppercase tracking-widest">Context Snapshot</h4>
                  <p className="text-sm text-white/90 mb-2 font-mono leading-relaxed"><span className="text-matrix-primary/70 uppercase tracking-wider text-xs mr-2">Task:</span> {signal.contextSnapshot?.task_description}</p>
                  <p className="text-sm text-white/90 font-mono leading-relaxed"><span className="text-matrix-primary/70 uppercase tracking-wider text-xs mr-2">State:</span> {signal.contextSnapshot?.current_state}</p>
                </div>

                {/* Question */}
                <div className="p-6 border border-yellow-500/30 rounded-xl bg-yellow-500/5 shadow-[inset_0_0_30px_rgba(234,179,8,0.05)] relative overflow-hidden">
                  <h4 className="text-yellow-500 mb-4 text-xl font-bold font-space tracking-wide drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]">{decisionNeeded.question}</h4>
                  <div className="grid grid-cols-1 gap-3 mt-5 relative z-10">
                    {decisionNeeded.options?.map((opt: any) => (
                      <div key={opt.option_id} className="flex flex-col gap-3 p-4 border border-matrix-border/20 rounded-lg hover:border-matrix-primary/50 hover:bg-matrix-primary/5 transition-all duration-300 bg-black/60 group">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white font-space tracking-wider text-lg">{opt.label}</span>
                          <motion.button 
                            whileHover={signal.status === 'PENDING' && !loading ? { scale: 1.05, boxShadow: "0 0 20px rgba(16,185,129,0.3)" } : {}}
                            whileTap={signal.status === 'PENDING' && !loading ? { scale: 0.95 } : {}}
                            onClick={() => handleResolve(opt.option_id)}
                            disabled={loading || signal.status !== 'PENDING'}
                            className={`px-6 py-2.5 rounded-lg font-space font-bold text-sm tracking-widest transition-all ${
                              signal.status === 'PENDING' 
                                ? "matrix-btn-primary" 
                                : "bg-matrix-border/20 text-matrix-text/30 cursor-not-allowed"
                            }`}
                          >
                            EXECUTE
                          </motion.button>
                        </div>
                        <span className="text-sm text-matrix-text/60 font-mono">
                          <span className="text-matrix-primary/40 uppercase tracking-widest text-xs mr-2">Consequence:</span> 
                          {opt.consequence}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {signal.status !== 'PENDING' && (
                  <div className="p-4 bg-matrix-primary/10 text-center rounded-xl border border-matrix-primary/30 flex flex-col items-center gap-2">
                    <ShieldCheck className="w-8 h-8 text-matrix-primary drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                    <span className="text-matrix-primary font-space tracking-[0.2em] uppercase text-lg">
                      Signal {signal.status}
                    </span>
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
