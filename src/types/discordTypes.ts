export interface DiscordActivity {
  type: string;
  name: string;
}

export interface DiscordUserData {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  status: string;
  activity: DiscordActivity | null;
}

export interface DiscordProfileResponse {
  status: string;
  data: DiscordUserData;
} 