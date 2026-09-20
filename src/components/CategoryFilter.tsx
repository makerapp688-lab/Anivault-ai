import React from 'react';
import { Layers, Tv, Film } from 'lucide-react';

interface CategoryFilterProps {
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
  selectedType: string;
  onSelectType: (type: string) => void;
  genres: Array<{ genre: string; count: number }>;
  totalCount: number;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedGenre,
  onSelectGenre,
  selectedType,
  onSelectType,
  genres,
  totalCount
}) => {
  return (
    <div className="w-full space-y-3">
      {/* Format Type Row (All, TV Series, Movies) */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            id="filter-type-all"
            onClick={() => onSelectType('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              selectedType === 'All'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Formats</span>
          </button>
          <button
            type="button"
            id="filter-type-tv"
            onClick={() => onSelectType('TV')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              selectedType === 'TV'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>TV Series</span>
          </button>
          <button
            type="button"
            id="filter-type-movie"
            onClick={() => onSelectType('Movie')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              selectedType === 'Movie'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Movies</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing <span className="text-slate-200 font-bold">{totalCount}</span> genuine anime entries
        </div>
      </div>

      {/* Genre Pills List */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <button
          type="button"
          id="filter-genre-all"
          onClick={() => onSelectGenre('All')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            selectedGenre === 'All'
              ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300'
          }`}
        >
          <span>All Genres</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800/80 text-slate-300">
            {totalCount}
          </span>
        </button>

        {genres.map(({ genre, count }) => {
          const isActive = selectedGenre === genre;
          return (
            <button
              key={genre}
              type="button"
              id={`filter-genre-${genre.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => onSelectGenre(genre)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300'
              }`}
            >
              <span>{genre}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
