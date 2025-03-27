import { Client, GatewayIntentBits, RESTEvents, HTTPError } from 'discord.js';
import { DiscordUserData } from '../types/discord';
import { AppError } from '../utils/appError';
import config from '../config';

/**
 * Service for fetching Discord user data
 */
export class DiscordService {
  private client: Client;
  private ready: Promise<void>;

  constructor() {
    // Initialize Discord client with necessary intents
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
      ]
    });

    // Create a promise that resolves when the client is ready
    this.ready = new Promise((resolve) => {
      this.client.once('ready', () => {
        resolve();
      });
    });

    // Login with token
    this.client.login(config.discord.botToken)
      .catch(err => {
        console.error('Failed to connect to Discord:', err);
        throw new Error('Discord connection failed. Please check your token.');
      });

    // Handle rate limits
    this.client.rest.on(RESTEvents.RateLimited, (info) => {
      console.warn('Discord API rate limited:', info);
    });
  }

  /**
   * Check if a URL is a valid Discord profile URL
   * @param url Discord profile URL
   * @returns boolean indicating if URL is valid
   */
  public isValidDiscordUrl(url: string): boolean {
    const discordUrlRegex = /^https?:\/\/(?:www\.)?discord(?:app)?\.com\/users\/(\d{17,20})(?:\/.*)?$/i;
    return discordUrlRegex.test(url);
  }

  /**
   * Extract user ID from a Discord profile URL
   * @param url Discord profile URL
   * @returns User ID or null if not found
   */
  public extractUserIdFromUrl(url: string): string | null {
    try {
      const discordUrlRegex = /^https?:\/\/(?:www\.)?discord(?:app)?\.com\/users\/(\d{17,20})(?:\/.*)?$/i;
      const match = url.match(discordUrlRegex);
      
      if (match && match[1]) {
        return match[1];
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting user ID:', error);
      return null;
    }
  }

  /**
   * Fetch user data from Discord
   * @param url Discord profile URL
   * @returns Discord user data
   */
  public async fetchUserData(url: string): Promise<DiscordUserData | null> {
    try {
      // Wait for client to be ready
      await this.ready;

      // Extract user ID from URL
      const userId = this.extractUserIdFromUrl(url);
      if (!userId) {
        throw new AppError('Invalid Discord user ID in URL', 400);
      }

      // Fetch user from Discord API
      const user = await this.client.users.fetch(userId);
      if (!user) {
        return null;
      }

      // Try to fetch presence (status and activity)
      let status = 'offline';
      let activity = null;

      // Check if user is in any of the guilds the bot is in
      // This is necessary because Discord privacy settings may limit presence visibility
      for (const guild of this.client.guilds.cache.values()) {
        try {
          const member = await guild.members.fetch(userId);
          if (member && member.presence) {
            status = member.presence.status;
            if (member.presence.activities && member.presence.activities.length > 0) {
              const act = member.presence.activities[0];
              activity = {
                type: String(act.type),
                name: act.name
              };
            }
            break; // Found presence info, no need to check other guilds
          }
        } catch (err) {
          // User might not be in this guild, continue to next guild
          continue;
        }
      }

      // Construct user data
      const userData: DiscordUserData = {
        username: user.username,
        avatarUrl: user.displayAvatarURL({ size: 256 }),
        // Discord.js might not expose bio directly, so handle it safely
        aboutMe: null,
        status,
        activity
      };

      return userData;
    } catch (error) {
      // Check for specific error types
      if (error instanceof HTTPError) {
        if (error.status === 429) {
          throw new AppError('Discord API rate limit reached. Please try again later.', 429);
        }
        if (error.status === 404) {
          return null; // User not found
        }
      }
      
      console.error('Error fetching Discord user data:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new Error('Failed to fetch user data from Discord');
    }
  }

  /**
   * Clean up resources on shutdown
   */
  public async shutdown(): Promise<void> {
    try {
      await this.client.destroy();
    } catch (error) {
      console.error('Error shutting down Discord client:', error);
    }
  }
} 