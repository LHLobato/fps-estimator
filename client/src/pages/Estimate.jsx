import { useState, useEffect } from 'react';
import DashboardGrid from '../components/DashboardGrid';
import GlassCard from '../components/GlassCard';
import * as hardwareAPI from '../api/hardware';
import * as llmAPI from '../api/llm';

export default function Estimate() {
  // State para formulário
  const [selectedGame, setSelectedGame] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('HIGH');
  const [selectedResolution, setSelectedResolution] = useState('1440P');
  const [selectedGPU, setSelectedGPU] = useState('');
  const [selectedCPU, setSelectedCPU] = useState('');
  const [selectedRAM, setSelectedRAM] = useState('');
  const [gameSearch, setGameSearch] = useState('');
  const [cpuSearch, setCpuSearch] = useState('');
  const [gpuSearch, setGpuSearch] = useState('');
  const [ramSearch, setRamSearch] = useState('');

  // State para dados carregados
  const [games, setGames] = useState([]);
  const [gpus, setGpus] = useState([]);
  const [cpus, setCpus] = useState([]);
  const [rams] = useState([
    '128GB DDR5',
    '64GB DDR5',
    '32GB DDR5',
    '16GB DDR5',
    '8GB DDR5',
    '4GB DDR5',
    '128GB DDR4',
    '64GB DDR4',
    '32GB DDR4',
    '16GB DDR4',
    '8GB DDR4',
    '4GB DDR4',
    '128GB DDR3',
    '64GB DDR3',
    '32GB DDR3',
    '16GB DDR3',
    '8GB DDR3',
    '4GB DDR3',
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
        const [gamesList, gpusList, cpusList] = await Promise.all([
          hardwareAPI.get_games_list(),
          hardwareAPI.get_gpus_list(),
          hardwareAPI.get_cpus_list(),
        ]);

        console.log('Games response:', gamesList);
        console.log('GPUs response:', gpusList);
        console.log('CPUs response:', cpusList);

        // Extrair nomes dos hardware
        const gameNames = gamesList.games.map((g) => typeof g === 'string' ? g : g.name);
        const gpuNames = Array.isArray(gpusList.gpus) ? gpusList.gpus.map((g) => (typeof g === 'string' ? g : g.name)) : [];
        const cpuNames = Array.isArray(cpusList.cpus) ? cpusList.cpus.map((c) => (typeof c === 'string' ? c : c.name)) : [];

        console.log('Parsed games:', gameNames);
        console.log('Parsed GPUs:', gpuNames);
        console.log('Parsed CPUs:', cpuNames);

        setGames(gameNames);
        setGpus(gpuNames);
        setCpus(cpuNames);

        if (gpuNames.length > 0) setSelectedGPU(gpuNames[0]);
        if (cpuNames.length > 0) setSelectedCPU(cpuNames[0]);
        setSelectedRAM(rams[0]);
      } catch (err) {
        setError('Erro ao carregar dados do hardware');
        console.error('Erro completo:', err);
      }
    };

    fetchHardwareData();
  }, [rams]);

  // Função de filtro inteligente - prioriza matches no início
  const intelligentFilter = (items, searchTerm, limit = 3) => {
    if (!searchTerm) return items;
    
    const term = searchTerm.toLowerCase().trim();
    
    // Dividir em palavras para busca por palavra-chave
    const searchWords = term.split(/\s+/);
    
    const scored = items.map((item) => {
      const itemLower = item.toLowerCase();
      let score = 0;
      
      // Score alto para matches no início
      if (itemLower.startsWith(term)) {
        score += 1000;
      }
      
      // Score para cada palavra-chave encontrada
      searchWords.forEach((word) => {
        if (itemLower.startsWith(word)) {
          score += 500; // Match no início de uma palavra
        } else if (itemLower.includes(` ${word}`)) {
          score += 250; // Match após espaço
        } else if (itemLower.includes(word)) {
          score += 100; // Match em qualquer lugar
        }
      });
      
      return { item, score };
    });
    
    return scored
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ item }) => item);
  };

  // Filtrar jogos por busca
  const filteredGames = intelligentFilter(games, gameSearch);

  // Filtrar CPUs por busca
  const filteredCpus = intelligentFilter(cpus, cpuSearch);

  // Filtrar GPUs por busca
  const filteredGpus = intelligentFilter(gpus, gpuSearch);

  // Filtrar RAMs por busca
  const filteredRams = intelligentFilter(rams, ramSearch);

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
                  <input
                    type="text"
                    placeholder="e.g., Cyberpunk 2077, Elden Ring..."
                    value={gameSearch}
                    onChange={(e) => setGameSearch(e.target.value)}
                    className="w-full bg-transparent border-b border-white/20 focus:border-cyan-400 py-3 text-white font-body-md outline-none transition-all placeholder:text-slate-600"
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
                            setGameSearch('');
                          }}
                          className="w-full px-4 py-2 text-left text-cyan-300 hover:bg-cyan-500/30 hover:text-cyan-100 transition-colors text-sm"
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
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar CPU..."
                    value={cpuSearch}
                    onChange={(e) => setCpuSearch(e.target.value)}
                    className="w-full bg-transparent border-b border-white/20 focus:border-cyan-400 py-3 px-0 text-white font-body-md outline-none transition-all placeholder:text-slate-600"
                  />
                  {/* Dropdown de CPUs */}
                  {cpuSearch && filteredCpus.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-slate-900 border border-cyan-500/40 rounded mt-2 max-h-48 overflow-y-auto z-50">
                      {filteredCpus.map((cpu) => (
                        <button
                          key={cpu}
                          type="button"
                          onClick={() => {
                            setSelectedCPU(cpu);
                            setCpuSearch('');
                          }}
                          className="w-full px-4 py-2 text-left text-cyan-300 hover:bg-cyan-500/30 hover:text-cyan-100 transition-colors text-sm"
                        >
                          {cpu}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedCPU && (
                  <p className="text-xs text-cyan-400 mt-2">Selecionado: {selectedCPU}</p>
                )}
              </div>

              {/* Graphics */}
              <div>
                <label className="block font-label-caps text-[12px] text-cyan-500 mb-2">
                  GRAPHICS_UNIT (GPU)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar GPU..."
                    value={gpuSearch}
                    onChange={(e) => setGpuSearch(e.target.value)}
                    className="w-full bg-transparent border-b border-white/20 focus:border-cyan-400 py-3 px-0 text-white font-body-md outline-none transition-all placeholder:text-slate-600"
                  />
                  {/* Dropdown de GPUs */}
                  {gpuSearch && filteredGpus.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-slate-900 border border-cyan-500/40 rounded mt-2 max-h-48 overflow-y-auto z-50">
                      {filteredGpus.map((gpu) => (
                        <button
                          key={gpu}
                          type="button"
                          onClick={() => {
                            setSelectedGPU(gpu);
                            setGpuSearch('');
                          }}
                          className="w-full px-4 py-2 text-left text-cyan-300 hover:bg-cyan-500/30 hover:text-cyan-100 transition-colors text-sm"
                        >
                          {gpu}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedGPU && (
                  <p className="text-xs text-cyan-400 mt-2">Selecionado: {selectedGPU}</p>
                )}
              </div>

              {/* Memory */}
              <div>
                <label className="block font-label-caps text-[12px] text-cyan-500 mb-2">
                  SYSTEM_MEMORY (RAM)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar RAM..."
                    value={ramSearch}
                    onChange={(e) => setRamSearch(e.target.value)}
                    className="w-full bg-transparent border-b border-white/20 focus:border-cyan-400 py-3 px-0 text-white font-body-md outline-none transition-all placeholder:text-slate-600"
                  />
                  {/* Dropdown de RAMs */}
                  {ramSearch && filteredRams.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-slate-900 border border-cyan-500/40 rounded mt-2 max-h-48 overflow-y-auto z-50">
                      {filteredRams.map((ram) => (
                        <button
                          key={ram}
                          type="button"
                          onClick={() => {
                            setSelectedRAM(ram);
                            setRamSearch('');
                          }}
                          className="w-full px-4 py-2 text-left text-cyan-300 hover:bg-cyan-500/30 hover:text-cyan-100 transition-colors text-sm"
                        >
                          {ram}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedRAM && (
                  <p className="text-xs text-cyan-400 mt-2">Selecionado: {selectedRAM}</p>
                )}
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