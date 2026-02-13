
import React from 'react';
import { Track } from '../types';

interface TrackCardProps {
  track: Track;
  index: number;
}

const TrackCard: React.FC<TrackCardProps> = ({ track, index }) => {
  return (
    <div className="flex items-center p-4 rounded-xl glass-card hover:bg-zinc-800/80 transition-all group animate-in fade-in slide-in-from-bottom-2 duration-500 hover:border-purple-500/50" style={{ animationDelay: `${index * 50}ms` }}>
      <div className="flex-none w-8 text-zinc-600 font-mono text-sm">{index + 1}</div>
      <div className="flex-none w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center mr-4 overflow-hidden relative">
        <img 
          src={`https://picsum.photos/seed/${track.title}${track.artist}/100/100`} 
          alt={track.title}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
        />
        <div className="absolute inset-0 bg-purple-600/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
           <i className="fa-solid fa-play text-white text-xs drop-shadow-md"></i>
        </div>
      </div>
      <div className="flex-grow min-w-0">
        <h4 className="font-semibold text-zinc-100 truncate group-hover:text-purple-300 transition-colors">{track.title}</h4>
        <p className="text-sm text-zinc-500 truncate">{track.artist} {track.album ? `• ${track.album}` : ''}</p>
      </div>
      <div className="hidden md:flex flex-col items-end flex-none ml-4 w-48 text-right">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-1">{track.genre}</span>
        <p className="text-[10px] text-zinc-500 italic leading-tight">{track.reason}</p>
      </div>
      <div className="flex-none ml-4 flex items-center gap-1">
        <div className="h-1 w-12 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" 
            style={{ width: `${track.popularityScore}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default TrackCard;
