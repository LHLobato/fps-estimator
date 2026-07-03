import { useState, useEffect } from 'react';
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
  const [selectedUpscaling, setSelectedUpscaling] = useState('No');
  const [selectedGPU, setSelectedGPU] = useState('');
  const [selectedCPU, setSelectedCPU] = useState('');
  const [selectedRAM, setSelectedRAM] = useState('');
  const [gameSearch, setGameSearch] = useState('');
  const [cpuSearch, setCpuSearch] = useState('');
  const [gpuSearch, setGpuSearch] = useState('');
  const [ramSearch, setRamSearch] = useState('');
  const [activeStep, setActiveStep] = useState('game');

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
      } catch {
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
            specs: `${item.resolution} • ${item.preset} • ${item.upscaling || 'No'} upscale`,
            fps: item.avg_fps,
            resolution: item.resolution,
            image: getValidImageUrl(item.image_url || item.game_image || item.cover_url),
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
        upscaling: selectedUpscaling,
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
          upscaling: selectedUpscaling,
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
          specs: `${selectedResolution} • ${selectedGPU.split(' ').pop()} • ${selectedPreset} • ${selectedUpscaling} upscale`,
          fps: Math.round(data.avg_fps) || 0,
          resolution: selectedResolution,
          image: selectedGameImage,
          color: 'cyan',
        };
        return [newEstimate, ...prev.slice(0, 9)];
      });
      
    } catch (err) {
      setError(err.message || 'Error communicating with the prediction API.');
    } finally {
      setLoading(false);
    }
  };

  const presets = ['ULTRA', 'HIGH', 'MEDIUM', 'LOW'];
  const resolutions = ['1080P', '1440P', '4K_UHD'];
  const upscalingOptions = ['No', 'DLSS', 'FSR', 'XeSS'];

  const renderStepShell = ({ id, title, icon, children }) => {
    const stepNumber = ['game', 'visuals', 'hardware', 'result'].indexOf(id) + 1;
    const isOpen = activeStep === id;

    return (
      <section className="rounded border border-white/10 bg-slate-950/35 md:border-0 md:bg-transparent">
        <button
          type="button"
          onClick={() => setActiveStep(id)}
          className="flex w-full items-center justify-between gap-4 p-4 text-left md:hidden"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-cyan-500/10 text-cyan-300">{stepNumber}</span>
            <span className="min-w-0">
              <span className="block truncate font-label-caps text-[11px] text-white">{title}</span>
              <span className="material-symbols-outlined mt-1 text-[18px] text-cyan-400">{icon}</span>
            </span>
          </span>
          <span className="material-symbols-outlined text-slate-400">{isOpen ? 'expand_less' : 'expand_more'}</span>
        </button>
        <div className={`${isOpen ? 'block' : 'hidden'} p-4 pt-0 md:block md:p-0`}>
          {children}
        </div>
      </section>
    );
  };

  const renderGameSelector = () => (
    <>
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
                    setActiveStep('visuals');
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-cyan-500/20 transition-colors border-b border-white/5 flex items-center gap-3 group"
                >
                  <div className="relative flex h-10 w-[86px] shrink-0 items-center justify-center overflow-hidden rounded border border-white/10 bg-slate-950/70">
                    <span className="material-symbols-outlined text-[16px] text-slate-500 absolute z-0">image</span>
                    {imgUrl && (
                      <img 
                        src={imgUrl} 
                        alt={game.name} 
                        className="relative z-10 h-full w-full object-contain opacity-80 group-hover:opacity-100" 
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
          <div className="relative flex aspect-[460/215] w-32 shrink-0 items-center justify-center overflow-hidden rounded border border-white/10 bg-slate-950/70 sm:w-40">
            <span className="material-symbols-outlined text-slate-500 absolute z-0">sports_esports</span>
            {selectedGameImage && (
              <img 
                src={selectedGameImage} 
                alt={selectedGame} 
                className="relative z-10 h-full w-full object-contain shadow-[0_0_15px_rgba(0,240,255,0.2)]" 
                onError={(e) => e.currentTarget.style.display = 'none'}
              />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-label-caps text-[10px] text-cyan-500 mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">check_circle</span>
              SELECTED_TARGET
            </p>
            <p className="font-headline-md text-white truncate">{selectedGame}</p>
          </div>
        </div>
      )}
    </>
  );

  const renderVisualSelector = () => (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div>
        <label className="block font-label-caps text-[12px] text-cyan-500 mb-4">
          GRAPHICS_PRESET
        </label>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
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
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
          {resolutions.map((res) => (
            <button
              key={res}
              type="button"
              onClick={() => setSelectedResolution(res)}
              className={`px-3 py-2 text-xs font-label-caps transition-all ${
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

      <div>
        <label className="block font-label-caps text-[12px] text-cyan-500 mb-4">
          UPSCALING_METHOD
        </label>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {upscalingOptions.map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setSelectedUpscaling(method)}
              className={`px-3 py-2 text-xs font-label-caps transition-all ${
                selectedUpscaling === method
                  ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                  : 'bg-slate-900 border border-white/10 text-slate-400 hover:border-cyan-500 hover:text-cyan-400'
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderHardwareSelector = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

      <div className="md:col-span-2">
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
                  onClick={() => { setSelectedRAM(ram); setRamSearch(''); setActiveStep('result'); }}
                  className="w-full px-4 py-3 text-left text-cyan-300 hover:bg-cyan-500/30 hover:text-cyan-100 transition-colors text-sm border-b border-white/5"
                >
                  {ram}
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedRAM && <p className="text-xs font-label-caps text-cyan-400 mt-3">Selected: {selectedRAM}</p>}
      </div>
    </div>
  );

  const renderResultPanel = () => (
    <GlassCard title="ESTIMATED_FPS" className="relative min-h-[420px] overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
      
      {result ? (() => {
        const minFps = Math.round(Number(result.min_fps) || 0);
        const avgFps = Math.round(Number(result.avg_fps) || 0);
        const maxFps = Math.round(Number(result.max_fps) || 0);
        const rangeMax = Math.max(maxFps, avgFps, minFps, 1);
        const stability = avgFps > 0 ? Math.min(100, Math.round((minFps / avgFps) * 100)) : 0;
        const headroom = Math.max(0, maxFps - avgFps);
        const avgFrameTime = avgFps > 0 ? (1000 / avgFps).toFixed(1) : '0.0';
        const stabilityLabel = stability >= 85 ? 'Stable' : stability >= 70 ? 'Variable' : 'Unstable';
        const fpsBars = [
          { label: 'MIN', value: minFps, color: 'bg-slate-400' },
          { label: 'AVG', value: avgFps, color: 'bg-cyan-400' },
          { label: 'MAX', value: maxFps, color: 'bg-secondary' },
        ];

        return (
          <div className="flex flex-col gap-6 h-full justify-center p-1 sm:p-4">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-36 w-36 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/10 shadow-[inset_0_0_40px_rgba(0,219,233,0.08)]">
                <div className="text-center">
                  <span className="block animate-[fps-pop_500ms_ease-out] text-6xl font-data-display text-cyan-400">{avgFps}</span>
                  <span className="font-label-caps text-[10px] text-slate-400">AVG FPS</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
              <div className="text-center">
                <p className="font-label-caps text-[11px] text-slate-500 mb-2">1% LOW (MIN)</p>
                <span className="text-3xl font-bold text-slate-300">{minFps}</span>
              </div>
              <div className="text-center border-l border-white/10">
                <p className="font-label-caps text-[11px] text-slate-500 mb-2">PEAK (MAX)</p>
                <span className="text-3xl font-bold text-secondary">{maxFps}</span>
              </div>
            </div>

            <div className="space-y-3 border-t border-white/10 pt-5">
              <p className="font-label-caps text-[11px] text-slate-500">PREDICTION_RANGE</p>
              {fpsBars.map((item) => (
                <div key={item.label} className="grid grid-cols-[42px_1fr_48px] items-center gap-3">
                  <span className="font-label-caps text-[10px] text-slate-400">{item.label}</span>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${Math.max(8, (item.value / rangeMax) * 100)}%` }}
                    />
                  </div>
                  <span className="text-right font-data-display text-lg text-white">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-5">
              <div className="rounded border border-white/10 bg-slate-900/50 p-3 text-center">
                <p className="font-label-caps text-[9px] text-slate-500">STABILITY</p>
                <p className="mt-1 text-lg font-bold text-cyan-300">{stability}%</p>
                <p className="text-[10px] text-slate-500">{stabilityLabel}</p>
              </div>
              <div className="rounded border border-white/10 bg-slate-900/50 p-3 text-center">
                <p className="font-label-caps text-[9px] text-slate-500">FRAME_TIME</p>
                <p className="mt-1 text-lg font-bold text-white">{avgFrameTime}</p>
                <p className="text-[10px] text-slate-500">ms avg</p>
              </div>
              <div className="rounded border border-white/10 bg-slate-900/50 p-3 text-center">
                <p className="font-label-caps text-[9px] text-slate-500">HEADROOM</p>
                <p className="mt-1 text-lg font-bold text-secondary">+{headroom}</p>
                <p className="text-[10px] text-slate-500">fps peak</p>
              </div>
            </div>

            <div className="rounded border border-cyan-400/20 bg-cyan-500/5 p-3">
              <p className="font-label-caps text-[10px] text-cyan-300">PROFILE_USED</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {selectedGame} at {selectedResolution} / {selectedPreset} / {selectedUpscaling} upscale with {selectedGPU || 'selected GPU'}, {selectedCPU || 'selected CPU'} and {selectedRAM || 'selected RAM'}.
              </p>
            </div>
          </div>
        );
      })() : (
        <div className="flex min-h-[330px] flex-col items-center justify-center gap-5 text-center p-4">
          <div className="relative h-44 w-44">
            <div className="absolute inset-0 rounded-full border border-slate-600/60 bg-slate-900/70 shadow-[inset_0_0_45px_rgba(148,163,184,0.08)]"></div>
            <div className="absolute inset-5 rounded-full border border-slate-700"></div>
            <div className="absolute left-1/2 top-1/2 h-16 w-1 origin-bottom -translate-x-1/2 -translate-y-full rotate-[-38deg] rounded-full bg-slate-500"></div>
            <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-400"></div>
            <div className="absolute bottom-8 left-0 right-0 font-label-caps text-[10px] text-slate-500">NO SIGNAL</div>
          </div>
          <div>
            <p className="font-label-caps text-[12px] text-slate-300">Ready for prediction</p>
            <p className="mt-2 max-w-xs text-sm text-slate-500">
              Configure a game, preset and hardware profile to generate FPS telemetry.
            </p>
          </div>
        </div>
      )}
    </GlassCard>
  );

  return (
    <div className="w-full overflow-x-hidden">
      <div className="mb-6 lg:mb-8">
        <div>
          <h2 className="font-headline-xl text-4xl text-white tracking-normal sm:text-5xl">
            PERFORMANCE{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-secondary">
              PREDICTOR
            </span>
          </h2>
          <p className="mt-2 max-w-2xl text-base text-slate-400 sm:text-lg">
            Configure the target first, then keep the live FPS panel in view as the profile gets sharper.
          </p>
        </div>
      </div>

      <form onSubmit={handleEstimate} className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(360px,2fr)] xl:items-start">
        <GlassCard title="HARDWARE_SPECIFICATIONS" className="relative min-h-0">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
          <div className="space-y-5 md:space-y-8">
            {renderStepShell({ id: 'game', title: 'Game', icon: 'sports_esports', children: renderGameSelector() })}

            {renderStepShell({ id: 'visuals', title: 'Preset / Resolution', icon: 'display_settings', children: renderVisualSelector() })}

            {renderStepShell({ id: 'hardware', title: 'Hardware', icon: 'memory', children: renderHardwareSelector() })}

            {error && (
              <div className="rounded border border-red-500/40 bg-red-900/20 p-4 text-sm text-red-400 font-label-caps">
                {error}
              </div>
            )}

            <div className="border-t border-white/10 pt-5">
              <button
                type="submit"
                disabled={loading}
                onClick={() => setActiveStep('result')}
                className="h-14 w-full rounded bg-gradient-to-r from-cyan-400 to-secondary px-4 font-label-caps text-xs font-bold tracking-[0.22em] text-slate-950 shadow-[0_0_30px_rgba(0,240,255,0.24)] transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
              >
                {loading ? 'CALCULATING TELEMETRY...' : 'ESTIMATE PERFORMANCE'}
              </button>
            </div>
          </div>
        </GlassCard>

        <div className="xl:sticky xl:top-24">
          <div className="md:hidden">
            {renderStepShell({ id: 'result', title: 'Result', icon: 'speed', children: renderResultPanel() })}
          </div>
          <div className="hidden md:block">
            {renderResultPanel()}
          </div>
        </div>
      </form>

      <div className="mt-6 lg:mt-8">
        <GlassCard title="COMMUNITY_RECENT_LOGS" className="recent-logs-panel">
          {recentEstimates.length > 0 ? (
            <div className="recent-log-carousel -mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto px-2 pb-3">
              {recentEstimates.map((est) => (
                <article key={est.id} className="h-32 w-[min(86vw,400px)] shrink-0 snap-start overflow-hidden rounded border border-white/5 bg-slate-900/55 sm:w-[400px]">
                  <div className="grid h-full grid-cols-[104px_minmax(0,1fr)_64px] items-center gap-3 p-4 sm:grid-cols-[132px_minmax(0,1fr)_72px] sm:gap-4">
                    <div className="relative aspect-[460/215] w-full overflow-hidden rounded bg-slate-950/70">
                      <span className="material-symbols-outlined absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 text-slate-600">stadia_controller</span>
                      {est.image && (
                        <img
                          src={est.image}
                          alt={est.name}
                          className="relative z-10 h-full w-full object-contain"
                          onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                      )}
                    </div>
                    <div className="min-w-0 self-center">
                      <div className="mb-2 inline-flex max-w-full rounded border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 font-label-caps text-[9px] text-cyan-300">
                        {est.resolution || 'RES'}
                      </div>
                      <h4 className="truncate text-sm font-semibold text-white sm:text-base">{est.name}</h4>
                      <p className="mt-1 truncate text-xs text-slate-400">{est.specs}</p>
                    </div>
                    <div className="min-w-0 text-right">
                      <span className="block text-3xl font-data-display leading-none sm:text-4xl" style={{ color: est.color === 'secondary' ? 'var(--secondary-violet, #ebb2ff)' : '#00dbe9' }}>
                        {Math.round(est.fps)}
                      </span>
                      <span className="font-label-caps text-[10px] text-slate-500">FPS</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-slate-500 font-label-caps text-xs">Establishing a connection to the global telemetry log...</p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
