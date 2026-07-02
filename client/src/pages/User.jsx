import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import * as userAPI from '../api/user';
import * as gamesAPI from '../api/games';
import { useCpuSearch, useGpuSearch } from '../hooks/useHardwareSearch';
import { useAuth } from '../hooks/useAuth';
import { filterRamOptions } from '../utils/filterRam';

const getValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim();
  if (['', 'null', 'none', 'undefined'].includes(clean.toLowerCase())) return null;
  if (clean.startsWith('//')) return `https:${clean}`;
  return clean;
};

const getInitials = (name, email) => {
  const source = name || email || 'User';
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
};

export default function User() {
  const navigate = useNavigate();
  const { user: authenticatedUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [profileDraft, setProfileDraft] = useState({
    name: '',
  });
  const [systemConfig, setSystemConfig] = useState({
    cpu: '',
    gpu: '',
    ram: '',
  });
  const [editingFields, setEditingFields] = useState(() => new Set());
  const [modifiedFields, setModifiedFields] = useState(() => new Set());
  const [profileModified, setProfileModified] = useState(false);

  const [rams] = useState([
    '128GB DDR5', '64GB DDR5', '32GB DDR5', '16GB DDR5', '8GB DDR5', '4GB DDR5',
    '128GB DDR4', '64GB DDR4', '32GB DDR4', '16GB DDR4', '8GB DDR4', '4GB DDR4',
    '128GB DDR3', '64GB DDR3', '32GB DDR3', '16GB DDR3', '8GB DDR3', '4GB DDR3',
  ]);

  const [cpuSearch, setCpuSearch] = useState('');
  const [gpuSearch, setGpuSearch] = useState('');
  const [ramSearch, setRamSearch] = useState('');
  const [userGames, setUserGames] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingGames, setLoadingGames] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const applyUserData = (user) => {
      setUserData(user);
      setProfileDraft({
        name: user.name || '',
      });
      setSystemConfig({
        cpu: user.cpu || '',
        gpu: user.gpu || '',
        ram: user.ram || '',
      });
    };

    const loadData = async () => {
      if (authenticatedUser) {
        applyUserData(authenticatedUser);
        setLoadingUser(false);
        return;
      }

      try {
        setLoadingUser(true);
        const user = await userAPI.get_current_user();
        applyUserData(user);
      } catch (err) {
        setError('Error loading profile data');
        console.error('Full error:', err);
      } finally {
        setLoadingUser(false);
      }
    };

    loadData();
  }, [authenticatedUser]);

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
  const { results: cpuSearchResults, loading: cpuSearchLoading } = useCpuSearch(cpuFieldActive ? cpuSearch : '', 10);
  const { results: gpuSearchResults, loading: gpuSearchLoading } = useGpuSearch(gpuFieldActive ? gpuSearch : '', 10);
  const ramSearchResults = filterRamOptions(rams, editingFields.has('ram') ? ramSearch : '', 10);

  const avgLibraryFps = userGames.length > 0
    ? Math.round(userGames.reduce((acc, curr) => acc + curr.avg_fps, 0) / userGames.length)
    : 0;
  const bestGame = userGames.length > 0
    ? userGames.reduce((best, item) => (item.avg_fps > best.avg_fps ? item : best), userGames[0])
    : null;
  const hardwareComplete = Boolean(systemConfig.cpu && systemConfig.gpu && systemConfig.ram);
  const avatarUrl = getValidImageUrl(userData?.profile_photo);
  const initials = getInitials(profileDraft.name || userData?.name, userData?.email);

  const clearAlerts = () => {
    setError('');
    setSuccess('');
  };

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

  const handleProfileDraftChange = (field, value) => {
    setProfileDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
    setProfileModified(true);
  };

  const handleUpdateProfile = async () => {
    try {
      clearAlerts();
      const updated = await userAPI.edit_user_profile({
        name: profileDraft.name,
      });
      setUserData(updated);
      setProfileDraft({
        name: updated.name || '',
      });
      setProfileModified(false);
      setSuccess('Profile updated successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error updating profile.');
    }
  };

  const handleUpdateSystem = async () => {
    if (!systemConfig.cpu || !systemConfig.gpu || !systemConfig.ram) {
      setError('Fill in all hardware fields.');
      return;
    }

    try {
      clearAlerts();
      const updated = await userAPI.edit_user_setup(systemConfig);
      setUserData(updated);
      clearEditSession();
      setSuccess('Hardware profile updated successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d) => d.msg).join('; '));
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError(err.message || 'Error updating hardware profile.');
      }
    }
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
        <label className="block font-label-caps text-[12px] text-cyan-500">{label}</label>
        {isEditing ? (
          <div className="relative">
            <input
              type="text"
              placeholder={placeholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoFocus
              className="w-full bg-transparent border-b border-white/20 focus:border-cyan-400 py-3 px-0 text-white font-body-md outline-none transition-all placeholder:text-slate-600"
            />
            {searchLoading && <p className="text-xs text-slate-500 mt-2">Searching...</p>}
            {search && !searchLoading && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-48 overflow-y-auto rounded border border-cyan-500/40 bg-slate-900">
                {searchResults.map((item) => {
                  const name = typeof item === 'string' ? item : item.name;
                  const key = typeof item === 'string' ? item : item.id;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => finishSelection(name)}
                      className="w-full border-b border-white/5 px-4 py-3 text-left text-sm text-cyan-300 transition-colors hover:bg-cyan-500/30 hover:text-cyan-100"
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            )}
            {search && !searchLoading && searchResults.length === 0 && (
              <p className="text-xs text-slate-500 mt-2">No results found.</p>
            )}
          </div>
        ) : (
          <button type="button" onClick={() => startEditing(field)} className="group relative w-full text-left">
            <input
              type="text"
              value={readOnlyDisplay}
              readOnly
              placeholder={isModified ? placeholder : undefined}
              className="w-full cursor-pointer bg-transparent border-b border-white/20 py-3 px-0 text-white font-body-md outline-none placeholder:text-slate-600"
            />
            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-cyan-400 transition-all duration-300 group-hover:w-full" />
          </button>
        )}
        {configValue && <p className="text-xs text-cyan-400">Selected: {configValue}</p>}
      </div>
    );
  };

  const renderLibraryGame = (game, idx) => {
    const finalImageUrl = getValidImageUrl(game.image_url);

    return (
      <article
        key={`${game.game_id}-${idx}`}
        className="group grid min-h-32 grid-cols-[112px_minmax(0,1fr)_64px] items-center gap-3 rounded border border-white/5 bg-slate-900/55 p-4 transition-all hover:border-cyan-400/40 hover:bg-slate-900/75 sm:grid-cols-[132px_minmax(0,1fr)_72px] sm:gap-4"
      >
        <div className="relative aspect-[460/215] w-full overflow-hidden rounded bg-slate-950/70">
          <span className="material-symbols-outlined absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 text-slate-600">image_not_supported</span>
          {finalImageUrl && (
            <img
              className="relative z-10 h-full w-full object-contain"
              src={finalImageUrl}
              alt={game.game_name}
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          )}
        </div>
        <div className="min-w-0">
          <span className="mb-2 inline-flex rounded border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 font-label-caps text-[9px] text-cyan-300">
            {game.resolution}
          </span>
          <h4 className="truncate text-base font-semibold text-white">{game.game_name}</h4>
          <p className="mt-1 truncate text-xs text-slate-400">{game.preset} preset</p>
        </div>
        <div className="text-right">
          <span className="block text-4xl font-data-display leading-none text-cyan-400">{Math.round(game.avg_fps)}</span>
          <span className="font-label-caps text-[10px] text-slate-500">FPS</span>
        </div>
      </article>
    );
  };

  return (
    <div className="w-full overflow-x-hidden">
      <div className="mb-6 lg:mb-8">
        <h2 className="font-headline-xl text-4xl text-white tracking-normal sm:text-5xl">
          AVATAR{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-secondary">
            PROFILE
          </span>
        </h2>
        <p className="mt-2 max-w-2xl text-base text-slate-400 sm:text-lg">
          Manage your identity, saved hardware profile and performance library in one place.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded border border-red-500/40 bg-red-900/20 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 rounded border border-green-500/40 bg-green-900/20 p-4 text-sm text-green-400">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(320px,2fr)_minmax(0,3fr)] xl:items-start">
        <div className="space-y-5 xl:sticky xl:top-24">
          <GlassCard title="PLAYER_IDENTITY" className="relative min-h-0 overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-1 bg-cyan-500"></div>
            <div className="flex flex-col items-center gap-5 p-2 text-center">
              <div className="relative h-36 w-36 overflow-hidden rounded border border-cyan-400/30 bg-cyan-500/10 shadow-[inset_0_0_40px_rgba(0,219,233,0.08)]">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={profileDraft.name || userData?.email || 'User avatar'}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-5xl font-data-display text-cyan-300">
                    {initials || 'U'}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p className="font-headline-md text-2xl text-white">{loadingUser ? 'Loading profile...' : (profileDraft.name || userData?.email || 'User')}</p>
                <p className="mt-1 truncate text-sm text-slate-400">{userData?.email || 'Authenticated account'}</p>
              </div>

              <div className="grid w-full grid-cols-2 gap-3">
                <div className="rounded border border-white/10 bg-slate-900/50 p-3">
                  <p className="font-label-caps text-[9px] text-slate-500">LIBRARY</p>
                  <p className="mt-1 text-2xl font-data-display text-cyan-400">{userGames.length}</p>
                </div>
                <div className="rounded border border-white/10 bg-slate-900/50 p-3">
                  <p className="font-label-caps text-[9px] text-slate-500">AVG FPS</p>
                  <p className="mt-1 text-2xl font-data-display text-secondary">{avgLibraryFps}</p>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard title="PROFILE_SETTINGS" className="relative min-h-0">
            <div className="absolute top-0 left-0 h-full w-1 bg-cyan-500"></div>
            <div className="space-y-5">
              <div>
                <label className="block font-label-caps text-[12px] text-cyan-500">DISPLAY_NAME</label>
                <input
                  type="text"
                  value={profileDraft.name}
                  onChange={(event) => handleProfileDraftChange('name', event.target.value)}
                  placeholder="Your display name"
                  className="w-full bg-transparent border-b border-white/20 focus:border-cyan-400 py-3 px-0 text-white font-body-md outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              <button
                type="button"
                onClick={handleUpdateProfile}
                disabled={!profileModified}
                className="h-12 w-full rounded bg-gradient-to-r from-cyan-400 to-secondary px-4 font-label-caps text-xs font-bold tracking-[0.18em] text-slate-950 shadow-[0_0_24px_rgba(0,240,255,0.22)] transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                UPDATE AVATAR PROFILE
              </button>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-5">
          <GlassCard title="CURRENT_RIG_CONFIGURATION" className="relative min-h-0 overflow-visible">
            <div className="absolute top-0 left-0 h-full w-1 bg-cyan-500"></div>
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded border border-white/10 bg-slate-900/50 p-4">
                <p className="font-label-caps text-[9px] text-slate-500">SYSTEM_STATUS</p>
                <p className={`mt-1 text-lg font-bold ${hardwareComplete ? 'text-cyan-400' : 'text-red-400'}`}>
                  {hardwareComplete ? 'CONFIGURED' : 'INCOMPLETE'}
                </p>
              </div>
              <div className="rounded border border-white/10 bg-slate-900/50 p-4">
                <p className="font-label-caps text-[9px] text-slate-500">BEST_LOG</p>
                <p className="mt-1 truncate text-lg font-bold text-white">{bestGame ? `${Math.round(bestGame.avg_fps)} FPS` : 'NO DATA'}</p>
              </div>
              <div className="rounded border border-white/10 bg-slate-900/50 p-4">
                <p className="font-label-caps text-[9px] text-slate-500">CATALOG</p>
                <p className="mt-1 text-lg font-bold text-secondary">{userGames.length} SAVED</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {renderHardwareField({
                field: 'cpu',
                label: 'PROCESSOR_UNIT (CPU)',
                placeholder: 'Search CPU...',
                search: cpuSearch,
                setSearch: setCpuSearch,
                searchResults: cpuSearchResults,
                searchLoading: cpuSearchLoading,
                configValue: systemConfig.cpu,
              })}
              {renderHardwareField({
                field: 'gpu',
                label: 'GRAPHICS_UNIT (GPU)',
                placeholder: 'Search GPU...',
                search: gpuSearch,
                setSearch: setGpuSearch,
                searchResults: gpuSearchResults,
                searchLoading: gpuSearchLoading,
                configValue: systemConfig.gpu,
              })}
              {renderHardwareField({
                field: 'ram',
                label: 'SYSTEM_MEMORY (RAM)',
                placeholder: 'Search RAM...',
                search: ramSearch,
                setSearch: setRamSearch,
                searchResults: ramSearchResults,
                searchLoading: false,
                configValue: systemConfig.ram,
              })}
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row">
              {hasPendingChanges && (
                <button
                  type="button"
                  onClick={() => {
                    clearEditSession();
                    setSystemConfig({
                      cpu: userData?.cpu || '',
                      gpu: userData?.gpu || '',
                      ram: userData?.ram || '',
                    });
                  }}
                  className="h-12 rounded border border-white/10 bg-slate-800 px-6 font-label-caps text-xs font-bold text-white transition-all hover:bg-slate-700 sm:w-44"
                >
                  CANCEL
                </button>
              )}
              <button
                type="button"
                onClick={handleUpdateSystem}
                disabled={!hasPendingChanges}
                className="h-12 flex-1 rounded bg-gradient-to-r from-cyan-400 to-secondary px-4 font-label-caps text-xs font-bold tracking-[0.18em] text-slate-950 shadow-[0_0_24px_rgba(0,240,255,0.22)] transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                UPDATE SYSTEM ARCHITECTURE
              </button>
            </div>
          </GlassCard>

          <GlassCard title="PERFORMANCE_LIBRARY" className="avatar-library-panel">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-400">
                {loadingGames ? 'Loading saved estimates...' : `${userGames.length} saved prediction${userGames.length === 1 ? '' : 's'}`}
              </p>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex h-10 items-center justify-center gap-2 rounded border border-cyan-500/40 bg-cyan-500/10 px-4 font-label-caps text-[10px] text-cyan-300 transition-colors hover:bg-cyan-500 hover:text-slate-950"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                ADD NEW TITLE
              </button>
            </div>

            {loadingGames ? (
              <div className="py-10 text-center text-slate-500">Loading games...</div>
            ) : userGames.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {userGames.map((game, idx) => renderLibraryGame(game, idx))}
              </div>
            ) : (
              <div className="rounded border border-white/10 bg-slate-900/45 p-8 text-center">
                <p className="text-slate-400">You do not have estimated games yet.</p>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="mt-5 h-11 rounded bg-gradient-to-r from-cyan-400 to-secondary px-6 font-label-caps text-xs font-bold text-slate-950"
                >
                  CREATE FIRST ESTIMATE
                </button>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
