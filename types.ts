export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  popularityScore: number;
  reason: string;
  genre: string;
  duration?: string;
  spotifyUri?: string;
}

export interface GenerationResult {
  tracks: Track[];
  playlistName: string;
  playlistDescription: string;
  coverImage?: string; // Base64 JPEG
  timestamp: number;
}

export interface PlaylistPreferences {
  mood: number;
  energy: number;
  popularity: number;
  danceability: number;
  acousticness: number;
  instrumentalness: number;
  genre: string;
  prompt: string;
}

export enum AppStatus {
  IDLE = "IDLE",
  GENERATING = "GENERATING",
  GENERATING_IMAGE = "GENERATING_IMAGE",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
  SYNCING_SPOTIFY = "SYNCING_SPOTIFY",
}

export interface SpotifyUser {
  display_name: string;
  id: string;
  images: { url: string }[];
}
