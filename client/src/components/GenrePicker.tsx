import { useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import type { Genre } from '../types';
import { cn } from '../utils/format';

interface GenrePickerProps {
  genres: Genre[];
  selected: string[];
  onChange: (genres: string[]) => void;
  loading?: boolean;
}

export function GenrePicker({ genres, selected, onChange, loading = false }: GenrePickerProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return genres.filter((genre) => !needle || genre.name.toLowerCase().includes(needle));
  }, [genres, query]);

  const toggle = (name: string) => {
    onChange(selected.includes(name) ? selected.filter((item) => item !== name) : [...selected, name]);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-ink-900/60 p-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter genres…"
            className="input py-1.5 pl-8 text-xs"
            aria-label="Filter genres"
          />
        </div>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 transition hover:text-white"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      <div className="mt-2.5 flex max-h-44 flex-wrap gap-1.5 overflow-y-auto">
        {loading ? (
          <span className="p-2 text-xs text-zinc-500">Loading genres…</span>
        ) : filtered.length === 0 ? (
          <span className="p-2 text-xs text-zinc-500">
            No genres found. Create genres from the Genres page first.
          </span>
        ) : (
          filtered.map((genre) => {
            const active = selected.includes(genre.name);
            return (
              <button
                key={genre.id}
                type="button"
                onClick={() => toggle(genre.name)}
                className={cn('chip py-1', active && 'chip-active')}
                aria-pressed={active}
              >
                {active && <Check size={11} />}
                {genre.name}
              </button>
            );
          })
        )}
      </div>

      <p className="mt-2 text-[10px] text-zinc-600">
        {selected.length} selected · genres are loaded dynamically from SQLite
      </p>
    </div>
  );
}
