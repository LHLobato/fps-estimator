import { useEffect, useState } from 'react';
import GlassCard from '../components/GlassCard';
import { HardwareSearchInput } from '../components/HardwareSearchInput';
import * as llmAPI from '../api/llm';
import * as userAPI from '../api/user';
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

const roundFps = (value) => Math.round(Number(value) || 0);

export default function Compare() {
  const [rams] = useState([
    '128GB DDR5', '64GB DDR5', '32GB DDR5', '16GB DDR5', '8GB DDR5', '4GB DDR5',
    '128GB DDR4', '64GB DDR4', '32GB DDR4', '16GB DDR4', '8GB DDR4', '4GB DDR4',
    '128GB DDR3', '64GB DDR3', '32GB DDR3', '16GB DDR3', '8GB DDR3', '4GB DDR3',
  ]);

  const [setup1CPU, setSetup1CPU] = useState('');
  const [setup1GPU, setSetup1GPU] = useState('');
  const [setup1RAM, setSetup1RAM] = useState('');
  const [setup1CPUSearch, setSetup1CPUSearch] = useState('');
  const [setup1GPUSearch, setSetup1GPUSearch] = useState('');
  const [setup1RAMSearch, setSetup1RAMSearch] = useState('');

  const [setup2CPU, setSetup2CPU] = useState('');
  const [setup2GPU, setSetup2GPU] = useState('');
  const [setup2RAM, setSetup2RAM] = useState('');
  const [setup2CPUSearch, setSetup2CPUSearch] = useState('');
  const [setup2GPUSearch, setSetup2GPUSearch] = useState('');
  const [setup2RAMSearch, setSetup2RAMSearch] = useState('');

  const [compareGame, setCompareGame] = useState('');
  const [compareGameImage, setCompareGameImage] = useState(null);
  const [compareGameSearch, setCompareGameSearch] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('HIGH');
  const [selectedResolution, setSelectedResolution] = useState('1440P');
  const [result1, setResult1] = useState(null);
  const [result2, setResult2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUserHardware = async () => {
      try {
        const user = await userAPI.get_current_user();
        if (user) {
          if (user.cpu) setSetup1CPU(user.cpu);
          if (user.gpu) setSetup1GPU(user.gpu);
          if (user.ram) setSetup1RAM(user.ram);
        }
      } catch {
        console.log('User not logged in, the fields will remain empty.');
      }
    };

    loadUserHardware();
  }, []);

  const { results: compareGameResults, loading: compareGameLoading } = useGameSearch(compareGameSearch, 10);
  const { results: setup1CpuResults, loading: setup1CpuLoading } = useCpuSearch(setup1CPUSearch, 10);
  const { results: setup1GpuResults, loading: setup1GpuLoading } = useGpuSearch(setup1GPUSearch, 10);
  const { results: setup2CpuResults, loading: setup2CpuLoading } = useCpuSearch(setup2CPUSearch, 10);
  const { results: setup2GpuResults, loading: setup2GpuLoading } = useGpuSearch(setup2GPUSearch, 10);
  const filteredSetup1RAMs = filterRamOptions(rams, setup1RAMSearch, 10);
  const filteredSetup2RAMs = filterRamOptions(rams, setup2RAMSearch, 10);

  const presets = ['ULTRA', 'HIGH', 'MEDIUM', 'LOW'];
  const resolutions = ['1080P', '1440P', '4K_UHD'];

  const hasResults = Boolean(result1 && result2);
  const metrics = hasResults
    ? [
        { label: 'MIN', setup1: roundFps(result1.min_fps), setup2: roundFps(result2.min_fps) },
        { label: 'AVG', setup1: roundFps(result1.avg_fps), setup2: roundFps(result2.avg_fps) },
        { label: 'MAX', setup1: roundFps(result1.max_fps), setup2: roundFps(result2.max_fps) },
      ]
    : [];
  const maxMetricValue = Math.max(...metrics.flatMap((item) => [item.setup1, item.setup2]), 1);

  const setup1Avg = result1 ? roundFps(result1.avg_fps) : 0;
  const setup2Avg = result2 ? roundFps(result2.avg_fps) : 0;
  const winner = setup1Avg >= setup2Avg ? 'SETUP_01' : 'SETUP_02';
  const winnerColor = winner === 'SETUP_01' ? 'text-cyan-400' : 'text-secondary';
  const diff = Math.abs(setup1Avg - setup2Avg);
  const diffPercent = hasResults ? ((diff / Math.max(Math.min(setup1Avg, setup2Avg), 1)) * 100).toFixed(1) : '0.0';

  const setupSummary = [
    {
      id: 'SETUP_01',
      accent: 'cyan',
      cpu: setup1CPU,
      gpu: setup1GPU,
      ram: setup1RAM,
      result: result1,
    },
    {
      id: 'SETUP_02',
      accent: 'secondary',
      cpu: setup2CPU,
      gpu: setup2GPU,
      ram: setup2RAM,
      result: result2,
    },
  ];

  const handleCompare = async (event) => {
    event.preventDefault();

    if (!setup1CPU || !setup1GPU || !setup1RAM || !setup2CPU || !setup2GPU || !setup2RAM || !compareGame) {
      setError('SYSTEM_WARNING: Fill in all required fields for analysis.');
      return;
    }

    setLoading(true);
    setError('');
    setResult1(null);
    setResult2(null);

    try {
      const estimateData1 = {
        gamename: compareGame,
        preset: selectedPreset,
        resolution: selectedResolution,
        upscaling: 'DLSS',
        gpu: setup1GPU,
        cpu: setup1CPU,
        ram: setup1RAM,
      };

      const estimateData2 = {
        gamename: compareGame,
        preset: selectedPreset,
        resolution: selectedResolution,
        upscaling: 'DLSS',
        gpu: setup2GPU,
        cpu: setup2CPU,
        ram: setup2RAM,
      };

      const [data1, data2] = await Promise.all([
        llmAPI.estimate_fps(estimateData1),
        llmAPI.estimate_fps(estimateData2),
      ]);

      setResult1(data1);
      setResult2(data2);
    } catch (err) {
      setError(err.message || 'Telemetry error when processing comparison.');
    } finally {
      setLoading(false);
    }
  };

  const renderRamInput = ({ labelColor, search, onSearchChange, filtered, selected, onSelect }) => (
    <div>
      <label className={`block font-label-caps text-[12px] ${labelColor} mb-2`}>RAM</label>
      <div className="relative">
        <input
          type="text"
          placeholder="Search RAM..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full bg-transparent border-b border-white/20 focus:border-cyan-400 py-3 px-0 text-white font-body-md outline-none transition-all placeholder:text-slate-600"
        />
        {search && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-48 overflow-y-auto rounded border border-cyan-500/40 bg-slate-900">
            {filtered.map((ram) => (
              <button
                key={ram}
                type="button"
                onClick={() => onSelect(ram)}
                className="w-full border-b border-white/5 px-4 py-3 text-left text-sm text-cyan-300 transition-colors hover:bg-cyan-500/30 hover:text-cyan-100"
              >
                {ram}
              </button>
            ))}
          </div>
        )}
      </div>
      {selected && <p className={`mt-2 text-xs ${labelColor}`}>Selected: {selected}</p>}
    </div>
  );

  const renderSetupForm = ({
    title,
    accent,
    cpu,
    gpu,
    ram,
    cpuSearch,
    gpuSearch,
    ramSearch,
    onCpuSearch,
    onGpuSearch,
    onRamSearch,
    cpuResults,
    gpuResults,
    cpuLoading,
    gpuLoading,
    onCpuSelect,
    onGpuSelect,
    onRamSelect,
    filteredRams,
  }) => {
    const labelColor = accent === 'cyan' ? 'text-cyan-500' : 'text-secondary';
    const borderColor = accent === 'cyan' ? 'border-cyan-500/30' : 'border-secondary/30';

    return (
      <section className={`rounded border ${borderColor} bg-slate-950/25 p-4 sm:p-5`}>
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
          <p className={`font-label-caps text-[12px] tracking-widest ${labelColor}`}>{title}</p>
          <span className={`h-2 w-2 rounded-full ${accent === 'cyan' ? 'bg-cyan-400' : 'bg-secondary'}`}></span>
        </div>

        <div className="space-y-6">
          <HardwareSearchInput
            label="CPU"
            placeholder="Search CPU..."
            search={cpuSearch}
            onSearchChange={onCpuSearch}
            results={cpuResults}
            loading={cpuLoading}
            selected={cpu}
            onSelect={onCpuSelect}
          />

          <HardwareSearchInput
            label="GPU"
            placeholder="Search GPU..."
            search={gpuSearch}
            onSearchChange={onGpuSearch}
            results={gpuResults}
            loading={gpuLoading}
            selected={gpu}
            onSelect={onGpuSelect}
          />

          {renderRamInput({
            labelColor,
            search: ramSearch,
            onSearchChange: onRamSearch,
            filtered: filteredRams,
            selected: ram,
            onSelect: onRamSelect,
          })}
        </div>
      </section>
    );
  };

  const renderGameSelector = () => (
    <div>
      <label className="block font-label-caps text-[12px] text-cyan-500 mb-2">GAME_TITLE</label>
      <div className="relative z-50">
        <input
          type="text"
          placeholder="Search game..."
          value={compareGameSearch}
          onChange={(event) => setCompareGameSearch(event.target.value)}
          className="w-full bg-transparent border-b border-white/20 focus:border-cyan-400 py-3 px-0 text-white font-body-md outline-none transition-all placeholder:text-slate-600"
        />
        {compareGameLoading && <p className="text-xs text-slate-500 mt-2">Searching the database...</p>}

        {compareGameSearch && !compareGameLoading && compareGameResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-64 overflow-y-auto rounded border border-cyan-500/40 bg-slate-900 shadow-2xl">
            {compareGameResults.map((game) => {
              const imgUrl = getValidImageUrl(game.image_url);

              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => {
                    setCompareGame(game.name);
                    setCompareGameImage(imgUrl);
                    setCompareGameSearch('');
                  }}
                  className="group flex w-full items-center gap-3 border-b border-white/5 px-4 py-2 text-left transition-colors hover:bg-cyan-500/20"
                >
                  <div className="relative flex h-10 w-[86px] shrink-0 items-center justify-center overflow-hidden rounded border border-white/10 bg-slate-950/70">
                    <span className="material-symbols-outlined absolute z-0 text-[16px] text-slate-500">image</span>
                    {imgUrl && (
                      <img
                        src={imgUrl}
                        alt={game.name}
                        className="relative z-10 h-full w-full object-contain opacity-80 group-hover:opacity-100"
                        onError={(event) => event.currentTarget.style.display = 'none'}
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

      {compareGame && (
        <div className="mt-4 flex items-center gap-4 rounded-lg border border-cyan-500/30 bg-slate-900/50 p-4">
          <div className="relative flex aspect-[460/215] w-32 shrink-0 items-center justify-center overflow-hidden rounded border border-white/10 bg-slate-950/70 sm:w-40">
            <span className="material-symbols-outlined absolute z-0 text-slate-500">sports_esports</span>
            {compareGameImage && (
              <img
                src={compareGameImage}
                alt={compareGame}
                className="relative z-10 h-full w-full object-contain shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                onError={(event) => event.currentTarget.style.display = 'none'}
              />
            )}
          </div>
          <div className="min-w-0">
            <p className="mb-1 flex items-center gap-1 font-label-caps text-[10px] text-cyan-500">
              <span className="material-symbols-outlined text-[12px]">check_circle</span>
              SELECTED_TARGET
            </p>
            <p className="truncate font-headline-md text-white">{compareGame}</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderResultPanel = () => (
    <GlassCard title="COMPARISON_RESULT" className="relative min-h-[420px] overflow-hidden">
      <div className="absolute top-0 left-0 h-full w-1 bg-cyan-500"></div>

      {hasResults ? (
        <div className="space-y-6 p-1 sm:p-4">
          <div className="rounded border border-white/10 bg-slate-900/50 p-4 text-center">
            <p className={`font-label-caps text-[11px] ${winnerColor}`}>{winner} ADVANTAGE</p>
            <p className={`mt-2 text-5xl font-data-display ${winnerColor}`}>+{diffPercent}%</p>
            <p className="mt-1 text-xs text-slate-500">{diff} FPS average difference</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded border border-cyan-400/30 bg-cyan-500/10 p-4 text-center">
              <p className="font-label-caps text-[10px] text-cyan-300">SETUP_01 AVG</p>
              <p className="mt-2 text-4xl font-data-display text-cyan-400">{setup1Avg}</p>
            </div>
            <div className="rounded border border-secondary/30 bg-secondary/10 p-4 text-center">
              <p className="font-label-caps text-[10px] text-secondary">SETUP_02 AVG</p>
              <p className="mt-2 text-4xl font-data-display text-secondary">{setup2Avg}</p>
            </div>
          </div>

          <div className="space-y-4 border-t border-white/10 pt-5">
            <p className="font-label-caps text-[11px] text-slate-500">MIN_AVG_MAX_BENCHMARK</p>
            {metrics.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-[10px] text-slate-400">{item.label}</span>
                  <span className="text-xs text-slate-500">{Math.abs(item.setup1 - item.setup2)} FPS gap</span>
                </div>
                <div className="grid grid-cols-[1fr_42px] items-center gap-3">
                  <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.max(8, (item.setup1 / maxMetricValue) * 100)}%` }}></div>
                  </div>
                  <span className="text-right text-xs font-bold text-cyan-300">{item.setup1}</span>
                </div>
                <div className="grid grid-cols-[1fr_42px] items-center gap-3">
                  <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-secondary" style={{ width: `${Math.max(8, (item.setup2 / maxMetricValue) * 100)}%` }}></div>
                  </div>
                  <span className="text-right text-xs font-bold text-secondary">{item.setup2}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded border border-cyan-400/20 bg-cyan-500/5 p-3">
            <p className="font-label-caps text-[10px] text-cyan-300">TEST_PROFILE</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              {compareGame} at {selectedResolution} / {selectedPreset}. Both setups were sent to the same prediction endpoint with identical visual settings.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex min-h-[330px] flex-col items-center justify-center gap-5 p-4 text-center">
          <div className="relative h-44 w-44">
            <div className="absolute inset-0 rounded-full border border-slate-600/60 bg-slate-900/70 shadow-[inset_0_0_45px_rgba(148,163,184,0.08)]"></div>
            <div className="absolute left-1/2 top-1/2 h-16 w-1 origin-bottom -translate-x-1/2 -translate-y-full rotate-[-24deg] rounded-full bg-slate-500"></div>
            <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-400"></div>
            <div className="absolute bottom-8 left-0 right-0 font-label-caps text-[10px] text-slate-500">DUEL READY</div>
          </div>
          <div>
            <p className="font-label-caps text-[12px] text-slate-300">Ready for comparison</p>
            <p className="mt-2 max-w-xs text-sm text-slate-500">Choose one game and two hardware profiles to compare predicted FPS.</p>
          </div>
        </div>
      )}
    </GlassCard>
  );

  return (
    <div className="w-full overflow-x-hidden">
      <div className="mb-6 lg:mb-8">
        <h2 className="font-headline-xl text-4xl text-white tracking-normal sm:text-5xl">
          HARDWARE{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-secondary">
            COMPARISON
          </span>
        </h2>
        <p className="mt-2 max-w-2xl text-base text-slate-400 sm:text-lg">
          Compare two builds under the same game, preset and resolution with clear FPS deltas.
        </p>
      </div>

      <form onSubmit={handleCompare} className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(360px,2fr)] xl:items-start">
        <div className="space-y-5">
          <GlassCard title="TEST_TARGET" className="relative min-h-0 overflow-visible">
            <div className="absolute top-0 left-0 h-full w-1 bg-cyan-500"></div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
              {renderGameSelector()}

              <div className="space-y-6">
                <div>
                  <label className="mb-4 block font-label-caps text-[12px] text-cyan-500">GRAPHICS_PRESET</label>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    {presets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setSelectedPreset(preset)}
                        className={`px-4 py-2 text-xs font-label-caps transition-all ${
                          selectedPreset === preset
                            ? 'border border-cyan-500 bg-cyan-500/20 text-cyan-400'
                            : 'border border-white/10 bg-slate-900 text-slate-400 hover:border-cyan-500 hover:text-cyan-400'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-4 block font-label-caps text-[12px] text-cyan-500">TARGET_RESOLUTION</label>
                  <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
                    {resolutions.map((resolution) => (
                      <button
                        key={resolution}
                        type="button"
                        onClick={() => setSelectedResolution(resolution)}
                        className={`px-3 py-2 text-xs font-label-caps transition-all ${
                          selectedResolution === resolution
                            ? 'border border-cyan-500 bg-cyan-500/20 text-cyan-400'
                            : 'border border-white/10 bg-slate-900 text-slate-400 hover:border-cyan-500 hover:text-cyan-400'
                        }`}
                      >
                        {resolution}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard title="SETUP_CONFIGURATION" className="relative min-h-0 overflow-visible">
            <div className="absolute top-0 left-0 h-full w-1 bg-cyan-500"></div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {renderSetupForm({
                title: 'SETUP_01',
                accent: 'cyan',
                cpu: setup1CPU,
                gpu: setup1GPU,
                ram: setup1RAM,
                cpuSearch: setup1CPUSearch,
                gpuSearch: setup1GPUSearch,
                ramSearch: setup1RAMSearch,
                onCpuSearch: setSetup1CPUSearch,
                onGpuSearch: setSetup1GPUSearch,
                onRamSearch: setSetup1RAMSearch,
                cpuResults: setup1CpuResults,
                gpuResults: setup1GpuResults,
                cpuLoading: setup1CpuLoading,
                gpuLoading: setup1GpuLoading,
                onCpuSelect: (name) => { setSetup1CPU(name); setSetup1CPUSearch(''); },
                onGpuSelect: (name) => { setSetup1GPU(name); setSetup1GPUSearch(''); },
                onRamSelect: (ram) => { setSetup1RAM(ram); setSetup1RAMSearch(''); },
                filteredRams: filteredSetup1RAMs,
              })}

              {renderSetupForm({
                title: 'SETUP_02',
                accent: 'secondary',
                cpu: setup2CPU,
                gpu: setup2GPU,
                ram: setup2RAM,
                cpuSearch: setup2CPUSearch,
                gpuSearch: setup2GPUSearch,
                ramSearch: setup2RAMSearch,
                onCpuSearch: setSetup2CPUSearch,
                onGpuSearch: setSetup2GPUSearch,
                onRamSearch: setSetup2RAMSearch,
                cpuResults: setup2CpuResults,
                gpuResults: setup2GpuResults,
                cpuLoading: setup2CpuLoading,
                gpuLoading: setup2GpuLoading,
                onCpuSelect: (name) => { setSetup2CPU(name); setSetup2CPUSearch(''); },
                onGpuSelect: (name) => { setSetup2GPU(name); setSetup2GPUSearch(''); },
                onRamSelect: (ram) => { setSetup2RAM(ram); setSetup2RAMSearch(''); },
                filteredRams: filteredSetup2RAMs,
              })}
            </div>

            {error && (
              <div className="mt-5 rounded border border-red-500/40 bg-red-900/20 p-4 text-sm text-red-400 font-label-caps">
                {error}
              </div>
            )}

            <div className="mt-5 border-t border-white/10 pt-5">
              <button
                type="submit"
                disabled={loading}
                className="h-14 w-full rounded bg-gradient-to-r from-cyan-400 to-secondary px-4 font-label-caps text-xs font-bold tracking-[0.22em] text-slate-950 shadow-[0_0_30px_rgba(0,240,255,0.24)] transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
              >
                {loading ? 'ANALYZING TELEMETRY...' : 'COMPARE PERFORMANCE'}
              </button>
            </div>
          </GlassCard>
        </div>

        <div className="xl:sticky xl:top-24">
          {renderResultPanel()}
        </div>
      </form>

      {hasResults && (
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {setupSummary.map((setup) => {
            const avg = roundFps(setup.result.avg_fps);
            const min = roundFps(setup.result.min_fps);
            const max = roundFps(setup.result.max_fps);
            const stability = avg > 0 ? Math.min(100, Math.round((min / avg) * 100)) : 0;
            const frameTime = avg > 0 ? (1000 / avg).toFixed(1) : '0.0';
            const isCyan = setup.accent === 'cyan';

            return (
              <GlassCard key={setup.id} title={`${setup.id}_DETAILS`} className="relative min-h-0 overflow-hidden">
                <div className={`absolute top-0 left-0 h-full w-1 ${isCyan ? 'bg-cyan-500' : 'bg-secondary'}`}></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-label-caps text-[10px] text-slate-500">AVG FPS</p>
                    <p className={`mt-1 text-5xl font-data-display ${isCyan ? 'text-cyan-400' : 'text-secondary'}`}>{avg}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded border border-white/10 bg-slate-900/50 p-3">
                      <p className="font-label-caps text-[9px] text-slate-500">STABILITY</p>
                      <p className="mt-1 text-lg font-bold text-white">{stability}%</p>
                    </div>
                    <div className="rounded border border-white/10 bg-slate-900/50 p-3">
                      <p className="font-label-caps text-[9px] text-slate-500">FRAME</p>
                      <p className="mt-1 text-lg font-bold text-white">{frameTime}ms</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded bg-slate-900/45 p-3">
                    <p className="font-label-caps text-[9px] text-slate-500">MIN</p>
                    <p className="text-lg font-bold text-slate-200">{min}</p>
                  </div>
                  <div className="rounded bg-slate-900/45 p-3">
                    <p className="font-label-caps text-[9px] text-slate-500">AVG</p>
                    <p className="text-lg font-bold text-slate-200">{avg}</p>
                  </div>
                  <div className="rounded bg-slate-900/45 p-3">
                    <p className="font-label-caps text-[9px] text-slate-500">MAX</p>
                    <p className="text-lg font-bold text-slate-200">{max}</p>
                  </div>
                </div>

                <div className="mt-5 rounded border border-white/10 bg-black/20 p-4">
                  <p className="text-xs leading-relaxed text-slate-400">
                    <span className={isCyan ? 'text-cyan-400' : 'text-secondary'}>CPU:</span> {setup.cpu}<br />
                    <span className={isCyan ? 'text-cyan-400' : 'text-secondary'}>GPU:</span> {setup.gpu}<br />
                    <span className={isCyan ? 'text-cyan-400' : 'text-secondary'}>RAM:</span> {setup.ram}
                  </p>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
