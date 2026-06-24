/**
 * LiveIndicator — shows a pulsing green dot with last-synced time
 * to indicate the app is connected to Supabase in real-time.
 */
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCcw } from 'lucide-react';

interface LiveIndicatorProps {
  lastUpdated: Date | null;
  onRefresh?: () => void;
  className?: string;
}

export const LiveIndicator: React.FC<LiveIndicatorProps> = ({
  lastUpdated,
  onRefresh,
  className = ''
}) => {
  const [timeAgo, setTimeAgo] = useState('just now');
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      if (!lastUpdated) return;
      const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);

      if (seconds < 10) setTimeAgo('just now');
      else if (seconds < 60) setTimeAgo(`${seconds}s ago`);
      else if (seconds < 3600) setTimeAgo(`${Math.floor(seconds / 60)}m ago`);
      else setTimeAgo(`${Math.floor(seconds / 3600)}h ago`);

      setIsStale(seconds > 30);
    };

    updateTime();
    const t = setInterval(updateTime, 5000);
    return () => clearInterval(t);
  }, [lastUpdated]);

  return (
    <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${className}`}>
      {isStale ? (
        <WifiOff className="w-3.5 h-3.5 text-amber-500" />
      ) : (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      )}
      <span className={isStale ? 'text-amber-500' : 'text-emerald-500'}>
        {lastUpdated ? `Supabase • ${timeAgo}` : 'Connecting...'}
      </span>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="ml-1 text-slate-400 hover:text-primary transition-colors"
          title="Refresh now"
        >
          <RefreshCcw className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default LiveIndicator;
