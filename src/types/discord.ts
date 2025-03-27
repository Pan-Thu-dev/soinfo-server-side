/**
 * Discord activity type and name
 */
export interface DiscordActivity {
  type: string;
  name: string;
}

/**
 * Discord user data including profile information and status
 */
export interface DiscordUserData {
  username: string;
  avatarUrl: string | null;
  aboutMe: string | null;
  status: string;
  activity: DiscordActivity | null;
  timestamp?: number;
}

/**
 * API response format for Discord profile data
 */
export interface DiscordProfileResponse {
  status: string;
  data: DiscordUserData;
} 