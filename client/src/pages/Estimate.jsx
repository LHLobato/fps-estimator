import { useState, useEffect } from 'react';
import DashboardGrid from '../components/DashboardGrid';
import GlassCard from '../components/GlassCard';
import { HardwareSearchInput } from '../components/HardwareSearchInput';
import * as llmAPI from '../api/llm';
import * as userAPI from '../api/user';
import * as gamesAPI from '../api/games';
import { useGameSearch } from '../hooks/useGameSearch';
import { useCpuSearch, useGpuSearch } from '../hooks/useHardwareSearch';
import { filterRamOptions } from '../utils/filterRam';

const getValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim();
  if (['', 'null', 'none', 'undefined'].includes(clean.toLowerCase())) return null;
  if (clean.startsWith('//')) return `https:${clean}`;
  return clean;
};

export default function Estimate() {
  const [selectedGame, setSelectedGame] = useState('');
  const [selectedGameId, setSelectedGameId] = useState('');
  const [selectedGameImage, setSelectedGameImage] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState('HIGH');
  const [selectedResolution, setSelectedResolution] = useState('1440P');
  const [selectedGPU, setSelectedGPU] = useState('');
  const [selectedCPU, setSelectedCPU] = useState('');
  const [selectedRAM, setSelectedRAM] = useState('');
  const [gameSearch, setGameSearch] = useState('');
  const [cpuSearch, setCpuSearch] = useState('');
  const [gpuSearch, setGpuSearch] = useState('');
  const [ramSearch, setRamSearch] = useState('');

  const [recentEstimates, setRecentEstimates] = useState([]);

  useEffect(() => {
    const loadUserHardware = async () => {
      try {
        const user = await userAPI.get_current_user();
        if (user) {
          if (user.cpu) setSelectedCPU(user.cpu);
          if (user.gpu) setSelectedGPU(user.gpu);
          if (user.ram) setSelectedRAM(user.ram);
        }
      } catch (err) {
        console.log("Previous hardware not loaded (Guest or not logged in).");
      }
    };

    const loadGlobalRecent = async () => {
      try {
        const response = await gamesAPI.get_recent_global();
        if (response.items && response.items.length > 0) {
          const formattedRecent = response.items.map((item, index) => ({
            id: `${item.game_id}-${Date.now()}-${index}`,
            name: item.game_name,
            specs: `${item.resolution} • ${item.preset}`,
            fps: item.avg_fps,
            color: index % 2 === 0 ? 'cyan' : 'secondary',    
          }));
          setRecentEstimates(formattedRecent);
        }
      } catch (err) {
        console.error("The global log could not be loaded:", err);
      }
    };

    loadUserHardware();
    loadGlobalRecent();
  }, []); 

  const [rams] = useState([
    '128GB DDR5', '64GB DDR5', '32GB DDR5', '16GB DDR5', '8GB DDR5', '4GB DDR5',
    '128GB DDR4', '64GB DDR4', '32GB DDR4', '16GB DDR4', '8GB DDR4', '4GB DDR4',
    '128GB DDR3', '64GB DDR3', '32GB DDR3', '16GB DDR3', '8GB DDR3', '4GB DDR3',
  ]);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { results: gameSearchResults, loading: gameSearchLoading } = useGameSearch(gameSearch, 10);
  const { results: cpuSearchResults, loading: cpuSearchLoading } = useCpuSearch(cpuSearch, 10);
  const { results: gpuSearchResults, loading: gpuSearchLoading } = useGpuSearch(gpuSearch, 10);
  const filteredRams = filterRamOptions(rams, ramSearch, 10);

  const handleEstimate = async (e) => {
    e.preventDefault();

    if (!selectedGame || !selectedGameId || !selectedGPU || !selectedCPU || !selectedRAM) {
      setError('SYSTEM_WARNING: Fill in all telemetry data and select the game from the list.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const estimateData = {
        gamename: selectedGame,
        preset: selectedPreset,
        resolution: selectedResolution,
        upscaling: 'DLSS',
        gpu: selectedGPU,
        cpu: selectedCPU,
        ram: selectedRAM,
      };

      const data = await llmAPI.estimate_fps(estimateData);
      setResult(data);

      try {
        await gamesAPI.add_user_game({
          game_id: selectedGameId, 
          preset: selectedPreset,
          resolution: selectedResolution,
          upscaling: 'DLSS',
          avg_fps: Math.round(data.avg_fps), 
          min_fps: Math.round(data.min_fps),
          max_fps: Math.round(data.max_fps)
        });
      } catch (saveErr) {
        console.error("Error saving to library:", saveErr.response?.data || saveErr.message);
      }

      setRecentEstimates((prev) => {
        const newEstimate = {
          id: Date.now(),
          name: selectedGame,
          specs: `${selectedResolution} • ${selectedGPU.split(' ').pop()} • ${selectedPreset}`,
          fps: Math.round(data.avg_fps) || 0,
          color: 'cyan',
        };
        return [newEstimate, ...prev.slice(0, 2)];
      });
      
    } catch (err) {
      setError(err.message || 'Error communicating with the prediction API.');
    } finally {
      setLoading(false);
    }
  };

  const presets = ['ULTRA', 'HIGH', 'MEDIUM', 'LOW'];
  const resolutions = ['1080P', '1440P', '4K_UHD'];

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="font-headline-xl text-white tracking-tighter mb-2">
          PERFORMANCE{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-secondary">
            PREDICTOR
          </span>
        </h2>
        <p className="text-slate-400 font-body-lg max-w-2xl">
          Leverage hardware telemetry and neural estimation to calculate frame rates across 400+ titles with 98.4% accuracy.
        </p>
      </div>

      <DashboardGrid>
        <div className="col-span-12 lg:col-span-4">
          <GlassCard title="ESTIMATED_FPS" className="relative h-full">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
            
            {result ? (
              <div className="flex flex-col gap-6 h-full justify-center p-4">
                <div className="flex items-baseline gap-3 justify-center mb-4">
                  <span className="text-6xl font-data-display text-cyan-400">{Math.round(result.avg_fps)}</span>
                  <span className="text-sm font-label-caps text-slate-400">AVG_FPS</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                  <div className="text-center">
                    <p className="font-label-caps text-[11px] text-slate-500 mb-2">1% LOW (MIN)</p>
                    <span className="text-3xl font-bold text-slate-300">{Math.round(result.min_fps)}</span>
                  </div>
                  <div className="text-center border-l border-white/10">
                    <p className="font-label-caps text-[11px] text-slate-500 mb-2">PEAK (MAX)</p>
                    <span className="text-3xl font-bold text-secondary">{Math.round(result.max_fps)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8 opacity-50">
                <span className="material-symbols-outlined text-5xl text-slate-500 mb-2">network_node</span>
                <p className="text-xs font-label-caps text-slate-400 tracking-widest leading-relaxed">
                  AWAITING HARDWARE <br/> TELEMETRY DATA...
                </p>
              </div>
            )}
          </GlassCard>
        </div>

        <div className="col-span-12 lg:col-span-8">
          <GlassCard title="HARDWARE_SPECIFICATIONS" className="relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
            <form onSubmit={handleEstimate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="col-span-1 md:col-span-2">
                <label className="block font-label-caps text-[12px] text-cyan-500 mb-2">
                  TARGET_GAME_IDENTIFIER
                </label>
                <div className="relative z-50">
                  <input
                    type="text"
                    placeholder="e.g., Cyberpunk 2077, Elden Ring..."
                    value={gameSearch}
                    onChange={(e) => setGameSearch(e.target.value)}
                    className="w-full bg-transparent border-b border-white/20 focus:border-cyan-400 py-3 text-white font-body-md outline-none transition-all placeholder:text-slate-600"
                  />
                  {gameSearchLoading && <p className="text-xs text-slate-500 mt-2">Searching the database...</p>}
                  
                  {gameSearch && !gameSearchLoading && gameSearchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-slate-900 border border-cyan-500/40 rounded mt-2 max-h-64 overflow-y-auto z-50 shadow-2xl">
                      {gameSearchResults.map((game) => {
                        const imgUrl = getValidImageUrl(game.image_url);
                        
                        return (
                          <button
                            key={game.id}
                            type="button"
                            onClick={() => { 
                              setSelectedGame(game.name); 
                              setSelectedGameId(game.id);
                              setSelectedGameImage(imgUrl);
                              setGameSearch(''); 
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-cyan-500/20 transition-colors border-b border-white/5 flex items-center gap-3 group"
                          >
                            {/* O Truque do Overlay aqui para o dropdown */}
                            <div className="w-8 h-10 bg-slate-800 rounded flex items-center justify-center shrink-0 relative overflow-hidden">
                              <span className="material-symbols-outlined text-[16px] text-slate-500 absolute z-0">image</span>
                              {imgUrl && (
                                <img 
                                  src={imgUrl} 
                                  alt={game.name} 
                                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 relative z-10" 
                                  onError={(e) => e.currentTarget.style.display = 'none'}
                                />
                              )}
                            </div>
                            <span className="text-sm text-cyan-300 group-hover:text-cyan-100">{game.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedGame && (
                  <div className="mt-4 flex items-center gap-4 p-4 bg-slate-900/50 border border-cyan-500/30 rounded-lg">
                    {/* O Truque do Overlay aqui para o card selecionado */}
                    <div className="w-14 h-20 bg-slate-800 rounded border border-white/10 flex items-center justify-center shrink-0 relative overflow-hidden">
                      <span className="material-symbols-outlined text-slate-500 absolute z-0">sports_esports</span>
                      {selectedGameImage && (
                        <img 
                          src={selectedGameImage} 
                          alt={selectedGame} 
                          className="w-full h-full object-cover shadow-[0_0_15px_rgba(0,240,255,0.2)] relative z-10" 
                          onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-label-caps text-[10px] text-cyan-500 mb-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">check_circle</span>
                        SELECTED_TARGET
                      </p>
                      <p className="font-headline-md text-white">{selectedGame}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-label-caps text-[12px] text-cyan-500 mb-4">
                  GRAPHICS_PRESET
                </label>
                <div className="flex flex-wrap gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSelectedPreset(preset)}
                      className={`px-4 py-2 text-xs font-label-caps transition-all ${
                        selectedPreset === preset
                          ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                          : 'bg-slate-900 border border-white/10 text-slate-400 hover:border-cyan-500 hover:text-cyan-400'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-label-caps text-[12px] text-cyan-500 mb-4">
                  TARGET_RESOLUTION
                </label>
                <div className="flex flex-wrap gap-2">
                  {resolutions.map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setSelectedResolution(res)}
                      className={`px-4 py-2 text-xs font-label-caps transition-all ${
                        selectedResolution === res
                          ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                          : 'bg-slate-900 border border-white/10 text-slate-400 hover:border-cyan-500 hover:text-cyan-400'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>

              <HardwareSearchInput
                label="PROCESSOR_UNIT (CPU)"
                placeholder="Search for CPU model..."
                search={cpuSearch}
                onSearchChange={setCpuSearch}
                results={cpuSearchResults}
                loading={cpuSearchLoading}
                selected={selectedCPU}
                onSelect={(name) => { setSelectedCPU(name); setCpuSearch(''); }}
              />

              <HardwareSearchInput
                label="GRAPHICS_UNIT (GPU)"
                placeholder="Search for GPU model..."
                search={gpuSearch}
                onSearchChange={setGpuSearch}
                results={gpuSearchResults}
                loading={gpuSearchLoading}
                selected={selectedGPU}
                onSelect={(name) => { setSelectedGPU(name); setGpuSearch(''); }}
              />

              <div className="col-span-1 md:col-span-2">
                <label className="block font-label-caps text-[12px] text-cyan-500 mb-2">
                  SYSTEM_MEMORY (RAM)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Looking for capacity and type..."
                    value={ramSearch}
                    onChange={(e) => setRamSearch(e.target.value)}
                    className="w-full bg-transparent border-b border-white/20 focus:border-cyan-400 py-3 text-white font-body-md outline-none transition-all placeholder:text-slate-600"
                  />
                  {ramSearch && filteredRams.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-slate-900 border border-cyan-500/40 rounded mt-2 max-h-48 overflow-y-auto z-50">
                      {filteredRams.map((ram) => (
                        <button
                          key={ram}
                          type="button"
                          onClick={() => { setSelectedRAM(ram); setRamSearch(''); }}
                          className="w-full px-4 py-3 text-left text-cyan-300 hover:bg-cyan-500/30 hover:text-cyan-100 transition-colors text-sm border-b border-white/5"
                        >
                          {ram}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedRAM && <p className="text-xs font-label-caps text-cyan-400 mt-3">✓ {selectedRAM}</p>}
              </div>

              {error && (
                <div className="col-span-1 md:col-span-2 p-4 bg-red-900/20 border border-red-500/40 rounded text-red-400 text-sm font-label-caps">
                  {error}
                </div>
              )}

              <div className="col-span-1 md:col-span-2 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-gradient-to-r from-cyan-400 to-secondary text-slate-950 font-label-caps text-sm font-bold tracking-[0.3em] rounded transition-transform active:scale-[0.98] shadow-[0_0_30px_rgba(0,240,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'CALCULATING TELEMETRY...' : 'ESTIMATE PERFORMANCE'}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>

        <div className="col-span-12">
          <GlassCard title="COMMUNITY_RECENT_LOGS">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentEstimates.length > 0 ? (
                recentEstimates.map((est) => (
                  <div key={est.id} className="bg-slate-900/50 p-6 rounded border border-white/5 flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-headline-md mb-1">{est.name}</h4>
                      <p className="text-xs text-slate-400">{est.specs}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-data-display" style={{ color: est.color === 'secondary' ? 'var(--secondary-violet, #b600f8)' : '#00dbe9' }}>
                        {est.fps}
                      </span>
                      <span className="font-label-caps text-[10px] text-slate-500 ml-1">FPS</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-6">
                  <p className="text-slate-500 font-label-caps text-xs">Establishing a connection to the global telemetry log...</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </DashboardGrid>
    </div>
  );
}