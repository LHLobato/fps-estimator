import { useState } from 'react';
import DashboardGrid from '../components/DashboardGrid';
import GlassCard from '../components/GlassCard';
import { HardwareSearchInput } from '../components/HardwareSearchInput';
import * as llmAPI from '../api/llm';
import { useGameSearch } from '../hooks/useGameSearch';
import { useCpuSearch, useGpuSearch } from '../hooks/useHardwareSearch';
import { filterRamOptions } from '../utils/filterRam';

export default function Compare() {
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
  const [compareGameSearch, setCompareGameSearch] = useState('');
  const [result1, setResult1] = useState(null);
  const [result2, setResult2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { results: compareGameResults, loading: compareGameLoading } = useGameSearch(
    compareGameSearch,
    10,
  );
  const { results: setup1CpuResults, loading: setup1CpuLoading } = useCpuSearch(setup1CPUSearch, 10);
  const { results: setup1GpuResults, loading: setup1GpuLoading } = useGpuSearch(setup1GPUSearch, 10);
  const { results: setup2CpuResults, loading: setup2CpuLoading } = useCpuSearch(setup2CPUSearch, 10);
  const { results: setup2GpuResults, loading: setup2GpuLoading } = useGpuSearch(setup2GPUSearch, 10);
  const filteredSetup1RAMs = filterRamOptions(rams, setup1RAMSearch, 10);
  const filteredSetup2RAMs = filterRamOptions(rams, setup2RAMSearch, 10);

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

                <HardwareSearchInput
                  label="CPU"
                  placeholder="Buscar CPU..."
                  search={setup1CPUSearch}
                  onSearchChange={setSetup1CPUSearch}
                  results={setup1CpuResults}
                  loading={setup1CpuLoading}
                  selected={setup1CPU}
                  onSelect={(name) => {
                    setSetup1CPU(name);
                    setSetup1CPUSearch('');
                  }}
                />

                <HardwareSearchInput
                  label="GPU"
                  placeholder="Buscar GPU..."
                  search={setup1GPUSearch}
                  onSearchChange={setSetup1GPUSearch}
                  results={setup1GpuResults}
                  loading={setup1GpuLoading}
                  selected={setup1GPU}
                  onSelect={(name) => {
                    setSetup1GPU(name);
                    setSetup1GPUSearch('');
                  }}
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

                <HardwareSearchInput
                  label="CPU"
                  placeholder="Buscar CPU..."
                  search={setup2CPUSearch}
                  onSearchChange={setSetup2CPUSearch}
                  results={setup2CpuResults}
                  loading={setup2CpuLoading}
                  selected={setup2CPU}
                  onSelect={(name) => {
                    setSetup2CPU(name);
                    setSetup2CPUSearch('');
                  }}
                />

                <HardwareSearchInput
                  label="GPU"
                  placeholder="Buscar GPU..."
                  search={setup2GPUSearch}
                  onSearchChange={setSetup2GPUSearch}
                  results={setup2GpuResults}
                  loading={setup2GpuLoading}
                  selected={setup2GPU}
                  onSelect={(name) => {
                    setSetup2GPU(name);
                    setSetup2GPUSearch('');
                  }}
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
              {compareGameLoading && (
                <p className="text-xs text-slate-500 mt-2">Buscando jogos...</p>
              )}
              {compareGameSearch && !compareGameLoading && compareGameResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-slate-900 border border-cyan-500/40 rounded mt-2 max-h-48 overflow-y-auto z-50">
                  {compareGameResults.map((game) => (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => {
                        setCompareGame(game.name);
                        setCompareGameSearch('');
                      }}
                      className="w-full px-4 py-2 text-left text-cyan-300 hover:bg-cyan-500/30 hover:text-cyan-100 transition-colors text-sm"
                    >
                      {game.name}
                    </button>
                  ))}
                </div>
              )}
              {compareGameSearch && !compareGameLoading && compareGameResults.length === 0 && (
                <p className="text-xs text-slate-500 mt-2">Nenhum jogo encontrado.</p>
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
