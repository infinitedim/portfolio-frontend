import { getApiUrl } from "@/lib/api/get-api-url";

export interface NowPlayingResponse {
  isPlaying: boolean;
  title: string | null;
  artist: string | null;
  album: string | null;
  albumArtUrl: string | null;
  songUrl: string | null;
  progressMs: number | null;
  durationMs: number | null;
}

export async function getNowPlaying(): Promise<NowPlayingResponse | null> {
  try {
    const response = await fetch(`${getApiUrl()}/api/spotify/now-playing`);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}
