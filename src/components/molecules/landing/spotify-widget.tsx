"use client";

import { useEffect, useState } from "react";
import { getNowPlaying, type NowPlayingResponse } from "@/lib/services/spotify-service";

export function SpotifyWidget() {
  const [track, setTrack] = useState<NowPlayingResponse | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const data = await getNowPlaying();
      if (mounted) setTrack(data);
    };

    load();
    const interval = setInterval(load, 30_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!track?.isPlaying || !track.title) {
    return null;
  }

  const content = (
    <div className="flex items-center gap-3 rounded border border-neutral-800 bg-neutral-900/60 px-3 py-2">
      {track.albumArtUrl && (
        <img
          src={track.albumArtUrl}
          alt={track.album ?? "Album art"}
          className="h-10 w-10 rounded object-cover"
        />
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-green-400">
          {track.title}
        </p>
        <p className="truncate text-xs text-neutral-400">
          {track.artist ?? "Unknown artist"}
        </p>
      </div>
      <span className="text-xs text-neutral-500" aria-hidden="true">
        🎵
      </span>
    </div>
  );

  if (track.songUrl) {
    return (
      <a
        href={track.songUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block transition-opacity hover:opacity-80"
        aria-label={`Now playing: ${track.title} by ${track.artist ?? "Unknown"}`}
      >
        {content}
      </a>
    );
  }

  return content;
}
