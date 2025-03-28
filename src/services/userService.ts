import { Client, GatewayIntentBits } from 'discord.js';
import config from '../config';

/**
 * Interface for the user data structure
 */
export interface UserData {
  id: string;
  username: string;
  displayName: string;
  nickname: string | null;
  guildName: string;
  avatarUrl: string | null;
}

/**
 * Interface for the user list response
 */
export interface UserListResponse {
  count: number;
  users: UserData[];
}

/**
 * Service for fetching Discord user data
 */
export class UserService {
  private client: Client;

  constructor() {
    // Initialize Discord client with necessary intents
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
      ]
    });
  }

  /**
   * Fetch the list of users the bot has access to
   * @returns Promise with user list data
   * @throws Error if unable to authenticate or other errors occur
   */
  public async fetchUserList(): Promise<UserListResponse> {
    try {
      // Check for bot token
      if (!config.discord.botToken) {
        throw new Error('Discord bot token is not configured');
      }
      
      // Login to Discord
      await this.client.login(config.discord.botToken);
      
      // Wait for client to be ready
      await new Promise<void>((resolve) => {
        if (this.client.isReady()) {
          resolve();
        } else {
          this.client.once('ready', () => resolve());
        }
      });

      console.log('Bot is ready, fetching users...');
      
      // Fetch guilds the bot has access to
      const guilds = await this.client.guilds.fetch();
      
      const allUsers: UserData[] = [];
      
      // Iterate through guilds to get all members
      for (const guildData of guilds.values()) {
        try {
          const guild = await guildData.fetch();
          console.log(`Fetching members from ${guild.name}...`);
          
          const members = await guild.members.fetch();
          console.log(`Found ${members.size} members in ${guild.name}`);
          
          // Map member data to a consistent format
          const guildUsers = members.map(member => ({
            id: member.user.id,
            username: member.user.username,
            displayName: member.displayName,
            nickname: member.nickname,
            guildName: guild.name,
            avatarUrl: member.user.displayAvatarURL({ size: 64 }),
          }));
          
          allUsers.push(...guildUsers);
        } catch (err) {
          console.error(`Error fetching members from guild:`, err);
        }
      }
      
      // Return formatted response
      return {
        count: allUsers.length,
        users: allUsers
      };
    } catch (error) {
      console.error('Error fetching user list:', error);
      throw error;
    } finally {
      // Always destroy the client to avoid memory leaks
      this.client.destroy();
    }
  }
} 