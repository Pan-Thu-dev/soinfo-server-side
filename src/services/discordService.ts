import { Client, GatewayIntentBits, GuildMember, REST, Routes, DiscordAPIError } from 'discord.js';
import { DiscordUserData } from '../types/discordTypes';
import config from '../config';
import { getDiscordClient } from './discordClient';

/**
 * Service for fetching Discord user data
 */
export class DiscordService {
  private rest: REST;

  constructor() {
    this.rest = new REST({ version: '10' }).setToken(config.discord.botToken || '');
  }

  /**
   * Gracefully shutdown the service
   */
  public async shutdown(): Promise<void> {
    console.log('Shutting down Discord service...');
    // Nothing specific to clean up in this service
    return Promise.resolve();
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
      if (!config.discord.botToken) {
        throw new Error('Discord bot token is not configured');
      }
      
      // Get the shared client instance
      const client = await getDiscordClient();

      console.log('Discord client is ready, searching for user:', username);

      // Find the user by username
      const member = await this.findUserByUsername(username, client);
      
      if (!member) {
        console.log('User not found via guild search, attempting direct search');
        // Try a direct user search as fallback
        try {
          const user = await this.searchUserDirectly(username, client);
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
          
          // Check if the error is a rate limit
          this.handleRateLimit(err, 'direct search');
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
      
      // Check for rate limiting
      this.handleRateLimit(error, 'fetching user data');
      
      throw error;
    }
  }

  /**
   * Find a user by username across all available guilds
   * @param username Username to search for
   * @param client Discord client instance
   * @returns GuildMember object or null if not found
   */
  private async findUserByUsername(username: string, client: Client): Promise<GuildMember | null> {
    try {
      const guilds = await client.guilds.fetch();
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
            console.warn(`⚠️ Bot lacks necessary permissions in guild ${guild.name}`);
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
              console.log(`✅ Found user ${username} in guild ${guild.name} (ID: ${guild.id})`);
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
              console.log(`✅ Found user with display name ${username} in guild ${guild.name} (ID: ${guild.id})`);
              return memberByDisplayName;
            }
            
            console.log(`❌ No match found in guild ${guild.name}`);
          } catch (err) {
            console.warn(`⚠️ Could not fetch all members for guild ${guild.name}:`, err);
            
            // Check if rate limited
            this.handleRateLimit(err, `fetching members in ${guild.name}`);
            
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
              
              // Check if rate limited
              this.handleRateLimit(searchErr, 'direct search');
            }
          }
        } catch (err) {
          console.warn(`⚠️ Error fetching guild data:`, err);
          
          // Check if rate limited
          this.handleRateLimit(err, 'fetching guild data');
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
   * @param client Discord client instance
   * @returns User object or null
   */
  private async searchUserDirectly(username: string, client: Client): Promise<any | null> {
    try {
      // Get the bot's user id first
      const botUser = client.user;
      if (!botUser) {
        throw new Error("Bot user not available");
      }
      
      // Check if the username looks like a snowflake ID
      const isSnowflake = /^\d{17,19}$/.test(username);
      
      if (isSnowflake) {
        try {
          // Try to fetch by ID
          const user = await client.users.fetch(username);
          return {
            id: user.id,
            username: user.username,
            displayName: user.username, // Use username as displayName when no guild context
            avatar: user.avatar
          };
        } catch (e) {
          console.log(`Failed to fetch user with ID ${username}:`, e);
          
          // Check if rate limited
          this.handleRateLimit(e, 'fetching user by ID');
          
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
        
        // Check if rate limited
        this.handleRateLimit(e, 'direct API search');
        
        return null;
      }
    } catch (error) {
      console.error('Error in searchUserDirectly:', error);
      
      // Check if rate limited
      this.handleRateLimit(error, 'searchUserDirectly');
      
      return null;
    }
  }

  /**
   * Check if the error is a rate limit error and handle it consistently
   * @param error Error object to check
   * @param context Context where the error occurred for logging
   */
  private handleRateLimit(error: any, context: string): void {
    if (error instanceof DiscordAPIError && error.status === 429) {
      console.error(`❌ Discord Rate Limit Hit during ${context}:`, error);
      throw new Error('Discord API rate limit exceeded. Please try again later.');
    }
  }
} 