import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simular autenticação
    setTimeout(() => {
      console.log('Login attempt:', formData);
      setIsLoading(false);
      navigate('/');
    }, 1500);
  };

  const handleForgotPassword = () => {
    alert('Password recovery feature coming soon...');
  };

  const handleRequestAccess = () => {
    alert('Access request feature coming soon...');
  };

  return (
    <div className="flex h-screen bg-slate-950">
      {/* SIDEBAR - Idêntica ao App.jsx mas desativada */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-cyan-500/30 bg-slate-950/40 backdrop-blur-xl shadow-[20px_0_40px_-15px_rgba(0,0,0,0.5)] z-50 flex flex-col opacity-40 pointer-events-none">
        {/* Logo */}
        <div className="px-2 pt-2 mx-2">
          <h1 className="text-2xl font-black tracking-tighter text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.5)] font-['Space_Grotesk'] tracking-wider uppercase">
            FPS_CORE
          </h1>
          <p className="text-[10px] text-slate-500 font-label-caps mt-1 tracking-widest">V.0.1_STABLE</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 mt-6 flex flex-col gap-1">
          <div className="flex items-center gap-3 px-5 h-12 rounded-sm text-slate-400">
            <span className="material-symbols-outlined text-lg">speed</span>
            <span className="font-label-caps text-xs">Estimator</span>
          </div>
          <div className="flex items-center gap-3 px-5 h-12 rounded-sm text-slate-400">
            <span className="material-symbols-outlined text-lg">compare_arrows</span>
            <span className="font-label-caps text-xs">Comparison</span>
          </div>
          <div className="flex items-center gap-3 px-5 h-12 rounded-sm text-slate-400">
            <span className="material-symbols-outlined text-lg">fingerprint</span>
            <span className="font-label-caps text-xs">Profile</span>
          </div>
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
        {/* TOP APP BAR - Idêntica ao App.jsx */}
        <header className="fixed top-0 right-0 left-64 h-16 flex justify-between items-center px-2 bg-slate-950/60 backdrop-blur-md border-b border-cyan-500/20 shadow-2xl shadow-cyan-900/20 z-40">
          <div className="flex items-center mx-2">
            <span className="text-lg font-bold text-white tracking-widest font-['Space_Grotesk']">FRAME_ANALYSIS_CMD</span>
            <div className="h-4 w-[1px] bg-white/20 mx-2"></div>
            <span className="font-label-caps text-[10px] text-cyan-400">STATUS: LOCKED</span>
            <div className="h-4 w-[1px] bg-white/20 mx-2"></div>
            <span className="font-label-caps text-[10px] text-slate-500">PRE_AUTH_MODE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative group">
              <span className="material-symbols-outlined text-slate-500 group-hover:text-cyan-400 cursor-pointer transition-colors">notifications</span>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-slate-600 rounded-full"></div>
            </div>
            <span className="material-symbols-outlined text-slate-500 hover:text-cyan-400 cursor-pointer transition-colors">settings</span>
            <span className="material-symbols-outlined text-slate-500 hover:text-cyan-400 cursor-pointer transition-colors">terminal</span>
            <div className="flex items-center pl-5 border-l border-white/10">
              <button className="px-6 h-10 text-slate-950 font-label-caps text-[10px] font-bold tracking-widest rounded hover:opacity-90 transition-opacity" style={{
                backgroundImage: 'linear-gradient(to right, #06b6d4, #a855f7)'
              }}>
                LOGIN / JOIN
              </button>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="fixed inset-0 top-16 overflow-y-auto relative z-10 flex items-center justify-center">
          {/* BACKGROUND AESTHETIC */}
          <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/20 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full"></div>
          </div>

          {/* Login Module */}
          <div className="relative z-10 w-full max-w-md mx-auto">
            <div className="glass-panel p-10 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-cyan-500/20">
              {/* Panel Header */}
              <div className="mb-10 text-center">
                <div className="inline-block px-3 py-1 mb-4 border border-cyan-500/30 bg-cyan-500/5 rounded text-[10px] font-label-caps text-cyan-400 uppercase tracking-[0.3em]">
                  Authorization Required
                </div>
                <h1 className="font-headline-lg text-primary-fixed mb-2 uppercase tracking-tighter">FPS_CORE_ACCESS</h1>
                <p className="text-on-surface-variant text-sm font-body-md opacity-70">Initialize secure connection to global neural nodes.</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Email Field */}
                <div className="relative">
                  <label className="font-label-caps text-[10px] text-cyan-400/80 mb-2 block uppercase tracking-widest">
                    Operator Identity
                  </label>
                  <div className="flex items-center border-b border-cyan-500/30 focus-within:border-cyan-400 transition-colors bg-cyan-500/5 px-3 py-3">
                    <span className="material-symbols-outlined text-cyan-400/60 mr-3">alternate_email</span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="bg-transparent border-none focus:ring-0 text-primary-fixed placeholder:text-cyan-900/50 w-full font-label-caps text-sm tracking-widest uppercase outline-none"
                      placeholder="OPERATOR@CORE.SYS"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="relative">
                  <label className="font-label-caps text-[10px] text-cyan-400/80 mb-2 block uppercase tracking-widest">
                    Encrypted Keyphrase
                  </label>
                  <div className="flex items-center border-b border-cyan-500/30 focus-within:border-cyan-400 transition-colors bg-cyan-500/5 px-3 py-3">
                    <span className="material-symbols-outlined text-cyan-400/60 mr-3">key</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="bg-transparent border-none focus:ring-0 text-primary-fixed placeholder:text-cyan-900/50 w-full font-label-caps text-sm tracking-widest outline-none"
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="material-symbols-outlined text-cyan-400/40 cursor-pointer hover:text-cyan-400 transition-colors"
                    >
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </button>
                  </div>
                </div>

                {/* Primary Action */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      backgroundImage: isLoading ? 'linear-gradient(to right, #00f0ff, #b600f8)' : 'linear-gradient(to right, #00f0ff, #b600f8)',
                      color: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '3.5rem',
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: '14px',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      letterSpacing: '0.2em',
                      boxShadow: isLoading ? '0 0 20px rgba(0,240,255,0.2)' : '0 0 20px rgba(0,240,255,0.4)',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.5 : 1,
                      transform: isLoading ? 'scale(1)' : 'scale(1)',
                      transition: 'all 300ms ease'
                    }}
                    onMouseDown={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(0.98)')}
                    onMouseUp={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {isLoading ? 'INITIALIZING...' : 'INITIATE NEURAL LINK'}
                  </button>
                </div>
              </form>

              {/* Footer Links */}
              <div className="mt-8 flex justify-between items-center text-[10px] font-label-caps tracking-widest">
                <button
                  onClick={handleForgotPassword}
                  className="text-on-surface-variant hover:text-cyan-400 transition-colors uppercase bg-none border-none cursor-pointer"
                >
                  Forgot Credentials
                </button>
                <div className="h-px w-8 bg-cyan-500/20"></div>
                <button
                  onClick={handleRequestAccess}
                  className="text-on-surface-variant hover:text-cyan-400 transition-colors uppercase underline decoration-cyan-500/40 underline-offset-4 bg-none border-none cursor-pointer"
                >
                  Request Access
                </button>
              </div>
            </div>

            {/* Visual Decoration Stats */}
            <div className="absolute -bottom-16 left-0 right-0 flex justify-between items-center px-4 opacity-40">
              <div className="flex flex-col">
                <span className="text-[8px] font-label-caps text-slate-500 uppercase">Latency</span>
                <span className="text-xs font-data-display text-cyan-400">--</span>
              </div>
              <div className="flex flex-col text-center">
                <span className="text-[8px] font-label-caps text-slate-500 uppercase">Server Status</span>
                <span className="text-xs font-data-display text-slate-500">LOCKED</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[8px] font-label-caps text-slate-500 uppercase">Node ID</span>
                <span className="text-xs font-data-display text-slate-400">--</span>
              </div>
            </div>
          </div>

          {/* Right Side HUD Element */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden xl:block w-48 space-y-4 opacity-40">
            <div className="glass-panel p-4 border-l-2 border-l-cyan-400">
              <div className="text-[9px] font-label-caps text-cyan-400/60 mb-1">SYSTEM LOAD</div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 w-0"></div>
              </div>
            </div>
            <div className="glass-panel p-4 border-l-2 border-l-slate-600">
              <div className="text-[9px] font-label-caps text-slate-500 mb-1">NETWORK STABILITY</div>
              <div className="flex gap-1">
                <div className="h-3 w-1 bg-slate-600"></div>
                <div className="h-3 w-1 bg-slate-600"></div>
                <div className="h-3 w-1 bg-slate-600"></div>
                <div className="h-3 w-1 bg-slate-600"></div>
                <div className="h-3 w-1 bg-slate-800"></div>
              </div>
            </div>
          </div>
        </main>

        {/* BOTTOM STATUS BAR - Idêntica ao App.jsx mas desativada */}
        <footer className="fixed bottom-0 right-0 left-64 h-8 bg-slate-900/80 backdrop-blur-sm border-t border-white/5 z-40 flex items-center justify-between px-8 opacity-40 pointer-events-none">
          <div className="flex items-center gap-4 ml-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-600"></span>
              <span className="font-label-caps text-[9px] text-slate-400">DATABASE_SYNC: LOCKED</span>
            </div>
            <span className="font-label-caps text-[9px] text-slate-600">|</span>
            <span className="font-label-caps text-[9px] text-slate-400">LATENCY: --MS</span>
          </div>
          <div className="flex items-center gap-4 mr-2">
            <span className="font-label-caps text-[9px] text-slate-400">ENCRYPTION: AES-256</span>
            <span className="font-label-caps text-[9px] text-slate-500">USER: --</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
