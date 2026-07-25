import React, { useState, useEffect } from 'react';
import { FaPlay, FaPause, FaStop, FaVolumeHigh, FaVolumeXmark } from 'react-icons/fa6';

export default function AudioPlayer({ textToRead, title = "AI Voice Briefing" }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlay = () => {
    if (!textToRead || !window.speechSynthesis) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = textToRead.replace(/[#*`_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 800));
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (window.speechSynthesis && isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  return (
    <div className="glass-panel p-3 rounded-2xl border border-indigo-500/30 flex items-center justify-between space-x-4 bg-slate-950/90 shadow-xl">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-300">
          <FaVolumeHigh className={`w-4 h-4 ${isPlaying ? 'animate-bounce text-amber-400' : ''}`} />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-100">{title}</div>
          <div className="text-[10px] text-slate-400">
            {isPlaying ? 'Playing Voice Synthesis...' : isPaused ? 'Paused' : 'Ready to Play Audio Briefing'}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {!isPlaying ? (
          <button
            onClick={handlePlay}
            className="p-2.5 rounded-xl bg-indigo-600/40 hover:bg-indigo-600/60 text-indigo-200 border border-indigo-500/50 transition"
            title="Play Audio"
          >
            <FaPlay className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="p-2.5 rounded-xl bg-amber-600/40 hover:bg-amber-600/60 text-amber-200 border border-amber-500/50 transition"
            title="Pause Audio"
          >
            <FaPause className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={handleStop}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
          title="Stop Audio"
        >
          <FaStop className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
