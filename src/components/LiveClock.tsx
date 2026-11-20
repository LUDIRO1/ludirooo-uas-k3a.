import React, { useEffect, useState } from 'react';
import {
  formatDateDDMMMYYYY,
  getCurrentTimeHHMMSS,
  getTodayISO,
} from '../utils/formatters';

interface LiveClockProps {
  showDate?: boolean;
  showSeconds?: boolean;
  className?: string;
  suffix?: string;
}

export const LiveClock: React.FC<LiveClockProps> = ({
  showDate = false,
  showSeconds = true,
  className = '',
  suffix = '',
}) => {
  const [timeStr, setTimeStr] = useState(() => getCurrentTimeHHMMSS());
  const [todayISO, setTodayISO] = useState(() => getTodayISO());

  useEffect(() => {
    const update = () => {
      const full = getCurrentTimeHHMMSS();
      setTimeStr(showSeconds ? full : full.slice(0, 5));
      setTodayISO(getTodayISO());
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [showSeconds]);

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {showDate ? `${formatDateDDMMMYYYY(todayISO)} · ` : ''}
      {timeStr}
      {suffix ? ` ${suffix}` : ''}
    </span>
  );
};
