import { Link } from 'react-router-dom';
import { ArrowLeft, Clapperboard, Compass, Home } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useSeo } from '../hooks/useSeo';

export function NotFoundPage() {
  useSeo({ title: 'Page not found', description: 'The page you requested does not exist on FREE2WATCH.' });

  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <Logo size="lg" />
      <p className="mt-8 font-display text-[92px] font-black leading-none tracking-tighter text-white/10 sm:text-[140px]">
        404
      </p>
      <h1 className="-mt-6 font-display text-2xl font-bold text-white sm:text-3xl">
        This reel doesn’t exist
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
        The page may have been moved, unpublished, or the link is slightly off. Try one of the doors
        below.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link to="/" className="btn-primary px-5 py-3">
          <Home size={16} /> Back home
        </Link>
        <Link to="/movies" className="btn-secondary px-4 py-3">
          <Clapperboard size={16} /> Movies
        </Link>
        <Link to="/search" className="btn-secondary px-4 py-3">
          <Compass size={16} /> Search
        </Link>
      </div>

      <Link to="/" className="mt-8 inline-flex items-center gap-1.5 text-xs text-zinc-600 transition hover:text-zinc-400">
        <ArrowLeft size={13} /> Return to FREE2WATCH
      </Link>
    </div>
  );
}
