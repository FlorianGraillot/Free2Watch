import { Link } from 'react-router-dom';
import { cn } from '../utils/format';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  to?: string;
}

const MARK_HEIGHTS = { sm: 'h-7', md: 'h-9', lg: 'h-12' };
const WORD_HEIGHTS = { sm: 'h-4', md: 'h-5 sm:h-6', lg: 'h-7' };

/**
 * Official FREE2WATCH identity: provided film-reel mark + provided wordmark.
 * Both are real <img> assets; no text-only substitute is used.
 */
export function Logo({ className, size = 'md', showWordmark = true, to = '/' }: LogoProps) {
  return (
    <Link
      to={to}
      className={cn('group inline-flex items-center gap-2.5', className)}
      aria-label="FREE2WATCH — home"
    >
      <img
        src="/assets/logo-mark.png"
        alt="FREE2WATCH logo"
        className={cn(
          MARK_HEIGHTS[size],
          'w-auto drop-shadow-[0_4px_16px_rgba(225,29,46,0.35)] transition-transform duration-300 group-hover:scale-105'
        )}
      />
      {showWordmark && (
        <img
          src="/assets/logo-wordmark.png"
          alt="FREE2WATCH"
          className={cn(WORD_HEIGHTS[size], 'w-auto opacity-95')}
        />
      )}
    </Link>
  );
}
