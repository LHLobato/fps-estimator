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

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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

  return (
    <div className="flex h-screen bg-slate-950">
      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-cyan-500/30 bg-slate-950/40 backdrop-blur-xl shadow-[20px_0_40px_-15px_rgba(0,0,0,0.5)] z-50 flex flex-col">
        {/* Logo */}
        <div className="px-2 pt-2 mx-2">
          <h1 className="text-2xl font-black tracking-tighter text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.5)] font-['Space_Grotesk'] tracking-wider uppercase">
            FPS_CORE
          </h1>
          <p className="text-[10px] text-slate-500 font-label-caps mt-1 tracking-widest">V.0.1_STABLE</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 mt-6 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-5 h-12 rounded-sm transition-all duration-300 ${
                location.pathname === item.path
                  ? 'bg-cyan-500/10 text-cyan-400 border-r-2 border-cyan-400 shadow-[inset_-10px_0_20px_-10px_rgba(0,240,255,0.3)]'
                  : 'text-slate-400 hover:text-cyan-200 hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              <span className="font-label-caps text-xs">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Botão inferior */}
        <div className="pb-1 mx-1">
          <button className="w-full py-3 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 font-label-caps text-[10px] hover:bg-cyan-500 hover:text-slate-950 transition-all duration-300 tracking-[0.2em]">
            OPTIMIZE SYSTEM
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col ml-64">
        {/* TOP APP BAR */}
        <header className="sticky top-0 h-16 flex justify-between items-center px-2 bg-slate-950/60 backdrop-blur-md border-b border-cyan-500/20 shadow-2xl shadow-cyan-900/20 z-40">
          <div className="flex items-center mx-2">
            <span className="text-lg font-bold text-white tracking-widest font-['Space_Grotesk']">FRAME_ANALYSIS_CMD</span>
            <div className="h-4 w-[1px] bg-white/20 mx-2"></div>
            <span className="font-label-caps text-[10px] text-cyan-400">STATUS: CALIBRATED</span>
            <div className="h-4 w-[1px] bg-white/20 mx-2"></div>
            <span className="font-label-caps text-[10px] text-secondary animate-pulse">
              {user?.name ? `USER: ${user.name.toUpperCase()}` : 'GUEST_ACCESS_MODE'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center pl-5 border-l border-white/10">
              <button 
                onClick={handleLogout}
                className="px-6 h-10 bg-gradient-to-r from-cyan-400 to-secondary text-slate-950 font-label-caps text-[10px] font-bold tracking-widest rounded hover:opacity-90 transition-opacity"
              >
                LOGOUT
              </button>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto relative z-10">
          {/* BACKGROUND AESTHETIC */}
          <div className="fixed inset-0 z-0 pointer-events-none ml-64">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/20 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full"></div>
          </div>

          {/* Container do conteúdo */}
          <div className="relative z-10 max-w-7xl mx-auto px-10 py-10 pb-20">
            <Routes>
              <Route path="/" element={<ProtectedRoute><Estimate /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/compare" element={<ProtectedRoute><Compare /></ProtectedRoute>} />
              <Route path="/user" element={<ProtectedRoute><User /></ProtectedRoute>} />
            </Routes>
          </div>
        </main>

        {/* BOTTOM STATUS BAR — padding lateral aumentado */}
        <footer className="sticky bottom-0 h-8 bg-slate-900/80 backdrop-blur-sm border-t border-white/5 z-40 flex items-center justify-between px-8">
          <div className="flex items-center gap-4 ml-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
              <span className="font-label-caps text-[9px] text-slate-400">DATABASE_SYNC: SUCCESS</span>
            </div>
            <span className="font-label-caps text-[9px] text-slate-600">|</span>
            <span className="font-label-caps text-[9px] text-slate-400">LATENCY: 14MS</span>
          </div>
          <div className="flex items-center gap-4 mr-2">
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
