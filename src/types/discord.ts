export interface DiscordActivity {
  type: string;
  name: string;
}

export interface DiscordUserData {
  username: string;
  avatarUrl: string | null;
  aboutMe?: string;
  status: string;
  activity: DiscordActivity | null;
}

export interface DiscordProfileResponse {
  status: string;
  data: DiscordUserData;
} 