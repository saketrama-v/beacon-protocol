import { createServer } from 'http';
import app from './app';
import { initWebSocket } from './services/websocket.service';

const PORT = process.env.PORT || 3001;
const server = createServer(app);

// Initialize WebSocket Server
initWebSocket(server);

server.listen(PORT, () => {
  console.log(`BEACON Backend API listening on port ${PORT}`);
});
