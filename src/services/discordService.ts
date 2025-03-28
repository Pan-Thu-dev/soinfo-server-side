import { Client, GatewayIntentBits, GuildMember, REST, Routes } from 'discord.js';
import { DiscordUserData } from '../types/discord';
import config from '../config';

/**
 * Service for fetching Discord user data
 */
export class DiscordService {
  private client: Client;
  private rest: REST;

  constructor() {
    // Initialize Discord client with necessary intents
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
      ]
    });

    this.rest = new REST({ version: '10' }).setToken(config.discord.botToken || '');
  }

  /**
   * Fetch user data from Discord by username
   * @param username Discord username to search for
   * @returns Discord user data or null if not found
   * @throws Error if unable to authenticate or other errors occur
   */
  public async fetchUserDataByUsername(username: string): Promise<DiscordUserData | null> {
    if (!username || typeof username !== 'string') {
      throw new Error('Valid username is required');
    }

    try {
      // Login to Discord
      if (!config.discord.botToken) {
        throw new Error('Discord bot token is not configured');
      }
      
      await this.client.login(config.discord.botToken);
      
      // Wait for client to be ready
      await new Promise<void>((resolve) => {
        if (this.client.isReady()) {
          resolve();
        } else {
          this.client.once('ready', () => resolve());
        }
      });

      console.log('Discord client is ready, searching for user:', username);

      // Find the user by username
      const member = await this.findUserByUsername(username);
      
      if (!member) {
        console.log('User not found via guild search, attempting direct search');
        // Try a direct user search as fallback
        try {
          const user = await this.searchUserDirectly(username);
          if (user) {
            console.log('Found user via direct search:', user.username);
            // Return limited data since we don't have guild context
            return {
              username: user.username,
              displayName: user.displayName || user.username,
              avatarUrl: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : null,
              status: 'unknown', // Can't determine without guild context
              activity: null
            };
          }
        } catch (err) {
          console.error('Direct user search failed:', err);
        }
        return null;
      }

      // Extract user data
      const userData: DiscordUserData = {
        username: member.user.username,
        displayName: member.displayName,
        avatarUrl: member.user.displayAvatarURL({ size: 256 }),
        status: member.presence?.status || 'offline',
        activity: member.presence?.activities[0] ? {
          type: member.presence.activities[0].type.toString(),
          name: member.presence.activities[0].name
        } : null
      };

      return userData;
    } catch (error) {
      console.error('Error fetching Discord user data:', error);
      throw error;
    } finally {
      // Always destroy the client to avoid memory leaks
      this.client.destroy();
    }
  }

  /**
   * Find a user by username across all available guilds
   * @param username Username to search for
   * @returns GuildMember object or null if not found
   */
  private async findUserByUsername(username: string): Promise<GuildMember | null> {
    try {
      const guilds = await this.client.guilds.fetch();
      console.log(`Bot has access to ${guilds.size} guilds`);
      
      if (guilds.size === 0) {
        console.log('⚠️ WARNING: Bot is not a member of any guilds. Add the bot to a guild with the target users.');
        return null;
      }
      
      for (const guildData of guilds.values()) {
        try {
          const guild = await guildData.fetch();
          console.log(`Searching in guild: ${guild.name} (ID: ${guild.id})`);
          console.log(`Guild member count: ${guild.memberCount}`);
          console.log(`Bot permissions in this guild:`, guild.members.me?.permissions.toArray());
          
          // Check if the bot has permission to view guild members
          if (!guild.members.me?.permissions.has('ViewChannel') ||
              !guild.members.me?.permissions.has('ReadMessageHistory')) {
            console.log(`⚠️ WARNING: Bot doesn't have required permissions in guild ${guild.name}`);
            continue;
          }
          
          try {
            // Try to fetch members and search
            console.log(`Attempting to fetch members in ${guild.name}...`);
            const members = await guild.members.fetch();
            console.log(`✅ Successfully fetched ${members.size} members from ${guild.name}`);
            
            // Check for match against username
            console.log(`Searching for exact username match: ${username}`);
            const member = members.find(
              (m) => m.user.username.toLowerCase() === username.toLowerCase()
            );
            
            if (member) {
              console.log(`✅ Found user ${username} in guild ${guild.name}`);
              return member;
            }

            // Check for match against global name/nickname
            console.log(`Searching for display name/nickname match: ${username}`);
            const memberByDisplayName = members.find(
              (m) => 
                (m.displayName && m.displayName.toLowerCase() === username.toLowerCase()) ||
                (m.nickname && m.nickname.toLowerCase() === username.toLowerCase())
            );
            
            if (memberByDisplayName) {
              console.log(`✅ Found user with display name ${username} in guild ${guild.name}`);
              return memberByDisplayName;
            }
            
            console.log(`❌ No match found in guild ${guild.name}`);
          } catch (err) {
            console.warn(`⚠️ Could not fetch all members for guild ${guild.name}:`, err);
            // Try searching by direct username if mass fetching failed
            try {
              console.log(`Trying direct search in ${guild.name}`);
              const member = await guild.members.search({
                query: username,
                limit: 1
              });
              
              if (member.size > 0) {
                const foundMember = member.first();
                console.log(`✅ Found user ${foundMember?.user.username} via direct search in ${guild.name}`);
                return foundMember || null;
              }
              
              console.log(`❌ No match found via direct search in ${guild.name}`);
            } catch (searchErr) {
              console.warn(`⚠️ Direct search failed in ${guild.name}:`, searchErr);
            }
          }
        } catch (err) {
          console.warn(`⚠️ Error fetching guild data:`, err);
        }
      }
      
      console.log(`❌ User ${username} not found in any accessible guild`);
      return null;
    } catch (error) {
      console.error('❌ Error while searching for user across guilds:', error);
      throw error;
    }
  }

  /**
   * Search for a user directly using Discord API
   * This is a fallback method when guild search fails
   * @param username Username to search
   * @returns User object or null
   */
  private async searchUserDirectly(username: string): Promise<any | null> {
    try {
      // Get the bot's user id first
      const botUser = this.client.user;
      if (!botUser) {
        throw new Error("Bot user not available");
      }
      
      // Check if the username looks like a snowflake ID
      const isSnowflake = /^\d{17,19}$/.test(username);
      
      if (isSnowflake) {
        try {
          // Try to fetch by ID
          const user = await this.client.users.fetch(username);
          return {
            id: user.id,
            username: user.username,
            displayName: user.username, // Use username as displayName when no guild context
            avatar: user.avatar
          };
        } catch (e) {
          console.log(`Failed to fetch user with ID ${username}:`, e);
          return null;
        }
      }
      
      // Try to search using the API directly
      console.log(`Attempting to search for user "${username}" via API`);
      try {
        // Log bot user ID for debugging
        console.log(`Bot ID: ${botUser.id}`);
        console.log('Bot username:', botUser.username);
        
        // Since we can't directly search for users anymore, log that this is a limitation
        console.log('Discord API no longer supports searching for users directly without being in the same guild');
        console.log('Try using a Discord user ID instead or ensure the bot is in a guild with the target user');
        
        // User not found through any method
        return null;
      } catch (e) {
        console.error('Error in direct search:', e);
        return null;
      }
    } catch (error) {
      console.error('Error in searchUserDirectly:', error);
      return null;
    }
  }
} 