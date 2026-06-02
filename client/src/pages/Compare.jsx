import { useState, useEffect } from 'react';
import DashboardGrid from '../components/DashboardGrid';
import GlassCard from '../components/GlassCard';
import * as hardwareAPI from '../api/hardware';
import * as llmAPI from '../api/llm';

export default function Compare() {
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

  // Setup 1 State
  const [setup1Game, setSetup1Game] = useState('');
  const [setup1CPU, setSetup1CPU] = useState('');
  const [setup1GPU, setSetup1GPU] = useState('');
  const [setup1RAM, setSetup1RAM] = useState('');
  const [setup1GameSearch, setSetup1GameSearch] = useState('');
  const [setup1CPUSearch, setSetup1CPUSearch] = useState('');
  const [setup1GPUSearch, setSetup1GPUSearch] = useState('');
  const [setup1RAMSearch, setSetup1RAMSearch] = useState('');

  // Setup 2 State
  const [setup2Game, setSetup2Game] = useState('');
  const [setup2CPU, setSetup2CPU] = useState('');
  const [setup2GPU, setSetup2GPU] = useState('');
  const [setup2RAM, setSetup2RAM] = useState('');
  const [setup2GameSearch, setSetup2GameSearch] = useState('');
  const [setup2CPUSearch, setSetup2CPUSearch] = useState('');
  const [setup2GPUSearch, setSetup2GPUSearch] = useState('');
  const [setup2RAMSearch, setSetup2RAMSearch] = useState('');

  // Comparison State
  const [compareGame, setCompareGame] = useState('');
  const [compareGameSearch, setCompareGameSearch] = useState('');
  const [result1, setResult1] = useState(null);
  const [result2, setResult2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch dados iniciais
  useEffect(() => {
    const fetchHardwareData = async () => {
      try {
        const [gamesList, gpusList, cpusList] = await Promise.all([
          hardwareAPI.get_games_list(),
          hardwareAPI.get_gpus_list(),
          hardwareAPI.get_cpus_list(),
        ]);

        const gameNames = gamesList.games.map((g) => typeof g === 'string' ? g : g.name);
        const gpuNames = Array.isArray(gpusList.gpus) ? gpusList.gpus.map((g) => (typeof g === 'string' ? g : g.name)) : [];
        const cpuNames = Array.isArray(cpusList.cpus) ? cpusList.cpus.map((c) => (typeof c === 'string' ? c : c.name)) : [];

        setGames(gameNames);
        setGpus(gpuNames);
        setCpus(cpuNames);

        if (gpuNames.length > 0) {
          setSetup1GPU(gpuNames[0]);
          setSetup2GPU(gpuNames[0]);
        }
        if (cpuNames.length > 0) {
          setSetup1CPU(cpuNames[0]);
          setSetup2CPU(cpuNames[1] || cpuNames[0]);
        }
        setSetup1RAM(rams[0]);
        setSetup2RAM(rams[0]);
      } catch (err) {
        setError('Erro ao carregar dados do hardware');
        console.error('Erro completo:', err);
      }
    };

    fetchHardwareData();
  }, [rams]);

  // Função de filtro inteligente
  const intelligentFilter = (items, searchTerm, limit = 3) => {
    if (!searchTerm) return items;
    
    const term = searchTerm.toLowerCase().trim();
    const searchWords = term.split(/\s+/);
    
    const scored = items.map((item) => {
      const itemLower = item.toLowerCase();
      let score = 0;
      
      if (itemLower.startsWith(term)) {
        score += 1000;
      }
      
      searchWords.forEach((word) => {
        if (itemLower.startsWith(word)) {
          score += 500;
        } else if (itemLower.includes(` ${word}`)) {
          score += 250;
        } else if (itemLower.includes(word)) {
          score += 100;
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

  // Filtros Setup 1
  const filteredSetup1Games = intelligentFilter(games, setup1GameSearch);
  const filteredSetup1CPUs = intelligentFilter(cpus, setup1CPUSearch);
  const filteredSetup1GPUs = intelligentFilter(gpus, setup1GPUSearch);
  const filteredSetup1RAMs = intelligentFilter(rams, setup1RAMSearch);

  // Filtros Setup 2
  const filteredSetup2Games = intelligentFilter(games, setup2GameSearch);
  const filteredSetup2CPUs = intelligentFilter(cpus, setup2CPUSearch);
  const filteredSetup2GPUs = intelligentFilter(gpus, setup2GPUSearch);
  const filteredSetup2RAMs = intelligentFilter(rams, setup2RAMSearch);

  // Filtros para game de comparação
  const filteredCompareGames = intelligentFilter(games, compareGameSearch);

  // Fazer comparação
  const handleCompare = async () => {
    if (!setup1CPU || !setup1GPU || !setup1RAM || !setup2CPU || !setup2GPU || !setup2RAM || !compareGame) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    setError('');
    setResult1(null);
    setResult2(null);

    try {
      const estimateData1 = {
        gamename: compareGame,
        preset: 'HIGH',
        resolution: '1440P',
        upscaling: 'DLSS',
        gpu: setup1GPU,
        cpu: setup1CPU,
        ram: setup1RAM,
      };

      const estimateData2 = {
        gamename: compareGame,
        preset: 'HIGH',
        resolution: '1440P',
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
      setError(err.message || 'Erro ao processar comparação');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getAdvantagePercent = () => {
    if (!result1 || !result2) return 0;
    const diff = result1.avg_fps - result2.avg_fps;
    return ((diff / result2.avg_fps) * 100).toFixed(1);
  };

  return (
    <div className="w-full">
      {/* HERO HEADER */}
      <div className="mb-8">
        <h2 className="font-headline-xl text-white tracking-tighter mb-2">
          HARDWARE{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-secondary">
            COMPARISON
          </span>
        </h2>
        <p className="text-slate-400 font-body-lg max-w-2xl">
          Compare two hardware configurations side-by-side and see performance differences across games.
        </p>
      </div>

      <DashboardGrid>
        {/* SETUP SELECTION */}
        <div className="grid-span-12">
          <GlassCard title="SETUP_CONFIGURATION" className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-unit-8">
              {/* Setup 1 */}
              <div className="space-y-6">
                <div className="pb-4 border-b border-white/10">
                  <p className="font-label-caps text-[12px] text-cyan-500">SETUP_01</p>
                </div>

                {/* Setup 1 - CPU */}
                <div>
                  <label className="block font-label-caps text-[12px] text-cyan-500 mb-2">CPU</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search CPU..."
                      value={setup1CPUSearch}
                      onChange={(e) => setSetup1CPUSearch(e.target.value)}
                      className="w-full bg-transparent border-b border-white/20 focus:border-cyan-400 py-3 px-0 text-white font-body-md outline-none transition-all placeholder:text-slate-600"
                    />
                    {setup1CPUSearch && filteredSetup1CPUs.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-slate-900 border border-cyan-500/40 rounded mt-2 max-h-48 overflow-y-auto z-50">
                        {filteredSetup1CPUs.map((cpu) => (
                          <button
                            key={cpu}
                            type="button"
                            onClick={() => {
                              setSetup1CPU(cpu);
                              setSetup1CPUSearch('');
                            }}
                            className="w-full px-4 py-2 text-left text-cyan-300 hover:bg-cyan-500/30 hover:text-cyan-100 transition-colors text-sm"
                          >
                            {cpu}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {setup1CPU && <p className="text-xs text-cyan-400 mt-2">Selected: {setup1CPU}</p>}
                </div>

                {/* Setup 1 - GPU */}
                <div>
                  <label className="block font-label-caps text-[12px] text-cyan-500 mb-2">GPU</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search GPU..."
                      value={setup1GPUSearch}
                      onChange={(e) => setSetup1GPUSearch(e.target.value)}
                      className="w-full bg-transparent border-b border-white/20 focus:border-cyan-400 py-3 px-0 text-white font-body-md outline-none transition-all placeholder:text-slate-600"
                    />
                    {setup1GPUSearch && filteredSetup1GPUs.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-slate-900 border border-cyan-500/40 rounded mt-2 max-h-48 overflow-y-auto z-50">
                        {filteredSetup1GPUs.map((gpu) => (
                          <button
                            key={gpu}
                            type="button"
                            onClick={() => {
                              setSetup1GPU(gpu);
                              setSetup1GPUSearch('');
                            }}
                            className="w-full px-4 py-2 text-left text-cyan-300 hover:bg-cyan-500/30 hover:text-cyan-100 transition-colors text-sm"
                          >
                            {gpu}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {setup1GPU && <p className="text-xs text-cyan-400 mt-2">Selected: {setup1GPU}</p>}
                </div>

                {/* Setup 1 - RAM */}
                <div>
                  <label className="block font-label-caps text-[12px] text-cyan-500 mb-2">RAM</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search RAM..."
                      value={setup1RAMSearch}
                      onChange={(e) => setSetup1RAMSearch(e.target.value)}
                      className="w-full bg-transparent border-b border-white/20 focus:border-cyan-400 py-3 px-0 text-white font-body-md outline-none transition-all placeholder:text-slate-600"
                    />
                    {setup1RAMSearch && filteredSetup1RAMs.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-slate-900 border border-cyan-500/40 rounded mt-2 max-h-48 overflow-y-auto z-50">
                        {filteredSetup1RAMs.map((ram) => (
                          <button
                            key={ram}
                            type="button"
                            onClick={() => {
                              setSetup1RAM(ram);
                              setSetup1RAMSearch('');
                            }}
                            className="w-full px-4 py-2 text-left text-cyan-300 hover:bg-cyan-500/30 hover:text-cyan-100 transition-colors text-sm"
                          >
                            {ram}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {setup1RAM && <p className="text-xs text-cyan-400 mt-2">Selected: {setup1RAM}</p>}
                </div>
              </div>

              {/* Setup 2 */}
              <div className="space-y-6">
                <div className="pb-4 border-b border-white/10">
                  <p className="font-label-caps text-[12px] text-secondary">SETUP_02</p>
                </div>

                {/* Setup 2 - CPU */}
                <div>
                  <label className="block font-label-caps text-[12px] text-secondary mb-2">CPU</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search CPU..."
                      value={setup2CPUSearch}
                      onChange={(e) => setSetup2CPUSearch(e.target.value)}
                      className="w-full bg-transparent border-b border-white/20 focus:border-secondary py-3 px-0 text-white font-body-md outline-none transition-all placeholder:text-slate-600"
                    />
                    {setup2CPUSearch && filteredSetup2CPUs.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-slate-900 border border-secondary/40 rounded mt-2 max-h-48 overflow-y-auto z-50">
                        {filteredSetup2CPUs.map((cpu) => (
                          <button
                            key={cpu}
                            type="button"
                            onClick={() => {
                              setSetup2CPU(cpu);
                              setSetup2CPUSearch('');
                            }}
                            className="w-full px-4 py-2 text-left text-secondary/80 hover:bg-secondary/30 hover:text-secondary transition-colors text-sm"
                          >
                            {cpu}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {setup2CPU && <p className="text-xs text-secondary mt-2">Selected: {setup2CPU}</p>}
                </div>

                {/* Setup 2 - GPU */}
                <div>
                  <label className="block font-label-caps text-[12px] text-secondary mb-2">GPU</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search GPU..."
                      value={setup2GPUSearch}
                      onChange={(e) => setSetup2GPUSearch(e.target.value)}
                      className="w-full bg-transparent border-b border-white/20 focus:border-secondary py-3 px-0 text-white font-body-md outline-none transition-all placeholder:text-slate-600"
                    />
                    {setup2GPUSearch && filteredSetup2GPUs.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-slate-900 border border-secondary/40 rounded mt-2 max-h-48 overflow-y-auto z-50">
                        {filteredSetup2GPUs.map((gpu) => (
                          <button
                            key={gpu}
                            type="button"
                            onClick={() => {
                              setSetup2GPU(gpu);
                              setSetup2GPUSearch('');
                            }}
                            className="w-full px-4 py-2 text-left text-secondary/80 hover:bg-secondary/30 hover:text-secondary transition-colors text-sm"
                          >
                            {gpu}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {setup2GPU && <p className="text-xs text-secondary mt-2">Selected: {setup2GPU}</p>}
                </div>

                {/* Setup 2 - RAM */}
                <div>
                  <label className="block font-label-caps text-[12px] text-secondary mb-2">RAM</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search RAM..."
                      value={setup2RAMSearch}
                      onChange={(e) => setSetup2RAMSearch(e.target.value)}
                      className="w-full bg-transparent border-b border-white/20 focus:border-secondary py-3 px-0 text-white font-body-md outline-none transition-all placeholder:text-slate-600"
                    />
                    {setup2RAMSearch && filteredSetup2RAMs.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-slate-900 border border-secondary/40 rounded mt-2 max-h-48 overflow-y-auto z-50">
                        {filteredSetup2RAMs.map((ram) => (
                          <button
                            key={ram}
                            type="button"
                            onClick={() => {
                              setSetup2RAM(ram);
                              setSetup2RAMSearch('');
                            }}
                            className="w-full px-4 py-2 text-left text-secondary/80 hover:bg-secondary/30 hover:text-secondary transition-colors text-sm"
                          >
                            {ram}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {setup2RAM && <p className="text-xs text-secondary mt-2">Selected: {setup2RAM}</p>}
                </div>
              </div>
            </form>
          </GlassCard>
        </div>

        {/* GAME SELECTION FOR COMPARISON */}
        <div className="grid-span-6">
          <GlassCard title="SELECT_GAME" className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
            <div className="relative">
              <label className="block font-label-caps text-[12px] text-cyan-500 mb-2">GAME_TITLE</label>
              <input
                type="text"
                placeholder="Search game..."
                value={compareGameSearch}
                onChange={(e) => setCompareGameSearch(e.target.value)}
                className="w-full bg-transparent border-b border-white/20 focus:border-cyan-400 py-3 px-0 text-white font-body-md outline-none transition-all placeholder:text-slate-600"
              />
              {compareGameSearch && filteredCompareGames.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-slate-900 border border-cyan-500/40 rounded mt-2 max-h-48 overflow-y-auto z-50">
                  {filteredCompareGames.map((game) => (
                    <button
                      key={game}
                      type="button"
                      onClick={() => {
                        setCompareGame(game);
                        setCompareGameSearch('');
                      }}
                      className="w-full px-4 py-2 text-left text-cyan-300 hover:bg-cyan-500/30 hover:text-cyan-100 transition-colors text-sm"
                    >
                      {game}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {compareGame && <p className="text-xs text-cyan-400 mt-2">Selected: {compareGame}</p>}
          </GlassCard>
        </div>

        {/* COMPARE BUTTON */}
        <div className="grid-span-6">
          <GlassCard title="ACTION" className="relative overflow-hidden h-full flex items-end">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
            <button
              onClick={handleCompare}
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-cyan-400 to-secondary text-slate-950 font-label-caps text-sm font-bold tracking-[0.3em] rounded transition-transform active:scale-[0.98] shadow-[0_0_30px_rgba(0,240,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'COMPARING...' : 'COMPARE PERFORMANCE'}
            </button>
          </GlassCard>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="grid-span-12">
            <GlassCard className="relative overflow-hidden bg-red-900/20 border border-red-500/40">
              <p className="text-red-400 text-sm">{error}</p>
            </GlassCard>
          </div>
        )}

        {/* COMPARISON RESULTS */}
        {result1 && result2 && (
          <>
            <div className="grid-span-6">
              <GlassCard title="SETUP_01_RESULTS" className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                <div className="space-y-4">
                  <div>
                    <p className="font-label-caps text-[11px] text-slate-500 mb-1">AVERAGE FPS</p>
                    <p className="text-4xl font-bold text-cyan-400">{result1.avg_fps}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-label-caps text-[11px] text-slate-500 mb-1">MIN</p>
                      <p className="text-2xl font-bold text-slate-300">{result1.min_fps}</p>
                    </div>
                    <div>
                      <p className="font-label-caps text-[11px] text-slate-500 mb-1">MAX</p>
                      <p className="text-2xl font-bold text-cyan-400">{result1.max_fps}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs text-cyan-400">
                      CPU: {setup1CPU}<br />
                      GPU: {setup1GPU}<br />
                      RAM: {setup1RAM}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>

            <div className="grid-span-6">
              <GlassCard title="SETUP_02_RESULTS" className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
                <div className="space-y-4">
                  <div>
                    <p className="font-label-caps text-[11px] text-slate-500 mb-1">AVERAGE FPS</p>
                    <p className="text-4xl font-bold text-secondary">{result2.avg_fps}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-label-caps text-[11px] text-slate-500 mb-1">MIN</p>
                      <p className="text-2xl font-bold text-slate-300">{result2.min_fps}</p>
                    </div>
                    <div>
                      <p className="font-label-caps text-[11px] text-slate-500 mb-1">MAX</p>
                      <p className="text-2xl font-bold text-secondary">{result2.max_fps}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs text-secondary">
                      CPU: {setup2CPU}<br />
                      GPU: {setup2GPU}<br />
                      RAM: {setup2RAM}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>

            <div className="grid-span-12">
              <GlassCard title="PERFORMANCE_ADVANTAGE" className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-label-caps text-[12px] text-cyan-500 mb-2">SETUP_01 ADVANTAGE</p>
                    <p className="text-5xl font-bold text-cyan-400">{getAdvantagePercent()}%</p>
                  </div>
                  <div className="text-center">
                    <p className="font-label-caps text-[12px] text-slate-500 mb-2">FPS DIFFERENCE</p>
                    <p className="text-5xl font-bold text-cyan-400">{result1.avg_fps - result2.avg_fps}</p>
                    <p className="text-xs text-slate-400 mt-2">FPS</p>
                  </div>
                </div>
              </GlassCard>
            </div>
          </>
        )}
      </DashboardGrid>
    </div>
  );
}
