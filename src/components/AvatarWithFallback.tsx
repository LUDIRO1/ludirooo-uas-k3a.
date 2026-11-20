import React, { useState } from 'react';
import { User } from 'lucide-react';

interface Props {
  src?: string;
  alt: string;
  sizeClass?: string;
  roundedClass?: string;
}

export const AvatarWithFallback: React.FC<Props> = ({
  src,
  alt,
  sizeClass = 'w-10 h-10',
  roundedClass = 'rounded-full',
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`${sizeClass} ${roundedClass} bg-emerald-950/10 text-emerald-900 flex items-center justify-center shrink-0 border border-slate-200`}
        aria-label={alt}
      >
        <User className="w-1/2 h-1/2" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${sizeClass} ${roundedClass} object-cover shrink-0 border border-slate-200 bg-slate-100`}
    />
  );
};
