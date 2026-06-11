import { useState, useEffect } from 'react';
import { GlassPanel } from '../components/GlassPanel';
import { useNavigate } from 'react-router-dom';
import * as userAPI from '../api/user';
import { useCpuSearch, useGpuSearch } from '../hooks/useHardwareSearch';
import { filterRamOptions } from '../utils/filterRam';
import * as gamesAPI from '../api/games';

export default function User() {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const [systemConfig, setSystemConfig] = useState({
    cpu: '',
    gpu: '',
    ram: ''
  });
  const [editingFields, setEditingFields] = useState(() => new Set());
  const [modifiedFields, setModifiedFields] = useState(() => new Set());

  const [rams] = useState([
    '128GB DDR5', '64GB DDR5', '32GB DDR5', '16GB DDR5', '8GB DDR5', '4GB DDR5',
    '128GB DDR4', '64GB DDR4', '32GB DDR4', '16GB DDR4', '8GB DDR4', '4GB DDR4',
    '128GB DDR3', '64GB DDR3', '32GB DDR3', '16GB DDR3', '8GB DDR3', '4GB DDR3',
  ]);

  // Estado de busca
  const [cpuSearch, setCpuSearch] = useState('');
  const [gpuSearch, setGpuSearch] = useState('');
  const [ramSearch, setRamSearch] = useState('');

  // Estado dos jogos
  const [games, setGames] = useState([]);
  const [userGames, setUserGames] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingGames, setLoadingGames] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Carregar dados do usuário e hardware
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingUser(true);
        const [user, gamesList] = await Promise.all([
          userAPI.get_current_user(),
          gamesAPI.get_all_games_info(),
        ]);

        setUserData(user);
        setSystemConfig({
          cpu: user.cpu || '',
          gpu: user.gpu || '',
          ram: user.ram || ''
        });

        // Processar jogos globais para uso no fallback
        if (gamesList.games && Array.isArray(gamesList.games)) {
          setGames(gamesList.games);
        }
      } catch (err) {
        setError('Error loading profile data');
        console.error('Full error:', err);
      } finally {
        setLoadingUser(false);
      }
    };

    loadData();
  }, []);

  // Carregar jogos do usuário
  useEffect(() => {
    const loadUserGames = async () => {
      try {
        setLoadingGames(true);
        const response = await gamesAPI.get_user_games();
        if (response.items) {
          setUserGames(response.items);
        }
      } catch (err) {
        console.error('Error loading user games:', err);
      } finally {
        setLoadingGames(false);
      }
    };

    loadUserGames();
  }, []);

  const cpuFieldActive = editingFields.has('cpu');
  const gpuFieldActive = editingFields.has('gpu');
  const { results: cpuSearchResults, loading: cpuSearchLoading } = useCpuSearch(
    cpuFieldActive ? cpuSearch : '',
    10,
  );
  const { results: gpuSearchResults, loading: gpuSearchLoading } = useGpuSearch(
    gpuFieldActive ? gpuSearch : '',
    10,
  );
  const ramSearchResults = filterRamOptions(
    rams,
    editingFields.has('ram') ? ramSearch : '',
    10,
  );

  const markFieldModified = (field) => {
    setModifiedFields((prev) => new Set(prev).add(field));
  };

  const startEditing = (field) => {
    setEditingFields((prev) => new Set(prev).add(field));
    markFieldModified(field);
    if (field === 'cpu') setCpuSearch('');
    if (field === 'gpu') setGpuSearch('');
    if (field === 'ram') setRamSearch('');
  };

  const clearEditSession = () => {
    setEditingFields(new Set());
    setModifiedFields(new Set());
    setCpuSearch('');
    setGpuSearch('');
    setRamSearch('');
  };

  const hasPendingChanges = modifiedFields.size > 0;

  const handleConfigChange = (field, value) => {
    setSystemConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderHardwareField = ({
    field,
    label,
    placeholder,
    search,
    setSearch,
    searchResults,
    searchLoading,
    configValue,
  }) => {
    const isEditing = editingFields.has(field);
    const isModified = modifiedFields.has(field);
    const showSelected = isModified && configValue;
    const readOnlyDisplay = isModified ? '' : (configValue || 'Click to select...');

    const finishSelection = (item) => {
      handleConfigChange(field, item);
      setSearch('');
      setEditingFields((prev) => {
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
    };

    return (
      <div className="space-y-2">
        <label className="block font-label-caps text-[12px] text-cyan-500 mb-2">{label}</label>
        {isEditing ? (
          <div className="relative">
            <input
              type="text"
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full bg-transparent border-b border-white/20 focus:border-cyan-400 py-3 px-0 text-white font-body-md outline-none transition-all placeholder:text-slate-600"
            />
            {searchLoading && (
              <p className="text-xs text-slate-500 mt-2">Buscando...</p>
            )}
            {search && !searchLoading && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-slate-900 border border-cyan-500/40 rounded mt-2 max-h-48 overflow-y-auto z-50">
                {searchResults.map((item) => {
                  const name = typeof item === 'string' ? item : item.name;
                  const key = typeof item === 'string' ? item : item.id;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => finishSelection(name)}
                      className="w-full px-4 py-2 text-left text-cyan-300 hover:bg-cyan-500/30 hover:text-cyan-100 transition-colors text-sm"
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            )}
            {search && !searchLoading && searchResults.length === 0 && (
              <p className="text-xs text-slate-500 mt-2">Nenhum resultado encontrado.</p>
            )}
          </div>
        ) : (
          <div onClick={() => startEditing(field)} className="relative group cursor-pointer">
            <input
              type="text"
              value={readOnlyDisplay}
              readOnly
              placeholder={isModified ? placeholder : undefined}
              className="w-full bg-transparent border-b border-white/20 py-3 px-0 text-white font-body-md outline-none cursor-pointer placeholder:text-slate-600"
            />
            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-cyan-400 group-hover:w-full transition-all duration-300" />
          </div>
        )}
        {showSelected && (
          <p className="text-xs text-cyan-400">Selecionado: {configValue}</p>
        )}
      </div>
    );
  };

  // Atualizar configuração do sistema
  const handleUpdateSystem = async () => {
    if (!systemConfig.cpu || !systemConfig.gpu || !systemConfig.ram) {
      setError('Preencha todos os campos de hardware');
      return;
    }

    try {
      setError('');
      setSuccess('');
      const updated = await userAPI.edit_user_setup(systemConfig);
      setUserData(updated);
      clearEditSession();
      setSuccess('Configuração de hardware atualizada com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d) => d.msg).join('; '));
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError(err.message || 'Erro ao atualizar configuração');
      }
    }
  };

  // Calcula a média de FPS baseada na biblioteca do usuário
  const avgLibraryFps = userGames.length > 0 
    ? Math.round(userGames.reduce((acc, curr) => acc + curr.avg_fps, 0) / userGames.length)
    : 0;

  return (
    <div className="w-full">
      {/* Hero Title */}
      <div className="mb-10">
        <h1 className="font-headline-xl text-cyan-400 mb-2 uppercase">Neural Library</h1>
        <p className="font-body-lg text-on-surface-variant max-w-2xl">
          {loadingUser ? 'Loading profile...' : `Welcome, ${userData?.name || userData?.email || 'Usuário'}!`}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/40 rounded">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-900/20 border border-green-500/40 rounded">
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      {/* Dashboard Bento Grid */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Section 1: Current Rig Configuration (Editable) */}
        <section className="col-span-12 lg:col-span-8 glass-panel rounded-xl overflow-hidden flex flex-col">
          <div className="header-bar px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-cyan-400">memory</span>
              <h3 className="font-label-caps text-on-surface">Current Rig Configuration</h3>
            </div>
            <span className="font-label-caps text-[10px] text-cyan-400/50">USER_ID: {userData?.id?.slice(0, 8)}</span>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {renderHardwareField({
              field: 'cpu',
              label: 'PROCESSOR_UNIT (CPU)',
              placeholder: 'Buscar CPU...',
              search: cpuSearch,
              setSearch: setCpuSearch,
              searchResults: cpuSearchResults,
              searchLoading: cpuSearchLoading,
              configValue: systemConfig.cpu,
            })}
            {renderHardwareField({
              field: 'gpu',
              label: 'GRAPHICS_UNIT (GPU)',
              placeholder: 'Buscar GPU...',
              search: gpuSearch,
              setSearch: setGpuSearch,
              searchResults: gpuSearchResults,
              searchLoading: gpuSearchLoading,
              configValue: systemConfig.gpu,
            })}
            {renderHardwareField({
              field: 'ram',
              label: 'SYSTEM_MEMORY (RAM)',
              placeholder: 'Buscar RAM...',
              search: ramSearch,
              setSearch: setRamSearch,
              searchResults: ramSearchResults,
              searchLoading: false,
              configValue: systemConfig.ram,
            })}
          </div>

          <div className="px-8 pb-8 flex justify-end gap-3">
            {hasPendingChanges && (
              <button
                onClick={() => {
                  clearEditSession();
                  setSystemConfig({
                    cpu: userData?.cpu || '',
                    gpu: userData?.gpu || '',
                    ram: userData?.ram || '',
                  });
                }}
                className="bg-slate-700 text-white font-label-caps py-3 px-8 rounded-lg font-bold hover:bg-slate-600 transition-all active:scale-95"
              >
                CANCEL
              </button>
            )}
            <button
              onClick={handleUpdateSystem}
              disabled={!hasPendingChanges}
              className="bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 font-label-caps py-3 px-8 rounded-lg font-bold hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              UPDATE SYSTEM ARCHITECTURE
            </button>
          </div>
        </section>

        {/* Section 3: Performance History */}
        <section className="col-span-12 lg:col-span-4 glass-panel rounded-xl overflow-hidden flex flex-col">
          <div className="header-bar px-6 py-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-violet-400">history</span>
            <h3 className="font-label-caps text-on-surface">Performance History</h3>
          </div>

          <div className="p-6 space-y-6 flex-1 flex flex-col">
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-white/5 pb-2">
                <div>
                  <p className="font-label-caps text-[10px] text-slate-500">TOTAL_GAMES</p>
                  <p className="font-body-md text-on-surface">Estimates</p>
                </div>
                <div className="text-right">
                  <p className="font-data-display text-2xl text-cyan-400">
                    {userGames.length || 0} <span className="text-xs font-label-caps">GAMES</span>
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-end border-b border-white/5 pb-2">
                <div>
                  <p className="font-label-caps text-[10px] text-slate-500">SYSTEM STATUS</p>
                  <p className="font-body-md text-on-surface">Configured</p>
                </div>
                <div className="text-right">
                  <p className="font-data-display text-2xl text-violet-400">
                    {systemConfig.cpu && systemConfig.gpu && systemConfig.ram ? '✓ OK' : '✗ INCOMPLETE'}
                  </p>
                </div>
              </div>
            </div>

            {/* Nova Métrica: Média de FPS da Biblioteca */}
            <div className="mt-auto bg-slate-900/50 rounded p-4 border border-white/5">
              <p className="font-label-caps text-[10px] text-slate-500 mb-1">AVERAGE LIBRARY FPS</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-data-display text-cyan-400">{avgLibraryFps}</span>
                <span className="font-label-caps text-xs text-slate-400">FPS</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 mt-3 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-1000"
                  style={{ width: `${Math.min((avgLibraryFps / 144) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-[9px] text-slate-500 font-label-caps mt-2 text-right">BASED ON 144HZ STANDARD</p>
            </div>
          </div>
        </section>

        {/* Section 2: Your Neural Library (Gallery) */}
        <section className="col-span-12 glass-panel rounded-xl overflow-hidden">
          <div className="header-bar px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-cyan-400">grid_view</span>
              <h3 className="font-label-caps text-on-surface">Your Neural Library</h3>
              <span className="font-label-caps text-xs text-slate-500">
                {userGames.length} / {games.length}
              </span>
            </div>
            <button onClick={() => navigate('/')} className="flex items-center gap-2 font-label-caps text-xs text-cyan-400 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-sm">add</span>
              ADD NEW TITLE
            </button>
          </div>

          {loadingGames ? (
            <div className="p-gutter">
              <p className="text-slate-400">Loading games...</p>
            </div>
          ) : userGames.length > 0 ? (
            <div className="p-gutter grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {/* Game Cards - Jogos do Usuário */}
              {userGames.map((game, idx) => {
                // FALLBACK BLINDADO: Cruzamento local de dados
                const catalogGame = games.find((g) => g.id === game.game_id);
                
                // Pega a URL de onde estiver disponível, validando strings nulas
                let finalImageUrl = game.image_url && game.image_url !== 'None' && game.image_url !== 'null'
                  ? game.image_url 
                  : (catalogGame?.image_url && catalogGame.image_url !== 'None' && catalogGame.image_url !== 'null'
                      ? catalogGame.image_url
                      : null);

                // Força o HTTPS se a API tiver retornado links agnósticos (//...)
                if (finalImageUrl && finalImageUrl.startsWith('//')) {
                  finalImageUrl = `https:${finalImageUrl}`;
                }

                return (
                  <div
                    key={idx}
                    onClick={() => navigate('/estimate')}
                    className="group relative aspect-[3/4] rounded-lg overflow-hidden border border-cyan-500/40 hover:border-cyan-400 transition-all bg-slate-900 cursor-pointer"
                  >
                    {finalImageUrl ? (
                      <img
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        src={finalImageUrl}
                        alt={game.game_name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center text-center p-4">
                        <span className="material-symbols-outlined text-slate-600 mb-2 text-2xl">image_not_supported</span>
                        <p className="text-slate-500 text-[10px] font-label-caps tracking-widest">{game.game_name}</p>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-4">
                      <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-label-caps text-[8px] w-fit px-2 py-0.5 rounded-full mb-2 backdrop-blur-sm">
                        FPS: {game.avg_fps}
                      </span>
                      <h4 className="font-headline-md text-sm text-white mb-1 drop-shadow-md">{game.game_name}</h4>
                      <div className="flex justify-between items-center">
                        <span className="font-label-caps text-[9px] text-slate-300 drop-shadow-md">
                          {game.preset} • {game.resolution}
                        </span>
                        <span className="material-symbols-outlined text-cyan-400 text-lg group-hover:translate-x-1 transition-transform drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]">
                          play_arrow
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Placeholder para adicionar novo */}
              <button 
                onClick={() => navigate('/')}
                className="aspect-[3/4] rounded-lg border-2 border-dashed border-cyan-500/20 bg-cyan-500/5 flex flex-col items-center justify-center gap-4 hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all group"
              >
                <div className="w-16 h-16 rounded-full border border-cyan-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl text-cyan-400">add</span>
                </div>
                <span className="font-label-caps text-xs text-slate-400 group-hover:text-cyan-400">ADD NEW TITLE</span>
              </button>
            </div>
          ) : (
            <div className="p-gutter">
              <p className="text-slate-400 text-center py-12">You don't have any estimated games yet. Go to the <strong>Estimate</strong> page to get started!</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}