import React, { useState } from 'react';
import { WordItem } from '../types';
import { playAudioData } from '../services/audioUtils';
import { generatePronunciation } from '../services/geminiService';

interface WordCardProps {
  item: WordItem;
}

export const WordCard: React.FC<WordCardProps> = ({ item }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [cachedAudio, setCachedAudio] = useState<string | null>(null);

  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering other clicks if any
    if (loadingAudio) return;
    setIsPlaying(true);

    try {
        let audioToPlay = cachedAudio;
        
        if (!audioToPlay) {
            setLoadingAudio(true);
            audioToPlay = await generatePronunciation(item.word);
            setCachedAudio(audioToPlay);
        }

        if (audioToPlay) {
            await playAudioData(audioToPlay);
        }
    } catch (e) {
        console.error("Audio playback failed", e);
    } finally {
        setLoadingAudio(false);
        setTimeout(() => setIsPlaying(false), 1500); 
    }
  };

  return (
    <div 
        className="relative rounded-3xl overflow-hidden shadow-md active:scale-95 transition-transform duration-200 aspect-[3/4] group"
        onClick={handlePlay}
        // Fallback color while image loads
        style={{ backgroundColor: item.themeColor || '#e5e7eb' }}
    >
        {/* Full Bleed Image */}
        <div className="absolute inset-0">
            <img 
                src={item.imageUrl} 
                alt={item.word} 
                className="w-full h-full object-cover"
                loading="lazy"
            />
        </div>

        {/* Audio Loading Indicator (Centered) */}
        {loadingAudio && (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <div className="w-10 h-10 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                </div>
            </div>
        )}

        {/* Text Overlay with Gradient - Improves readability on any background */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex flex-col items-center justify-end z-10">
            <h2 className="text-xl font-black text-white tracking-wide drop-shadow-md leading-none mb-1">
                {item.word}
            </h2>
            
            <div className="flex items-center gap-1.5 opacity-90">
                <span className="text-xs font-mono text-white/90 tracking-wider">
                    {item.phonetic}
                </span>
                {/* Speaker Icon */}
                <div className={`transition-transform duration-300 text-white ${isPlaying ? 'scale-110' : 'scale-100'}`}>
                    {isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 animate-pulse">
                             <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 2.485.51 5.145 2.153 7.712.187.295.52.48.874.48h1.943l3.655 3.635c1.076 1.07 2.875.295 2.875-1.226V4.06zM18.5 7.5a.75.75 0 01.75.75c0 1.58.664 3.01 1.724 4.004.59.554.59 1.48 0 2.034a6.002 6.002 0 01-1.724 2.96.75.75 0 11-1.06-1.06c.86-1.096 1.284-2.26 1.284-3.414 0-1.154-.424-2.318-1.284-3.414a.75.75 0 01.06-1.06z" />
                        </svg>
                    ) : (
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 2.485.51 5.145 2.153 7.712.187.295.52.48.874.48h1.943l3.655 3.635c1.076 1.07 2.875.295 2.875-1.226V4.06zM18.5 7.5a.75.75 0 01.75.75c0 1.58.664 3.01 1.724 4.004.59.554.59 1.48 0 2.034a6.002 6.002 0 01-1.724 2.96.75.75 0 11-1.06-1.06c.86-1.096 1.284-2.26 1.284-3.414 0-1.154-.424-2.318-1.284-3.414a.75.75 0 01.06-1.06z" />
                        </svg>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};