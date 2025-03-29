import { Client, GatewayIntentBits } from 'discord.js';
import config from '../config';

let clientInstance: Client | null = null;
let isClientReady = false;

/**
 * Get a singleton Discord client instance
 * Creates and initializes the client if it doesn't exist
 * @returns Promise with the Discord client instance
 * @throws Error if client initialization fails
 */
export const getDiscordClient = async (): Promise<Client> => {
  if (clientInstance && isClientReady) {
    return clientInstance;
  }

  if (!config.discord.botToken) {
    throw new Error('Discord bot token is not configured');
  }

  if (!clientInstance) {
    console.log('Initializing Discord Client...');
    clientInstance = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
      ]
    });

    clientInstance.on('ready', () => {
      console.log(`Logged in as ${clientInstance?.user?.tag}!`);
      isClientReady = true;
    });

    clientInstance.on('error', (error) => {
      console.error('Discord Client Error:', error);
      isClientReady = false; // Mark as not ready on error
    });

    clientInstance.on('disconnect', () => {
      console.warn('Discord Client Disconnected');
      isClientReady = false;
    });

    try {
      await clientInstance.login(config.discord.botToken);
    } catch (loginError) {
      console.error('Failed to login Discord client:', loginError);
      clientInstance = null; // Reset instance if login fails
      throw loginError;
    }
  }

  // Wait for the client to become ready if it's logging in
  if (!isClientReady) {
    console.log('Waiting for Discord client to become ready...');
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Client ready timeout'));
      }, 30000); // 30s timeout
      
      if (clientInstance) {
        clientInstance.once('ready', () => {
          clearTimeout(timeout);
          isClientReady = true;
          resolve();
        });
      } else {
        clearTimeout(timeout);
        reject(new Error('Client instance not available'));
      }
    });
  }

  return clientInstance;
};

// Optional: Graceful shutdown
process.on('SIGINT', () => {
  if (clientInstance) {
    console.log('Destroying Discord client before shutdown...');
    clientInstance.destroy();
  }
  process.exit();
});

process.on('SIGTERM', () => {
  if (clientInstance) {
    console.log('Destroying Discord client before shutdown...');
    clientInstance.destroy();
  }
  process.exit();
}); 