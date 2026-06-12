import { create } from 'zustand';

interface SignalStore {
  signals: any[];
  setSignals: (signals: any[]) => void;
  addSignal: (signal: any) => void;
  updateSignal: (signalId: string, updates: any) => void;
}

export const useSignalStore = create<SignalStore>((set) => ({
  signals: [],
  setSignals: (signals) => set({ signals }),
  addSignal: (signal) => set((state) => ({ signals: [signal, ...state.signals] })),
  updateSignal: (signalId, updates) => set((state) => ({
    signals: state.signals.map(s => s.id === signalId ? { ...s, ...updates } : s)
  }))
}));
