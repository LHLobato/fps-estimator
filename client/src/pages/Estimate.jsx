import { useState, useEffect } from 'react';
import DashboardGrid from '../components/DashboardGrid';
import GlassCard from '../components/GlassCard';

const API_BASE_URL = 'http://localhost:8000';

export default function Estimate() {
  // State para formulário
  const [selectedGame, setSelectedGame] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('HIGH');
  const [selectedResolution, setSelectedResolution] = useState('1440P');
  const [selectedGPU, setSelectedGPU] = useState('');
  const [selectedCPU, setSelectedCPU] = useState('');
  const [selectedRAM, setSelectedRAM] = useState('');
  const [gameSearch, setGameSearch] = useState('');

  // State para dados carregados
  const [games, setGames] = useState([]);
  const [gpus, setGpus] = useState([]);
  const [cpus, setCpus] = useState([]);
  const [rams] = useState([
    '64GB DDR5 6000MT/s',
    '32GB DDR5 5200MT/s',
    '16GB DDR4 3200MT/s',
  ]);

  // State para resultado
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // State para histórico
  const [recentEstimates, setRecentEstimates] = useState([
    {
      id: 1,
      name: 'Cyberpunk 2077',
      specs: '1440p • RTX 4090 • Ultra',
      fps: 142,
      color: 'cyan',
    },
    {
      id: 2,
      name: 'Elden Ring',
      specs: '4K • RTX 4090 • Ultra',
      fps: 60,
      color: 'secondary',
    },
    {
      id: 3,
      name: 'Baldurs Gate 3',
      specs: '1080p • RTX 4090 • Ultra',
      fps: 178,
      color: 'cyan',
    },
  ]);

  // Fetch dados iniciais
  useEffect(() => {
    const fetchHardwareData = async () => {
      try {
        const [gamesRes, gpusRes, cpusRes] = await Promise.all([
          fetch(`${API_BASE_URL}/hardware/games`),
          fetch(`${API_BASE_URL}/hardware/gpus`),
          fetch(`${API_BASE_URL}/hardware/cpus`),
        ]);

        if (gamesRes.ok) {
          const data = await gamesRes.json();
          setGames(data.games || []);
        }
        if (gpusRes.ok) {
          const data = await gpusRes.json();
          setGpus(data.gpus || []);
          if (data.gpus?.length) setSelectedGPU(data.gpus[0]);
        }
        if (cpusRes.ok) {
          const data = await cpusRes.json();
          setCpus(data.cpus || []);
          if (data.cpus?.length) setSelectedCPU(data.cpus[0]);
        }
      } catch (err) {
        setError('Erro ao carregar dados do hardware');
        console.error(err);
      }
    };

    fetchHardwareData();
    setSelectedRAM(rams[0]);
  }, []);

  // Filtrar jogos por busca
  const filteredGames = games.filter((game) =>
    game.toLowerCase().includes(gameSearch.toLowerCase())
  );

  // Submeter formulário
  const handleEstimate = async (e) => {
    e.preventDefault();

    if (!selectedGame || !selectedGPU || !selectedCPU || !selectedRAM) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/estimate/ask_llm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gamename: selectedGame,
          preset: selectedPreset,
          resolution: selectedResolution,
          upscaling: 'DLSS',
          gpu: selectedGPU,
          cpu: selectedCPU,
          ram: selectedRAM,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao estimar FPS');
      }

      const data = await response.json();
      setResult(data);

      // Adicionar ao histórico
      setRecentEstimates((prev) => [
        {
          id: Date.now(),
          name: selectedGame,
          specs: `${selectedResolution} • ${selectedGPU.split(' ')[selectedGPU.split(' ').length - 1]} • ${selectedPreset}`,
          fps: data.avg_fps || 0,
          color: 'cyan',
        },
        ...prev.slice(0, 2),
      ]);
    } catch (err) {
      setError(err.message || 'Erro ao processar estimativa');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const presets = ['ULTRA', 'HIGH', 'MEDIUM', 'LOW'];
  const resolutions = ['1080P', '1440P', '4K_UHD'];

  return (
    <div className="w-full">
      {/* HERO HEADER */}
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
        {/* LINE 1 */}
        <div className="grid-span-6">
          <GlassCard title="ESTIMATED_FPS" className="relative overflow-hidden h-full">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
            {result ? (
              <div className="flex flex-col gap-6 h-full justify-center">
                <div className="flex items-baseline gap-3">
                  <span className="data-display text-cyan-400">{result.avg_fps || 0}</span>
                  <span className="text-sm text-slate-400">AVG</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-label-caps text-[11px] text-slate-500 mb-2">MIN</p>
                    <span className="text-2xl font-bold text-slate-300">{result.min_fps || 0}</span>
                  </div>
                  <div>
                    <p className="font-label-caps text-[11px] text-slate-500 mb-2">MAX</p>
                    <span className="text-2xl font-bold text-secondary">{result.max_fps || 0}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-600">insights</span>
                <p className="text-sm text-slate-400">Configure sua máquina e clique em ESTIMATE PERFORMANCE para ver os resultados.</p>
              </div>
            )}
          </GlassCard>
        </div>

        <div className="grid-span-6">
          <GlassCard title="HARDWARE_SPECIFICATIONS" className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
            <form onSubmit={handleEstimate} className="grid grid-cols-1 md:grid-cols-2 gap-unit-8">
              {/* Game Selection */}
              <div className="col-span-1 md:col-span-2">
                <label className="block font-label-caps text-[12px] text-cyan-500 mb-2">
                  TARGET_GAME_IDENTIFIER
                </label>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="e.g., Cyberpunk 2077, Elden Ring..."
                    value={gameSearch}
                    onChange={(e) => setGameSearch(e.target.value)}
                    className="w-full bg-transparent border-b border-white/20 focus:border-cyan-400 py-3 pl-8 text-white font-body-md outline-none transition-all placeholder:text-slate-600"
                  />

                  {/* Dropdown de jogos */}
                  {gameSearch && filteredGames.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-slate-900 border border-cyan-500/40 rounded mt-2 max-h-64 overflow-y-auto z-50">
                      {filteredGames.slice(0, 10).map((game) => (
                        <button
                          key={game}
                          type="button"
                          onClick={() => {
                            setSelectedGame(game);
                            setGameSearch(game);
                          }}
                          className="w-full px-4 py-2 text-left text-white hover:bg-cyan-500/20 transition-colors text-sm"
                        >
                          {game}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedGame && (
                  <p className="text-xs text-cyan-400 mt-2">Selecionado: {selectedGame}</p>
                )}
              </div>

              {/* Graphics Preset */}
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

              {/* Target Resolution */}
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

              {/* Processor */}
              <div>
                <label className="block font-label-caps text-[12px] text-cyan-500 mb-2">
                  PROCESSOR_UNIT (CPU)
                </label>
                <select
                  value={selectedCPU}
                  onChange={(e) => setSelectedCPU(e.target.value)}
                  className="w-full bg-slate-900/50 border-b border-white/20 focus:border-cyan-400 py-3 text-white font-body-md outline-none transition-all appearance-none"
                >
                  <option value="">Selecione uma CPU</option>
                  {cpus.map((cpu) => (
                    <option key={cpu} value={cpu}>
                      {cpu}
                    </option>
                  ))}
                </select>
              </div>

              {/* Graphics */}
              <div>
                <label className="block font-label-caps text-[12px] text-cyan-500 mb-2">
                  GRAPHICS_UNIT (GPU)
                </label>
                <select
                  value={selectedGPU}
                  onChange={(e) => setSelectedGPU(e.target.value)}
                  className="w-full bg-slate-900/50 border-b border-white/20 focus:border-cyan-400 py-3 text-white font-body-md outline-none transition-all appearance-none"
                >
                  <option value="">Selecione uma GPU</option>
                  {gpus.map((gpu) => (
                    <option key={gpu} value={gpu}>
                      {gpu}
                    </option>
                  ))}
                </select>
              </div>

              {/* Memory */}
              <div>
                <label className="block font-label-caps text-[12px] text-cyan-500 mb-2">
                  SYSTEM_MEMORY (RAM)
                </label>
                <select
                  value={selectedRAM}
                  onChange={(e) => setSelectedRAM(e.target.value)}
                  className="w-full bg-slate-900/50 border-b border-white/20 focus:border-cyan-400 py-3 text-white font-body-md outline-none transition-all appearance-none"
                >
                  <option value="">Selecione a RAM</option>
                  {rams.map((ram) => (
                    <option key={ram} value={ram}>
                      {ram}
                    </option>
                  ))}
                </select>
              </div>

              {/* Error Message */}
              {error && (
                <div className="col-span-1 md:col-span-2 p-4 bg-red-900/20 border border-red-500/40 rounded text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* CTA Button */}
              <div className="col-span-1 md:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-cyan-400 to-secondary text-slate-950 font-label-caps text-sm font-bold tracking-[0.3em] rounded transition-transform active:scale-[0.98] shadow-[0_0_30px_rgba(0,240,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'ESTIMATING...' : 'ESTIMATE PERFORMANCE'}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>

        {/* LINE 2 */}
        <div className="grid-span-12">
          <GlassCard title="RECENT_ANALYSIS">
            <div className="flex flex-col gap-4">
              {recentEstimates.map((est) => (
                <div key={est.id} className="flex items-center justify-between gap-6">
                  <div>
                    <p className="font-label-caps text-[12px] text-[color:var(--text-muted)] mb-1">
                      RECENT_ANALYSIS_{String(est.id % 3 || 3).padStart(2, '0')}
                    </p>
                    <h4 className="text-[color:var(--text-primary)] font-headline-md mb-1">{est.name}</h4>
                    <p className="text-xs text-[color:var(--text-muted)]">{est.specs}</p>
                  </div>
                  <div className="text-right">
                    <span className="data-display" style={{ color: est.color === 'secondary' ? 'var(--secondary-violet)' : 'var(--primary-cyan)' }}>
                      {est.fps}
                    </span>
                    <span className="font-label-caps text-[12px] text-[color:var(--text-muted)] ml-2">FPS</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </DashboardGrid>
    </div>
  );
}