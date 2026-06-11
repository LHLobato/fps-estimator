/**
 * Campo de busca com dropdown alimentado por resultados da API (CPU/GPU/jogos).
 */
export function HardwareSearchInput({
  label,
  placeholder,
  search,
  onSearchChange,
  results = [],
  loading = false,
  selected,
  onSelect,
  className = '',
}) {
  const showDropdown = search.trim() && !loading && results.length > 0;
  const showEmpty = search.trim() && !loading && results.length === 0;

  return (
    <div className={className}>
      {label && (
        <label className="block font-label-caps text-[12px] text-cyan-500 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-transparent border-b border-white/20 focus:border-cyan-400 py-3 px-0 text-white font-body-md outline-none transition-all placeholder:text-slate-600"
        />
        {loading && (
          <p className="text-xs text-slate-500 mt-2">Searching...</p>
        )}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 bg-slate-900 border border-cyan-500/40 rounded mt-2 max-h-48 overflow-y-auto z-50">
            {results.map((item) => (
              <button
                key={item.id ?? item.name}
                type="button"
                onClick={() => onSelect(item.name)}
                className="w-full px-4 py-2 text-left text-cyan-300 hover:bg-cyan-500/30 hover:text-cyan-100 transition-colors text-sm"
              >
                {item.name}
              </button>
            ))}
          </div>
        )}
        {showEmpty && (
          <p className="text-xs text-slate-500 mt-2">No results found.</p>
        )}
      </div>
      {selected && (
        <p className="text-xs text-cyan-400 mt-2">Selected: {selected}</p>
      )}
    </div>
  );
}
