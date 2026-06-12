import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';
import { useSignalStore } from '@/store/signal.store';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

let socket: Socket | null = null;

export const useSignals = () => {
  const { token } = useAuthStore();
  const { signals, setSignals, addSignal, updateSignal } = useSignalStore();

  useEffect(() => {
    if (!token) return;

    // Fetch initial list
    const fetchSignals = async () => {
      try {
        const res = await axios.get(`${API_URL}/dashboard/signals`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSignals(res.data.data);
      } catch (err) {
        console.error('Failed to fetch signals', err);
      }
    };

    fetchSignals();

    // Setup Socket.io
    const SOCKET_URL = API_URL.replace('/api/v1', '');
    socket = io(SOCKET_URL, {
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('Connected to BEACON real-time stream');
    });

    socket.on('signal:new', (newSignal) => {
      addSignal(newSignal);
    });

    socket.on('signal:resolved', ({ signalId, resolution, status }) => {
      updateSignal(signalId, { 
        status: status || 'RESOLVED', 
        resolution 
      });
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [token, setSignals, addSignal, updateSignal]);

  const resolveSignal = async (signalId: string, chosenOptionId: string, resolutionText: string) => {
    try {
      await axios.post(`${API_URL}/resolutions/${signalId}`, {
        resolution: resolutionText,
        chosenOptionId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // The update will come via WebSocket
    } catch (err) {
      console.error('Failed to resolve signal', err);
      throw err;
    }
  };

  return { signals, resolveSignal };
};
