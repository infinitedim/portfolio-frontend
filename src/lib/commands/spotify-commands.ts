import type { Command, CommandOutput } from "@/types/terminal";
import { generateId } from "@/lib/utils/utils";
import { getNowPlaying } from "@/lib/services/spotify-service";

export const spotifyCommand: Command = {
  name: "spotify",
  description: "Show currently playing track on Spotify",
  aliases: ["music", "nowplaying"],
  async execute(): Promise<CommandOutput> {
    try {
      const track = await getNowPlaying();

      if (!track?.isPlaying || !track.title) {
        return {
          type: "info",
          content: "🎵 Nothing is playing on Spotify right now.",
          timestamp: new Date(),
          id: generateId(),
        };
      }

      const lines = [
        "🎵 Now Playing",
        "═".repeat(30),
        `Track:  ${track.title}`,
        `Artist: ${track.artist ?? "Unknown"}`,
      ];
      if (track.album) lines.push(`Album:  ${track.album}`);
      if (track.songUrl) lines.push(`URL:    ${track.songUrl}`);

      return {
        type: "success",
        content: lines.join("\n"),
        timestamp: new Date(),
        id: generateId(),
      };
    } catch {
      return {
        type: "error",
        content:
          "Failed to fetch Spotify status. Is the backend configured with Spotify credentials?",
        timestamp: new Date(),
        id: generateId(),
      };
    }
  },
};
