import { useState, useEffect } from 'react';
import DashboardGrid from '../components/DashboardGrid';
import GlassCard from '../components/GlassCard';
import { HardwareSearchInput } from '../components/HardwareSearchInput';
import * as llmAPI from '../api/llm';
import * as userAPI from '../api/user';
import { useGameSearch } from '../hooks/useGameSearch';
import { useCpuSearch, useGpuSearch } from '../hooks/useHardwareSearch';
import { filterRamOptions } from '../utils/filterRam';

export default function Compare() {
  const [rams] = useState([
    '128GB DDR5', '64GB DDR5', '32GB DDR5', '16GB DDR5', '8GB DDR5', '4GB DDR5',
    '128GB DDR4', '64GB DDR4', '32GB DDR4', '16GB DDR4', '8GB DDR4', '4GB DDR4',
    '128GB DDR3', '64GB DDR3', '32GB DDR3', '16GB DDR3', '8GB DDR3', '4GB DDR3',
  ]);

  // Setup 1 State
  const [setup1CPU, setSetup1CPU] = useState('');
  const [setup1GPU, setSetup1GPU] = useState('');
  const [setup1RAM, setSetup1RAM] = useState('');
  const [setup1CPUSearch, setSetup1CPUSearch] = useState('');
  const [setup1GPUSearch, setSetup1GPUSearch] = useState('');
  const [setup1RAMSearch, setSetup1RAMSearch] = useState('');

  // Setup 2 State
  const [setup2CPU, setSetup2CPU] = useState('');
  const [setup2GPU, setSetup2GPU] = useState('');
  const [setup2RAM, setSetup2RAM] = useState('');
  const [setup2CPUSearch, setSetup2CPUSearch] = useState('');
  const [setup2GPUSearch, setSetup2GPUSearch] = useState('');
  const [setup2RAMSearch, setSetup2RAMSearch] = useState('');

  // Comparison State
  const [compareGame, setCompareGame] = useState('');
  const [compareGameImage, setCompareGameImage] = useState(null);
  const [compareGameSearch, setCompareGameSearch] = useState('');
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
      } catch (err) {
        console.log("Usuário não logado, os campos permanecerão vazios.");
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

  const handleCompare = async () => {
    if (!setup1CPU || !setup1GPU || !setup1RAM || !setup2CPU || !setup2GPU || !setup2RAM || !compareGame) {
      setError('SYSTEM_WARNING: Preencha todos os campos obrigatórios para análise.');
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
      setError(err.message || 'Erro de telemetria ao processar comparação.');
    } finally {
      setLoading(false);
    }
  };

  const getAdvantage = () => {
    if (!result1 || !result2) return null;
    const diff = result1.avg_fps - result2.avg_fps;
    const isSetup1Winner = diff >= 0;
    const absoluteDiff = Math.abs(diff);
    
    const base = isSetup1Winner ? result2.avg_fps : result1.avg_fps;
    const percent = ((absoluteDiff / base) * 100).toFixed(1);

    return {
      winnerName: isSetup1Winner ? 'SETUP_01' : 'SETUP_02',
      percent,
      diff: absoluteDiff,
      textColor: isSetup1Winner ? 'text-cyan-400' : 'text-[color:var(--secondary-violet,#b600f8)]',
      borderColor: isSetup1Winner ? 'border-cyan-500' : 'border-[color:var(--secondary-violet,#b600f8)]'
    };
  };

  const advantage = getAdvantage();

  // Dados calculados para o gráfico dinâmico
  const maxFpsValue = result1 && result2 ? Math.max(result1.max_fps, result2.max_fps) * 1.15 : 100; // +15% de margem no topo do gráfico

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
        <div className="col-span-12">
          <GlassCard title="SETUP_CONFIGURATION" className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
            <form className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* Setup 1 */}
              <div className="space-y-6">
                <div className="pb-4 border-b border-white/10">
                  <p className="font-label-caps text-[12px] text-cyan-500 tracking-widest">SETUP_01</p>
                </div>

                <HardwareSearchInput
                  label="CPU"
                  placeholder="Buscar CPU..."
                  search={setup1CPUSearch}
                  onSearchChange={setSetup1CPUSearch}
                  results={setup1CpuResults}
                  loading={setup1CpuLoading}
                  selected={setup1CPU}
                  onSelect={(name) => { setSetup1CPU(name); setSetup1CPUSearch(''); }}
                />

                <HardwareSearchInput
                  label="GPU"
                  placeholder="Buscar GPU..."
                  search={setup1GPUSearch}
                  onSearchChange={setSetup1GPUSearch}
                  results={setup1GpuResults}
                  loading={setup1GpuLoading}
                  selected={setup1GPU}
                  onSelect={(name) => { setSetup1GPU(name); setSetup1GPUSearch(''); }}
                />

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
                            onClick={() => { setSetup1RAM(ram); setSetup1RAMSearch(''); }}
                            className="w-full px-4 py-2 text-left text-cyan-300 hover:bg-cyan-500/30 hover:text-cyan-100 transition-colors text-sm"
                          >
                            {ram}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {setup1RAM && <p className="text-xs text-cyan-400 mt-2">✓ {setup1RAM}</p>}
                </div>
              </div>

              {/* Setup 2 */}
              <div className="space-y-6">
                <div className="pb-4 border-b border-white/10">
                  <p className="font-label-caps text-[12px] text-secondary tracking-widest">SETUP_02</p>
                </div>

                <HardwareSearchInput
                  label="CPU"
                  placeholder="Buscar CPU..."
                  search={setup2CPUSearch}
                  onSearchChange={setSetup2CPUSearch}
                  results={setup2CpuResults}
                  loading={setup2CpuLoading}
                  selected={setup2CPU}
                  onSelect={(name) => { setSetup2CPU(name); setSetup2CPUSearch(''); }}
                />

                <HardwareSearchInput
                  label="GPU"
                  placeholder="Buscar GPU..."
                  search={setup2GPUSearch}
                  onSearchChange={setSetup2GPUSearch}
                  results={setup2GpuResults}
                  loading={setup2GpuLoading}
                  selected={setup2GPU}
                  onSelect={(name) => { setSetup2GPU(name); setSetup2GPUSearch(''); }}
                />

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
                            onClick={() => { setSetup2RAM(ram); setSetup2RAMSearch(''); }}
                            className="w-full px-4 py-2 text-left text-[color:var(--secondary-violet,#b600f8)] hover:bg-secondary/30 transition-colors text-sm"
                          >
                            {ram}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {setup2RAM && <p className="text-xs text-secondary mt-2">✓ {setup2RAM}</p>}
                </div>
              </div>
            </form>
          </GlassCard>
        </div>

        {/* GAME SELECTION FOR COMPARISON */}
        <div className="col-span-12 lg:col-span-6">
          <GlassCard title="SELECT_GAME" className="relative min-h-[200px]">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
            <div className="relative z-50 pt-4 flex flex-col h-full">
              <label className="block font-label-caps text-[12px] text-cyan-500 mb-2">GAME_TITLE</label>
              
              <input
                type="text"
                placeholder="Search game..."
                value={compareGameSearch}
                onChange={(e) => setCompareGameSearch(e.target.value)}
                className="w-full bg-transparent border-b border-white/20 focus:border-cyan-400 py-3 px-0 text-white font-body-md outline-none transition-all placeholder:text-slate-600"
              />
              
              {compareGameLoading && <p className="text-xs text-slate-500 mt-2">Buscando na database...</p>}
              
              {/* DROPDOWN COM IMAGENS */}
              {compareGameSearch && !compareGameLoading && compareGameResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-slate-900 border border-cyan-500/40 rounded mt-2 max-h-64 overflow-y-auto z-50 shadow-2xl">
                  {compareGameResults.map((game) => (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => { 
                        setCompareGame(game.name); 
                        setCompareGameImage(game.image_url);
                        setCompareGameSearch(''); 
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-cyan-500/20 transition-colors border-b border-white/5 flex items-center gap-3 group"
                    >
                      {game.image_url ? (
                        <img src={game.image_url} alt={game.name} className="w-8 h-10 object-cover rounded opacity-80 group-hover:opacity-100" />
                      ) : (
                        <div className="w-8 h-10 bg-slate-800 rounded flex items-center justify-center">
                          <span className="material-symbols-outlined text-[16px] text-slate-500">image</span>
                        </div>
                      )}
                      <span className="text-sm text-cyan-300 group-hover:text-cyan-100">{game.name}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {compareGameSearch && !compareGameLoading && compareGameResults.length === 0 && (
                <p className="text-xs text-slate-500 mt-2">Nenhum título encontrado.</p>
              )}

              {/* CARTÃO DO JOGO SELECIONADO */}
              {compareGame && (
                <div className="mt-6 flex items-center gap-4 p-4 bg-slate-900/50 border border-cyan-500/30 rounded-lg">
                  {compareGameImage ? (
                    <img 
                      src={compareGameImage} 
                      alt={compareGame} 
                      className="w-14 h-20 object-cover rounded shadow-[0_0_15px_rgba(0,240,255,0.2)]" 
                    />
                  ) : (
                    <div className="w-14 h-20 bg-slate-800 rounded border border-white/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-500">sports_esports</span>
                    </div>
                  )}
                  <div>
                    <p className="font-label-caps text-[10px] text-cyan-500 mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">check_circle</span>
                      SELECTED_TARGET
                    </p>
                    <p className="font-headline-md text-white">{compareGame}</p>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* COMPARE BUTTON */}
        <div className="col-span-12 lg:col-span-6">
          <GlassCard title="ACTION" className="relative overflow-hidden h-full flex flex-col justify-end">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
            <button
              onClick={handleCompare}
              disabled={loading}
              className="w-full h-16 bg-gradient-to-r from-cyan-400 to-secondary text-slate-950 font-label-caps text-sm font-bold tracking-[0.3em] rounded transition-transform active:scale-[0.98] shadow-[0_0_30px_rgba(0,240,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
            >
              {loading ? 'ANALYZING TELEMETRY...' : 'COMPARE PERFORMANCE'}
            </button>
          </GlassCard>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="col-span-12">
            <GlassCard className="relative overflow-hidden bg-red-900/20 border border-red-500/40">
              <p className="text-red-400 text-sm font-label-caps tracking-widest">{error}</p>
            </GlassCard>
          </div>
        )}

        {/* COMPARISON RESULTS */}
        {result1 && result2 && advantage && (
          <>
            {/* VANTAGEM GERAL */}
            <div className="col-span-12">
              <GlassCard title="PERFORMANCE_ADVANTAGE" className={`relative overflow-hidden border ${advantage.borderColor}`}>
                <div className={`absolute top-0 left-0 w-1 h-full bg-current ${advantage.textColor}`}></div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-4">
                  <div>
                    <p className={`font-label-caps text-[12px] mb-2 ${advantage.textColor}`}>
                      {advantage.winnerName} ADVANTAGE
                    </p>
                    <p className={`text-6xl font-data-display ${advantage.textColor}`}>
                      +{advantage.percent}%
                    </p>
                  </div>
                  <div className="hidden md:block w-px h-16 bg-white/10"></div>
                  <div className="text-left md:text-right">
                    <p className="font-label-caps text-[12px] text-slate-500 mb-2">RAW FPS DIFFERENCE</p>
                    <p className={`text-5xl font-data-display ${advantage.textColor}`}>
                      {advantage.diff} <span className="text-sm font-label-caps text-slate-400">FPS</span>
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* GRÁFICO VISUAL (Construído via Tailwind CSS) */}
            <div className="col-span-12">
              <GlassCard title="VISUAL_BENCHMARK_ANALYSIS" className="relative overflow-hidden pt-8">
                <div className="absolute top-0 left-0 w-1 h-full bg-slate-500"></div>
                
                {/* Legenda do Gráfico */}
                <div className="flex justify-center gap-8 mb-8">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(0,240,255,0.6)]"></div>
                    <span className="font-label-caps text-[10px] text-slate-400">SETUP_01</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-secondary rounded-full shadow-[0_0_8px_var(--secondary-violet)]"></div>
                    <span className="font-label-caps text-[10px] text-slate-400">SETUP_02</span>
                  </div>
                </div>

                {/* Área do Gráfico de Barras */}
                <div className="flex h-56 items-end justify-around gap-2 px-2 md:px-12 border-b border-white/10 pb-4 relative">
                  
                  {/* Linhas de Grade de Fundo (Opcional, dá um ar mais técnico) */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 border-t border-white/10">
                    <div className="w-full border-b border-dashed border-white/30 h-1/4"></div>
                    <div className="w-full border-b border-dashed border-white/30 h-1/4"></div>
                    <div className="w-full border-b border-dashed border-white/30 h-1/4"></div>
                  </div>

                  {/* Grupo 1: 1% LOW (MIN) */}
                  <div className="flex flex-col items-center gap-3 w-full z-10">
                    <div className="flex items-end gap-1 md:gap-3 w-full h-48 justify-center">
                      <div 
                        className="w-8 md:w-16 bg-cyan-400/80 hover:bg-cyan-400 transition-all rounded-t-sm flex justify-center group relative" 
                        style={{ height: `${(result1.min_fps / maxFpsValue) * 100}%` }}
                      >
                        <span className="absolute -top-6 font-data-display text-sm text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">{result1.min_fps}</span>
                      </div>
                      <div 
                        className="w-8 md:w-16 bg-secondary/80 hover:bg-secondary transition-all rounded-t-sm flex justify-center group relative" 
                        style={{ height: `${(result2.min_fps / maxFpsValue) * 100}%` }}
                      >
                        <span className="absolute -top-6 font-data-display text-sm text-secondary opacity-0 group-hover:opacity-100 transition-opacity">{result2.min_fps}</span>
                      </div>
                    </div>
                    <span className="font-label-caps text-[10px] md:text-xs text-slate-400">1% LOW (MIN)</span>
                  </div>

                  {/* Grupo 2: AVERAGE */}
                  <div className="flex flex-col items-center gap-3 w-full z-10">
                    <div className="flex items-end gap-1 md:gap-3 w-full h-48 justify-center">
                      <div 
                        className="w-8 md:w-16 bg-cyan-400/80 hover:bg-cyan-400 transition-all rounded-t-sm flex justify-center group relative shadow-[0_0_15px_rgba(0,240,255,0.3)]" 
                        style={{ height: `${(result1.avg_fps / maxFpsValue) * 100}%` }}
                      >
                        <span className="absolute -top-6 font-data-display text-sm text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">{result1.avg_fps}</span>
                      </div>
                      <div 
                        className="w-8 md:w-16 bg-secondary/80 hover:bg-secondary transition-all rounded-t-sm flex justify-center group relative shadow-[0_0_15px_var(--secondary-violet)]" 
                        style={{ height: `${(result2.avg_fps / maxFpsValue) * 100}%` }}
                      >
                        <span className="absolute -top-6 font-data-display text-sm text-secondary opacity-0 group-hover:opacity-100 transition-opacity">{result2.avg_fps}</span>
                      </div>
                    </div>
                    <span className="font-label-caps text-[10px] md:text-xs text-white font-bold">AVERAGE</span>
                  </div>

                  {/* Grupo 3: PEAK (MAX) */}
                  <div className="flex flex-col items-center gap-3 w-full z-10">
                    <div className="flex items-end gap-1 md:gap-3 w-full h-48 justify-center">
                      <div 
                        className="w-8 md:w-16 bg-cyan-400/80 hover:bg-cyan-400 transition-all rounded-t-sm flex justify-center group relative" 
                        style={{ height: `${(result1.max_fps / maxFpsValue) * 100}%` }}
                      >
                        <span className="absolute -top-6 font-data-display text-sm text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">{result1.max_fps}</span>
                      </div>
                      <div 
                        className="w-8 md:w-16 bg-secondary/80 hover:bg-secondary transition-all rounded-t-sm flex justify-center group relative" 
                        style={{ height: `${(result2.max_fps / maxFpsValue) * 100}%` }}
                      >
                        <span className="absolute -top-6 font-data-display text-sm text-secondary opacity-0 group-hover:opacity-100 transition-opacity">{result2.max_fps}</span>
                      </div>
                    </div>
                    <span className="font-label-caps text-[10px] md:text-xs text-slate-400">PEAK (MAX)</span>
                  </div>

                </div>
              </GlassCard>
            </div>

            {/* Resultado Setup 1 (Detalhes) */}
            <div className="col-span-12 lg:col-span-6">
              <GlassCard title="SETUP_01_DETAILS" className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                <div className="space-y-6">
                  <div className="flex items-baseline gap-3">
                    <p className="font-label-caps text-[11px] text-slate-500">AVG</p>
                    <p className="text-4xl font-data-display text-cyan-400">{result1.avg_fps}</p>
                  </div>
                  <div className="p-4 bg-black/30 rounded mt-4 border border-white/5">
                    <p className="text-xs text-slate-400 leading-relaxed font-label-caps tracking-widest">
                      <span className="text-cyan-400">CPU:</span> {setup1CPU}<br />
                      <span className="text-cyan-400">GPU:</span> {setup1GPU}<br />
                      <span className="text-cyan-400">RAM:</span> {setup1RAM}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Resultado Setup 2 (Detalhes) */}
            <div className="col-span-12 lg:col-span-6">
              <GlassCard title="SETUP_02_DETAILS" className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
                <div className="space-y-6">
                  <div className="flex items-baseline gap-3">
                    <p className="font-label-caps text-[11px] text-slate-500">AVG</p>
                    <p className="text-4xl font-data-display text-secondary">{result2.avg_fps}</p>
                  </div>
                  <div className="p-4 bg-black/30 rounded mt-4 border border-white/5">
                    <p className="text-xs text-slate-400 leading-relaxed font-label-caps tracking-widest">
                      <span className="text-secondary">CPU:</span> {setup2CPU}<br />
                      <span className="text-secondary">GPU:</span> {setup2GPU}<br />
                      <span className="text-secondary">RAM:</span> {setup2RAM}
                    </p>
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