import { useState, useEffect } from 'react';
import DashboardGrid from '../components/DashboardGrid';
import GlassCard from '../components/GlassCard';
import { HardwareSearchInput } from '../components/HardwareSearchInput';
import * as llmAPI from '../api/llm';
import * as userAPI from '../api/user';
import * as gamesAPI from '../api/games'; // Importação para salvar o jogo
import { useGameSearch } from '../hooks/useGameSearch';
import { useCpuSearch, useGpuSearch } from '../hooks/useHardwareSearch';
import { filterRamOptions } from '../utils/filterRam';

export default function Estimate() {
  const [selectedGame, setSelectedGame] = useState('');
  const [selectedGameId, setSelectedGameId] = useState(''); // State para o UUID do jogo
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
        console.log("Hardware prévio não carregado (Guest ou não logado).");
      }
    };

    loadUserHardware();
  }, []); 

  const [rams] = useState([
    '128GB DDR5', '64GB DDR5', '32GB DDR5', '16GB DDR5', '8GB DDR5', '4GB DDR5',
    '128GB DDR4', '64GB DDR4', '32GB DDR4', '16GB DDR4', '8GB DDR4', '4GB DDR4',
    '128GB DDR3', '64GB DDR3', '32GB DDR3', '16GB DDR3', '8GB DDR3', '4GB DDR3',
  ]);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
  ]);

  const { results: gameSearchResults, loading: gameSearchLoading } = useGameSearch(gameSearch, 10);
  const { results: cpuSearchResults, loading: cpuSearchLoading } = useCpuSearch(cpuSearch, 10);
  const { results: gpuSearchResults, loading: gpuSearchLoading } = useGpuSearch(gpuSearch, 10);
  const filteredRams = filterRamOptions(rams, ramSearch, 10);

  // Submeter formulário
  const handleEstimate = async (e) => {
    e.preventDefault();

    if (!selectedGame || !selectedGameId || !selectedGPU || !selectedCPU || !selectedRAM) {
      setError('SYSTEM_WARNING: Preencha todos os dados de telemetria e selecione o jogo da lista.');
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

      // 1. Calcula o FPS usando a API
      const data = await llmAPI.estimate_fps(estimateData);
      setResult(data);

      // 2. Tenta salvar o resultado na Neural Library do usuário
      try {
        await gamesAPI.add_user_game({
          game_name: selectedGame,
          game_id: selectedGameId, // Enviando o UUID obrigatório
          preset: selectedPreset,
          resolution: selectedResolution,
          upscaling: 'DLSS',
          avg_fps: Math.round(data.avg_fps), // Convertendo para integer conforme o DB
          min_fps: Math.round(data.min_fps),
          max_fps: Math.round(data.max_fps)
        });
      } catch (saveErr) {
        console.error("Erro ao salvar na biblioteca:", saveErr.response?.data || saveErr.message);
      }

      // 3. Atualiza o histórico visual da sessão atual
      setRecentEstimates((prev) => [
        {
          id: Date.now(),
          name: selectedGame,
          specs: `${selectedResolution} • ${selectedGPU.split(' ').pop()} • ${selectedPreset}`,
          fps: Math.round(data.avg_fps) || 0,
          color: 'cyan',
        },
        ...prev.slice(0, 2),
      ]);
    } catch (err) {
      setError(err.message || 'Erro na comunicação com a API de predição.');
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
        {/* RESULTADO DA ESTIMATIVA (Ocupa 4 colunas na esquerda) */}
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

        {/* BENTO INPUT FORM (Ocupa 8 colunas na direita) */}
        <div className="col-span-12 lg:col-span-8">
          <GlassCard title="HARDWARE_SPECIFICATIONS" className="relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
            <form onSubmit={handleEstimate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Game Selection (COM CAPAS) */}
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
                  {gameSearchLoading && <p className="text-xs text-slate-500 mt-2">Buscando na database...</p>}
                  
                  {/* DROPDOWN COM IMAGENS */}
                  {gameSearch && !gameSearchLoading && gameSearchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-slate-900 border border-cyan-500/40 rounded mt-2 max-h-64 overflow-y-auto z-50 shadow-2xl">
                      {gameSearchResults.map((game) => (
                        <button
                          key={game.id}
                          type="button"
                          onClick={() => { 
                            setSelectedGame(game.name); 
                            setSelectedGameId(game.id); // Guardando o ID único
                            setSelectedGameImage(game.image_url);
                            setGameSearch(''); 
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
                </div>

                {/* CARTÃO DO JOGO SELECIONADO */}
                {selectedGame && (
                  <div className="mt-4 flex items-center gap-4 p-4 bg-slate-900/50 border border-cyan-500/30 rounded-lg">
                    {selectedGameImage ? (
                      <img 
                        src={selectedGameImage} 
                        alt={selectedGame} 
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
                      <p className="font-headline-md text-white">{selectedGame}</p>
                    </div>
                  </div>
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

              {/* CPU e GPU Components */}
              <HardwareSearchInput
                label="PROCESSOR_UNIT (CPU)"
                placeholder="Buscar modelo de CPU..."
                search={cpuSearch}
                onSearchChange={setCpuSearch}
                results={cpuSearchResults}
                loading={cpuSearchLoading}
                selected={selectedCPU}
                onSelect={(name) => { setSelectedCPU(name); setCpuSearch(''); }}
              />

              <HardwareSearchInput
                label="GRAPHICS_UNIT (GPU)"
                placeholder="Buscar modelo de GPU..."
                search={gpuSearch}
                onSearchChange={setGpuSearch}
                results={gpuSearchResults}
                loading={gpuSearchLoading}
                selected={selectedGPU}
                onSelect={(name) => { setSelectedGPU(name); setGpuSearch(''); }}
              />

              {/* Memory */}
              <div className="col-span-1 md:col-span-2">
                <label className="block font-label-caps text-[12px] text-cyan-500 mb-2">
                  SYSTEM_MEMORY (RAM)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar capacidade e tipo..."
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

              {/* Error Message */}
              {error && (
                <div className="col-span-1 md:col-span-2 p-4 bg-red-900/20 border border-red-500/40 rounded text-red-400 text-sm font-label-caps">
                  {error}
                </div>
              )}

              {/* CTA Button */}
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

        {/* HISTÓRICO DE ANÁLISES */}
        <div className="col-span-12">
          <GlassCard title="RECENT_ANALYSIS_LOG">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentEstimates.map((est) => (
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
              ))}
            </div>
          </GlassCard>
        </div>
      </DashboardGrid>
    </div>
  );
}