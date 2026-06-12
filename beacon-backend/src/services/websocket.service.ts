import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

let io: SocketIOServer;

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const initWebSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST']
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET) as { orgId: string };
      socket.data.orgId = payload.orgId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const orgId = socket.data.orgId;
    // Join a room specific to the organization
    socket.join(`org_${orgId}`);
    console.log(`Socket connected: ${socket.id} joined org_${orgId}`);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

export const emitToOrg = (orgId: string, event: string, data: any) => {
  if (io) {
    io.to(`org_${orgId}`).emit(event, data);
  }
};
