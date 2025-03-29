import { Client, GatewayIntentBits } from 'discord.js';
import config from '../config';
import { getDiscordClient } from './discordClient';

/**
 * Interface for the guild data structure
 */
export interface GuildData {
  id: string;
  name: string;
  memberCount: number;
  permissions?: string[];
  error?: string;
}

/**
 * Interface for the guild list response
 */
export interface GuildListResponse {
  guildsCount: number;
  guilds: GuildData[];
}

/**
 * Service for fetching Discord guild data
 */
export class GuildService {
  constructor() {
    // No client initialization needed, using shared client
  }

  /**
   * Fetch the list of guilds the bot has access to
   * @returns Promise with guild list data
   * @throws Error if unable to authenticate or other errors occur
   */
  public async fetchGuildList(): Promise<GuildListResponse> {
    try {
      // Check for bot token
      if (!config.discord.botToken) {
        throw new Error('Discord bot token is not configured');
      }
      
      // Get the shared client instance
      const client = await getDiscordClient();

      console.log('Bot is ready, fetching guilds...');
      
      // Fetch guilds the bot has access to
      const guilds = await client.guilds.fetch();
      
      // Map guild data to a consistent format
      const guildList = await Promise.all(
        Array.from(guilds.values()).map(async (g) => {
          try {
            const guild = await g.fetch();
            return {
              id: guild.id,
              name: guild.name,
              memberCount: guild.memberCount,
              permissions: guild.members.me?.permissions.toArray(),
            };
          } catch (e) {
            return {
              id: g.id,
              name: 'Unknown',
              memberCount: 0,
              error: 'Failed to fetch guild details'
            };
          }
        })
      );

      // Return formatted response
      return {
        guildsCount: guilds.size,
        guilds: guildList
      };
    } catch (error) {
      console.error('Error fetching guild list:', error);
      throw error;
    }
  }
} 