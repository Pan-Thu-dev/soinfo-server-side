import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { rateLimit } from './middleware/rateLimit';
import profileRoutes from './routes/profileRoutes';
import { DiscordService } from './services/discordService';
import config from './config';

// Load environment variables
dotenv.config();

// Initialize the Express application
const app = express();
const PORT = config.port;

// Initialize Discord service
const discordService = new DiscordService();

// Middleware setup
app.use(helmet()); // Security headers
app.use(cors({
  origin: config.corsOrigins,
  methods: ['GET', 'POST'],
  credentials: true
})); // Enable CORS
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies

// Apply rate limiting
app.use('/api', rateLimit(30, 60 * 1000)); // 30 requests per minute

// Routes
app.use('/api/profile', profileRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: Date.now() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use(errorHandler);

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle graceful shutdown
const shutdown = async () => {
  console.log('Shutting down server...');
  await discordService.shutdown();
  server.close();
  console.log('Server shut down successfully');
  process.exit(0);
};

// Handle termination signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app; 