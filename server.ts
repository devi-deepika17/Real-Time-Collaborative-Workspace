import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { authRouter } from './backend/routes/auth.ts';
import { workspaceRouter } from './backend/routes/workspaces.ts';
import { membersRouter } from './backend/routes/members.ts';
import { documentsRouter } from './backend/routes/documents.ts';
import { foldersRouter } from './backend/routes/folders.ts';
import { commentsRouter } from './backend/routes/comments.ts';
import { notificationsRouter } from './backend/routes/notifications.ts';
import { setupWebSocket } from './backend/websocket/socketHandler.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // Setup Socket.IO on the same HTTP server
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    },
  });

  setupWebSocket(io);

  // Parse JSON bodies
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/workspaces', workspaceRouter);
  app.use('/api/workspaces', membersRouter);
  app.use('/api', documentsRouter);
  app.use('/api', foldersRouter);
  app.use('/api', commentsRouter);
  app.use('/api/notifications', notificationsRouter);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (!isProduction) {
    // Vite middleware in dev
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port} [${isProduction ? 'production' : 'development'}]`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
