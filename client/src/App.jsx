import { useState } from 'react';
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Estimate from './pages/Estimate';
import User from './pages/User';
import Compare from './pages/Compare';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import './App.css';

const APP_LOGO_SRC = '/brand/logo.png';

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Estimator', icon: 'speed' },
    { path: '/compare', label: 'Comparison', icon: 'compare_arrows' },
    { path: '/user', label: 'Profile', icon: 'fingerprint' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('[AUTH] Falha ao encerrar a sessão no servidor:', error);
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 lg:pl-20">
      <aside className="fixed left-0 top-0 z-50 hidden h-full w-20 flex-col border-r border-cyan-500/25 bg-slate-950/70 px-3 py-4 shadow-[20px_0_40px_-22px_rgba(0,0,0,0.75)] backdrop-blur-xl lg:flex">
        <Link
          to="/"
          title="FPS-R"
          aria-label="FPS-R home"
          className="mb-8 flex h-12 w-12 items-center justify-center overflow-hidden rounded border border-cyan-500/40 bg-slate-950 p-2 text-cyan-300 shadow-[0_0_18px_rgba(0,219,233,0.12)]"
        >
          <img src={APP_LOGO_SRC} alt="" className="h-full w-full object-contain" />
        </Link>

        <nav className="flex flex-1 flex-col items-center gap-2">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                aria-label={item.label}
                className={`flex h-12 w-12 items-center justify-center rounded transition-all duration-300 ${
                  active
                    ? 'bg-cyan-500/15 text-cyan-300 shadow-[0_0_22px_rgba(0,219,233,0.18)] ring-1 ring-cyan-400/40'
                    : 'text-slate-400 hover:bg-white/5 hover:text-cyan-200'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm lg:hidden" onClick={closeDrawer}>
          <aside className="h-full w-[min(82vw,320px)] border-r border-cyan-500/30 bg-slate-950 p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-8 flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded border border-cyan-500/40 bg-slate-950 p-2 shadow-[0_0_18px_rgba(0,219,233,0.12)]">
                  <img src={APP_LOGO_SRC} alt="" className="h-full w-full object-contain" />
                </div>
                <div className="min-w-0">
                  <p className="mt-1 font-label-caps text-[10px] tracking-widest text-slate-500">V.0.1_STABLE</p>
                </div>
              </div>
              <button onClick={closeDrawer} className="flex h-10 w-10 items-center justify-center rounded bg-white/5 text-slate-300">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeDrawer}
                  className={`flex h-12 items-center gap-3 rounded px-4 ${
                    location.pathname === item.path ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400 hover:bg-white/5 hover:text-cyan-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[21px]">{item.icon}</span>
                  <span className="font-label-caps text-xs">{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-3 border-b border-cyan-500/20 bg-slate-950/70 px-4 shadow-2xl shadow-cyan-900/20 backdrop-blur-md md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => setDrawerOpen(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-white/10 bg-white/5 text-cyan-300 lg:hidden">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="min-w-0">
              <span className="block truncate font-['Space_Grotesk'] text-sm font-bold tracking-widest text-white sm:text-lg">FRAME_ANALYSIS_CMD</span>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-label-caps text-[10px] text-cyan-400">STATUS: CALIBRATED</span>
                <span className="hidden font-label-caps text-[10px] text-secondary sm:inline animate-pulse">
              {user?.name ? `USER: ${user.name.toUpperCase()}` : 'GUEST_ACCESS_MODE'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
              <button 
                onClick={handleLogout}
              className="h-10 rounded bg-gradient-to-r from-cyan-400 to-secondary px-4 font-label-caps text-[10px] font-bold tracking-widest text-slate-950 transition-opacity hover:opacity-90 sm:px-6"
              >
                LOGOUT
              </button>
          </div>
        </header>

        <main className="relative z-10 flex-1 overflow-x-hidden pb-20 md:pb-10">
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            <div className="absolute left-[-12rem] top-[-10rem] h-[28rem] w-[28rem] rounded-full bg-cyan-900/20 blur-[120px]"></div>
            <div className="absolute bottom-[-12rem] right-[-12rem] h-[28rem] w-[28rem] rounded-full bg-purple-900/10 blur-[120px]"></div>
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
            <Routes>
              <Route path="/" element={<ProtectedRoute><Estimate /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/compare" element={<ProtectedRoute><Compare /></ProtectedRoute>} />
              <Route path="/user" element={<ProtectedRoute><User /></ProtectedRoute>} />
            </Routes>
          </div>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-50 grid h-16 grid-cols-3 border-t border-cyan-500/20 bg-slate-950/90 px-2 backdrop-blur-xl lg:hidden">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`flex flex-col items-center justify-center gap-1 ${active ? 'text-cyan-300' : 'text-slate-500'}`}>
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                <span className="font-label-caps text-[9px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <footer className="sticky bottom-0 z-40 hidden h-8 items-center justify-between border-t border-white/5 bg-slate-900/80 px-6 backdrop-blur-sm lg:flex">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
              <span className="font-label-caps text-[9px] text-slate-400">DATABASE_SYNC: SUCCESS</span>
            </div>
            <span className="font-label-caps text-[9px] text-slate-600">|</span>
            <span className="font-label-caps text-[9px] text-slate-400">LATENCY: 14MS</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-label-caps text-[9px] text-slate-400">ENCRYPTION: AES-256</span>
            <span className="font-label-caps text-[9px] text-cyan-500">
              USER: {user?.name ? user.name.toUpperCase() : (user?.email ? user.email.split('@')[0].toUpperCase() : 'GUEST')}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function App() {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  // Se ainda está carregando, mostrar loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-cyan-400 font-label-caps">INITIALIZING...</p>
        </div>
      </div>
    );
  }

  // Se estiver em /login ou /signup e JÁ está autenticado, redirecionar para /
  if ((location.pathname === '/login' || location.pathname === '/signup') && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Se estiver em /login ou /signup e NÃO está autenticado, mostrar sem layout
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return location.pathname === '/login' ? <Login /> : <SignUp />;
  }

  // Caso contrário, mostrar com layout (AppLayout faz a verificação de autenticação)
  return <AppLayout />;
}

export default App;
