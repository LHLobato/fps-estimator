import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as authAPI from '../api/auth';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { login, handleVerifyCode } = useAuth();

  const [step, setStep] = useState('login');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    newPassword: '',
  });

  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResetState = () => {
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    handleResetState();

    if (step === 'login') {
      setIsLoading(true);
      try {
        await login(formData.email, formData.password);
        setSuccess('UPLINK_ESTABLISHED: Auth code dispatched to secure comms.');
        setStep('verify_code');
      } catch (err) {
        setError(err.response?.data?.detail || 'ACCESS_DENIED: Invalid operator credentials.');
      } finally {
        setIsLoading(false);
      }
    }

    else if (step === 'verify_code') {
      setIsLoading(true);
      try {
        await handleVerifyCode(formData.email, code);

        setSuccess('AUTHORIZATION_ACCEPTED: Initializing neural network parameters...');
        navigate('/', { replace: true });
      } catch (err) {
        setError(err.response?.data?.detail || 'AUTH_FAILURE: Decryption sequence invalid.');
      } finally {
        setIsLoading(false);
      }
    }

    else if (step === 'forgot_password') {
      setIsLoading(true);
      try {
        await authAPI.forgot_password({ email: formData.email });
        setCode('');
        setResetToken('');
        setSuccess('OVERRIDE_INITIATED: Recovery cipher transmitted to your endpoint.');
        setStep('verify_reset_token');
      } catch (err) {
        setError(err.response?.data?.detail || 'COMM_ERROR: Failed to trace operator identity.');
      } finally {
        setIsLoading(false);
      }
    }

    else if (step === 'verify_reset_token') {
      if (!code || code.length < 5) {
        setError('SYNTAX_ERROR: Malformed recovery cipher detected.');
        return;
      }
      setIsLoading(true);
      try {
        const response = await authAPI.verify_recovery_code({
          email: formData.email,
          code,
        });
        setResetToken(response.reset_token);
        setCode('');
        setSuccess('CIPHER_VALIDATED: Authorization sequence accepted.');
        setStep('new_password');
      } catch (err) {
        setError(err.response?.data?.detail || 'VALIDATION_FAILURE: Recovery cipher invalid or expired.');
      } finally {
        setIsLoading(false);
      }
    }

    else if (step === 'new_password') {
      if (!resetToken) {
        setError('AUTH_TOKEN_MISSING: Restart the recovery protocol.');
        setStep('forgot_password');
        return;
      }

      setIsLoading(true);
      try {
        await authAPI.reset_password({
          reset_token: resetToken,
          new_password: formData.newPassword
        });

        setSuccess('KEYPHRASE_OVERRIDE_SUCCESSFUL. Systems re-secured. Standby for login routing...');

        setTimeout(() => {
          setStep('login');
          setCode('');
          setResetToken('');
          setFormData(prev => ({ ...prev, password: '', newPassword: '' }));
          handleResetState();
        }, 2500);
      } catch (err) {
        setError(err.response?.data?.detail || 'OVERRIDE_FAILED: Cipher expired or corrupted.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'login': return 'Authorization Required';
      case 'verify_code': return 'Two-Factor Protocol';
      case 'forgot_password': return 'Identity Recovery';
      case 'verify_reset_token': return 'Cipher Validation';
      case 'new_password': return 'Security Override';
      default: return '';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'login': return 'Initialize secure connection to global neural nodes.';
      case 'verify_code': return 'Input the 6-digit access protocol dispatched to your endpoint.';
      case 'forgot_password': return 'Input your Operator Identity to request an emergency cipher.';
      case 'verify_reset_token': return 'Input the emergency recovery cipher received in your comms.';
      case 'new_password': return 'Establish and encrypt your new security keyphrase.';
      default: return '';
    }
  };

  return (
    <div className="flex h-screen bg-slate-950">
      {/* SIDEBAR DESATIVADA (Apenas visual) */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-cyan-500/30 bg-slate-950/40 backdrop-blur-xl shadow-[20px_0_40px_-15px_rgba(0,0,0,0.5)] z-50 flex flex-col opacity-40 pointer-events-none">
        <div className="px-2 pt-2 mx-2">
          <h1 className="text-2xl font-black tracking-tighter text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.5)] font-['Space_Grotesk'] tracking-wider uppercase">
            FPS_CORE
          </h1>
          <p className="text-[10px] text-slate-500 font-label-caps mt-1 tracking-widest">V.0.1_STABLE</p>
        </div>
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
        <div className="pb-1 mx-1">
          <button className="w-full py-3 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 font-label-caps text-[10px] tracking-[0.2em]">
            OPTIMIZE SYSTEM
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col ml-64">
        {/* TOP APP BAR */}
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
              <button className="px-6 h-10 text-slate-950 font-label-caps text-[10px] font-bold tracking-widest rounded transition-opacity" style={{ backgroundImage: 'linear-gradient(to right, #06b6d4, #a855f7)' }}>
                LOGIN / JOIN
              </button>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="fixed inset-0 top-16 overflow-y-auto relative z-10 flex items-center justify-center">
          <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/20 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full"></div>
          </div>

          <div className="relative z-10 w-full max-w-md mx-auto">
            <div className="glass-panel p-10 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-cyan-500/20 transition-all duration-300">

              <div className="mb-10 text-center">
                <div className="inline-block px-3 py-1 mb-4 border border-cyan-500/30 bg-cyan-500/5 rounded text-[10px] font-label-caps text-cyan-400 uppercase tracking-[0.3em] transition-all">
                  {getStepTitle()}
                </div>
                <h1 className="font-headline-lg text-primary-fixed mb-2 uppercase tracking-tighter">FPS_CORE</h1>
                <p className="text-on-surface-variant text-sm font-body-md opacity-70 min-h-[40px]">
                  {getStepDescription()}
                </p>
              </div>

              {/* Status Messages estilizadas */}
              {error && (
                <div className="mb-6 p-4 bg-red-950/40 border-l-2 border-red-500/80 rounded-r shadow-[inset_10px_0_20px_-10px_rgba(239,68,68,0.2)]">
                  <p className="text-red-400 text-xs font-label-caps tracking-widest">{error}</p>
                </div>
              )}
              {success && (
                <div className="mb-6 p-4 bg-cyan-950/40 border-l-2 border-cyan-500/80 rounded-r shadow-[inset_10px_0_20px_-10px_rgba(6,182,212,0.2)]">
                  <p className="text-cyan-400 text-xs font-label-caps tracking-widest leading-relaxed">{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">

                {(step === 'login' || step === 'forgot_password') && (
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
                )}

                {step === 'login' && (
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
                )}

                {(step === 'verify_code' || step === 'verify_reset_token') && (
                  <div className="relative">
                    <label className="font-label-caps text-[10px] text-cyan-400/80 mb-2 block uppercase tracking-widest">
                      {step === 'verify_code' ? 'Access Token' : 'Recovery Token'}
                    </label>
                    <div className="flex items-center border-b border-cyan-500/30 focus-within:border-cyan-400 transition-colors bg-cyan-500/5 px-3 py-3">
                      <span className="material-symbols-outlined text-cyan-400/60 mr-3">verified_user</span>
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                        maxLength={step === 'verify_code' ? "6" : undefined}
                        className="bg-transparent border-none focus:ring-0 text-primary-fixed placeholder:text-cyan-900/50 w-full font-label-caps text-sm tracking-widest uppercase outline-none text-center text-xl md:text-2xl letter-spacing-[0.5em]"
                        placeholder={step === 'verify_code' ? "000000" : "PASTE TOKEN HERE"}
                      />
                    </div>
                  </div>
                )}

                {step === 'new_password' && (
                  <div className="relative">
                    <label className="font-label-caps text-[10px] text-cyan-400/80 mb-2 block uppercase tracking-widest">
                      New Encrypted Keyphrase
                    </label>
                    <div className="flex items-center border-b border-cyan-500/30 focus-within:border-cyan-400 transition-colors bg-cyan-500/5 px-3 py-3">
                      <span className="material-symbols-outlined text-cyan-400/60 mr-3">key</span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        required
                        className="bg-transparent border-none focus:ring-0 text-primary-fixed placeholder:text-cyan-900/50 w-full font-label-caps text-sm tracking-widest outline-none"
                        placeholder="NEW ••••••••••••"
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
                )}

                <div className="pt-4 space-y-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center justify-center w-full h-14 font-['Space_Grotesk'] text-sm font-black uppercase tracking-[0.2em] rounded border-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950"
                    style={{
                      backgroundImage: 'linear-gradient(to right, #00f0ff, #b600f8)',
                      boxShadow: isLoading ? '0 0 20px rgba(0,240,255,0.2)' : '0 0 20px rgba(0,240,255,0.4)',
                    }}
                  >
                    {isLoading ? 'PROCESSING...' :
                     step === 'login' ? 'INITIATE NEURAL LINK' :
                     step === 'verify_code' ? 'VERIFY ACCESS CODE' :
                     step === 'forgot_password' ? 'DISPATCH RECOVERY CIPHER' :
                     step === 'verify_reset_token' ? 'VALIDATE CIPHER' :
                     'ENCRYPT NEW KEYPHRASE'
                    }
                  </button>

                  {step !== 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setStep('login');
                        setCode('');
                        setResetToken('');
                        handleResetState();
                      }}
                      className="w-full py-2 text-cyan-400/70 hover:text-cyan-300 font-label-caps text-[10px] uppercase transition-colors"
                    >
                      ← Abort Protocol & Return
                    </button>
                  )}
                </div>
              </form>

              {step === 'login' && (
                <div className="mt-8 flex justify-between items-center text-[10px] font-label-caps tracking-widest">
                  <button
                    type="button"
                    onClick={() => setStep('forgot_password')}
                    className="text-on-surface-variant hover:text-cyan-400 transition-colors uppercase bg-transparent border-none cursor-pointer p-0"
                  >
                    Forgot Credentials
                  </button>
                  <div className="h-px w-8 bg-cyan-500/20"></div>
                  <Link
                    to="/signup"
                    className="text-on-surface-variant hover:text-cyan-400 transition-colors uppercase underline decoration-cyan-500/40 underline-offset-4"
                  >
                    Register New Identity
                  </Link>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
