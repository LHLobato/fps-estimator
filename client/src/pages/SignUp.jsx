import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as authAPI from '../api/auth';
import { HardwareSearchInput } from '../components/HardwareSearchInput';
import { useCpuSearch, useGpuSearch } from '../hooks/useHardwareSearch';
import { filterRamOptions } from '../utils/filterRam';

const RAM_OPTIONS = [
  '128GB DDR5', '64GB DDR5', '32GB DDR5', '16GB DDR5', '8GB DDR5', '4GB DDR5',
  '128GB DDR4', '64GB DDR4', '32GB DDR4', '16GB DDR4', '8GB DDR4', '4GB DDR4',
  '128GB DDR3', '64GB DDR3', '32GB DDR3', '16GB DDR3', '8GB DDR3', '4GB DDR3',
];

export default function SignUp() {
  const [step, setStep] = useState('register');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    gpu: '',
    cpu: '',
    ram: ''
  });
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [cpuSearch, setCpuSearch] = useState('');
  const [gpuSearch, setGpuSearch] = useState('');
  const [ramSearch, setRamSearch] = useState('');

  const { results: cpuSearchResults, loading: cpuSearchLoading } = useCpuSearch(cpuSearch, 10);
  const { results: gpuSearchResults, loading: gpuSearchLoading } = useGpuSearch(gpuSearch, 10);
  const filteredRams = filterRamOptions(RAM_OPTIONS, ramSearch, 10);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.name) {
      setError('Please fill all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    return true;
  };

  const getErrorMessage = (error) => {
    if (Array.isArray(error.response?.data?.detail)) {
      return error.response.data.detail[0]?.msg || 'Validation error';
    }
    if (error.response?.data?.detail) {
      if (typeof error.response.data.detail === 'string') {
        return error.response.data.detail;
      }
      return JSON.stringify(error.response.data.detail);
    }
    return error.message || 'Error creating account';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (step === 'register') {
      if (!validateForm()) return;

      setIsLoading(true);
      try {
        const response = await authAPI.sign_in({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          profile_photo: null,
          gpu: formData.gpu || 'Not specified',
          cpu: formData.cpu || 'Not specified',
          ram: formData.ram || 'Not specified'
        });
        setSuccess(response.message || 'Verification code sent to your email!');
        setStep('verify_code');
      } catch (err) {
        console.error('Signup error:', err.response?.data);
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    } else if (step === 'verify_code') {
      setIsLoading(true);
      try {
        await authAPI.verify_code_sign({
          email: formData.email,
          code
        });


        setSuccess('Account created successfully! Redirecting...');

        setTimeout(() => {
          window.location.href = '/';
        }, 800);
      } catch (err) {
        console.error('Verification error:', err.response?.data);
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex h-screen bg-slate-950">
      {/* SIDEBAR - Identical to App.jsx but disabled */}
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

        {/* Bottom button */}
        <div className="pb-1 mx-1">
          <button className="w-full py-3 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 font-label-caps text-[10px] hover:bg-cyan-500 hover:text-slate-950 transition-all duration-300 tracking-[0.2em]">
            OPTIMIZE SYSTEM
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col ml-64">
        {/* TOP APP BAR - Identical to App.jsx */}
        <header className="fixed top-0 right-0 left-64 h-16 flex justify-between items-center px-2 bg-slate-950/60 backdrop-blur-md border-b border-cyan-500/20 shadow-2xl shadow-cyan-900/20 z-40">
          <div className="flex items-center mx-2">
            <span className="text-lg font-bold text-white tracking-widest font-['Space_Grotesk']">FRAME_ANALYSIS_CMD</span>
            <div className="h-4 w-[1px] bg-white/20 mx-2"></div>
            <span className="font-label-caps text-[10px] text-cyan-400">STATUS: INITIALIZING</span>
            <div className="h-4 w-[1px] bg-white/20 mx-2"></div>
            <span className="font-label-caps text-[10px] text-slate-500">REGISTRATION_MODE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative group">
              <span className="material-symbols-outlined text-slate-500 group-hover:text-cyan-400 cursor-pointer transition-colors">notifications</span>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-slate-600 rounded-full"></div>
            </div>
            <span className="material-symbols-outlined text-slate-500 hover:text-cyan-400 cursor-pointer transition-colors">settings</span>
            <span className="material-symbols-outlined text-slate-500 hover:text-cyan-400 cursor-pointer transition-colors">terminal</span>
            <div className="flex items-center pl-5 border-l border-white/10">
              <Link
                to="/login"
                className="px-6 h-10 text-slate-950 font-label-caps text-[10px] font-bold tracking-widest rounded hover:opacity-90 transition-opacity inline-flex items-center"
                style={{ backgroundImage: 'linear-gradient(to right, #06b6d4, #a855f7)' }}
              >
                LOGIN / JOIN
              </Link>
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

          {/* SignUp Module */}
          <div className="relative z-10 w-full max-w-md mx-auto">
            <div className="glass-panel p-10 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-cyan-500/20">
              {/* Panel Header */}
              <div className="mb-10 text-center">
                <div className="inline-block px-3 py-1 mb-4 border border-cyan-500/30 bg-cyan-500/5 rounded text-[10px] font-label-caps text-cyan-400 uppercase tracking-[0.3em]">
                  {step === 'register' ? 'Create Account' : 'Verification Code'}
                </div>
                <h1 className="font-headline-lg text-primary-fixed mb-2 uppercase tracking-tighter">FPS_CORE</h1>
                <p className="text-on-surface-variant text-sm font-body-md opacity-70">
                  {step === 'register'
                    ? 'Initialize your neural node connection.'
                    : 'Enter the verification code sent to your email.'}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-3 bg-red-900/20 border border-red-500/40 rounded">
                  <p className="text-red-400 text-xs font-label-caps">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="mb-6 p-3 bg-green-900/20 border border-green-500/40 rounded">
                  <p className="text-green-400 text-xs font-label-caps">{success}</p>
                </div>
              )}

              {/* SignUp Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {step === 'register' ? (
                  <>
                    {/* Name Field */}
                    <div className="relative">
                      <label className="font-label-caps text-[10px] text-cyan-400/80 mb-2 block uppercase tracking-widest">
                        Operator Name
                      </label>
                      <div className="flex items-center border-b border-cyan-500/30 focus-within:border-cyan-400 transition-colors bg-cyan-500/5 px-3 py-3">
                        <span className="material-symbols-outlined text-cyan-400/60 mr-3">person</span>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="bg-transparent border-none focus:ring-0 text-primary-fixed placeholder:text-cyan-900/50 w-full font-label-caps text-sm tracking-widest uppercase outline-none"
                          placeholder="YOUR_NAME"
                        />
                      </div>
                    </div>

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

                    {/* Confirm Password Field */}
                    <div className="relative">
                      <label className="font-label-caps text-[10px] text-cyan-400/80 mb-2 block uppercase tracking-widest">
                        Confirm Keyphrase
                      </label>
                      <div className="flex items-center border-b border-cyan-500/30 focus-within:border-cyan-400 transition-colors bg-cyan-500/5 px-3 py-3">
                        <span className="material-symbols-outlined text-cyan-400/60 mr-3">verified</span>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                          className="bg-transparent border-none focus:ring-0 text-primary-fixed placeholder:text-cyan-900/50 w-full font-label-caps text-sm tracking-widest outline-none"
                          placeholder="••••••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="material-symbols-outlined text-cyan-400/40 cursor-pointer hover:text-cyan-400 transition-colors"
                        >
                          {showConfirmPassword ? 'visibility_off' : 'visibility'}
                        </button>
                      </div>
                    </div>

                    {/* Hardware Info (Optional) */}
                    <div className="border-t border-cyan-500/20 pt-6 space-y-4">
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest">Optional: Current Hardware</p>

                      <HardwareSearchInput
                        label="Processor Unit (CPU)"
                        placeholder="Search CPU..."
                        search={cpuSearch}
                        onSearchChange={setCpuSearch}
                        results={cpuSearchResults}
                        loading={cpuSearchLoading}
                        selected={formData.cpu}
                        onSelect={(name) => {
                          setFormData((prev) => ({ ...prev, cpu: name }));
                          setCpuSearch('');
                        }}
                      />

                      <HardwareSearchInput
                        label="Graphics Unit (GPU)"
                        placeholder="Search GPU..."
                        search={gpuSearch}
                        onSearchChange={setGpuSearch}
                        results={gpuSearchResults}
                        loading={gpuSearchLoading}
                        selected={formData.gpu}
                        onSelect={(name) => {
                          setFormData((prev) => ({ ...prev, gpu: name }));
                          setGpuSearch('');
                        }}
                      />

                      <div className="relative">
                        <label className="font-label-caps text-[10px] text-cyan-400/80 mb-2 block uppercase tracking-widest">
                          System Memory (RAM)
                        </label>
                        <input
                          type="text"
                          placeholder="Search RAM..."
                          value={ramSearch}
                          onChange={(e) => setRamSearch(e.target.value)}
                          className="w-full bg-transparent border-b border-cyan-500/30 focus:border-cyan-400 py-2 text-primary-fixed font-label-caps text-sm outline-none transition-all placeholder:text-cyan-900/50"
                        />
                        {ramSearch && filteredRams.length > 0 && (
                          <div className="absolute top-full left-0 right-0 bg-slate-900 border border-cyan-500/40 rounded mt-2 max-h-48 overflow-y-auto z-50">
                            {filteredRams.map((ram) => (
                              <button
                                key={ram}
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({ ...prev, ram }));
                                  setRamSearch('');
                                }}
                                className="w-full px-4 py-2 text-left text-cyan-300 hover:bg-cyan-500/30 hover:text-cyan-100 transition-colors text-sm"
                              >
                                {ram}
                              </button>
                            ))}
                          </div>
                        )}
                        {formData.ram && (
                          <p className="text-[9px] text-cyan-400 mt-2">Selected: {formData.ram}</p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Verification Code Field */}
                    <div className="relative">
                      <label className="font-label-caps text-[10px] text-cyan-400/80 mb-2 block uppercase tracking-widest">
                        Verification Code
                      </label>
                      <div className="flex items-center border-b border-cyan-500/30 focus-within:border-cyan-400 transition-colors bg-cyan-500/5 px-3 py-3">
                        <span className="material-symbols-outlined text-cyan-400/60 mr-3">verified_user</span>
                        <input
                          type="text"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          required
                          maxLength="6"
                          className="bg-transparent border-none focus:ring-0 text-primary-fixed placeholder:text-cyan-900/50 w-full font-label-caps text-sm tracking-widest uppercase outline-none text-center text-2xl letter-spacing-[0.5em]"
                          placeholder="000000"
                        />
                      </div>
                      <p className="text-[9px] text-slate-500 mt-2">Code sent to: {formData.email}</p>
                    </div>
                  </>
                )}

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
                    {isLoading
                      ? 'INITIALIZING...'
                      : step === 'register'
                        ? 'CREATE ACCOUNT'
                        : 'VERIFY CODE'}
                  </button>
                </div>

                {/* Back Button (for verification step) */}
                {step === 'verify_code' && (
                  <button
                    type="button"
                    onClick={() => {
                      setStep('register');
                      setCode('');
                      setError('');
                      setSuccess('');
                    }}
                    className="w-full py-2 text-cyan-400 hover:text-cyan-300 font-label-caps text-[10px] uppercase transition-colors"
                  >
                    ← Back to Registration
                  </button>
                )}
              </form>

              {/* Footer Links */}
              <div className="mt-8 flex justify-center items-center text-[10px] font-label-caps tracking-widest">
                <span className="text-on-surface-variant mr-2">Already have an account?</span>
                <Link
                  to="/login"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors uppercase underline decoration-cyan-500/40 underline-offset-4"
                >
                  Sign In
                </Link>
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
                <span className="text-xs font-data-display text-slate-500">INITIALIZING</span>
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
                <div className="h-full bg-cyan-400 w-1/4"></div>
              </div>
            </div>
            <div className="glass-panel p-4 border-l-2 border-l-slate-600">
              <div className="text-[9px] font-label-caps text-slate-500 mb-1">NETWORK STABILITY</div>
              <div className="flex gap-1">
                <div className="h-3 w-1 bg-cyan-400"></div>
                <div className="h-3 w-1 bg-cyan-400"></div>
                <div className="h-3 w-1 bg-cyan-400"></div>
                <div className="h-3 w-1 bg-slate-600"></div>
                <div className="h-3 w-1 bg-slate-800"></div>
              </div>
            </div>
          </div>
        </main>

        {/* BOTTOM STATUS BAR */}
        <footer className="fixed bottom-0 right-0 left-64 h-8 bg-slate-900/80 backdrop-blur-sm border-t border-white/5 z-40 flex items-center justify-between px-8 opacity-40 pointer-events-none">
          <div className="flex items-center gap-4 ml-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
              <span className="font-label-caps text-[9px] text-slate-400">DATABASE_SYNC: PENDING</span>
            </div>
            <span className="font-label-caps text-[9px] text-slate-600">|</span>
            <span className="font-label-caps text-[9px] text-slate-400">LATENCY: --MS</span>
          </div>
          <div className="flex items-center gap-4 mr-2">
            <span className="font-label-caps text-[9px] text-slate-400">ENCRYPTION: AES-256</span>
            <span className="font-label-caps text-[9px] text-slate-500">USER: GUEST</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
