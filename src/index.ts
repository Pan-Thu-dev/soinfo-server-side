import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import profileRoutes from './routes/profileRoutes';
import guildRoutes from './routes/guildRoutes';
import userRoutes from './routes/userRoutes';
import config from './config';

// Load environment variables
dotenv.config();

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
})); // Security headers with adjusted policy for resources
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})); // Enable CORS with specific configuration
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies

// Root route for API documentation
app.get('/api', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Discord API is running',
    version: '1.0.0',
    documentation: {
      profile: {
        description: 'Profile-related endpoints',
        endpoints: {
          test: { method: 'GET', path: '/api/profile/test', description: 'Test the profile endpoints' },
          discord: { method: 'GET', path: '/api/profile/discord?username={discordUsername}', description: 'Get Discord profile by username' }
        }
      },
      guild: {
        description: 'Guild-related endpoints',
        endpoints: {
          test: { method: 'GET', path: '/api/guild/test', description: 'Test the guild endpoints' },
          list: { method: 'GET', path: '/api/guild/list', description: 'Get list of guilds the bot has access to' }
        }
      },
      user: {
        description: 'User-related endpoints',
        endpoints: {
          test: { method: 'GET', path: '/api/user/test', description: 'Test the user endpoints' },
          list: { method: 'GET', path: '/api/user/list', description: 'Get list of users the bot has access to' }
        }
      }
    }
  });
});

// Routes
app.use('/api/profile', profileRoutes); // Profile-related routes
app.use('/api/guild', guildRoutes);     // Guild-related routes
app.use('/api/user', userRoutes);       // User-related routes

// Error handling middleware
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`CORS is enabled for origins:`, config.corsOrigins);
});

export default app; 