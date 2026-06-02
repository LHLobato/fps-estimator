import { createContext, useState, useEffect } from 'react';
import * as authAPI from '../api/auth';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  // Verificar autenticação ao montar
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      console.log('[AUTH] Iniciando verificação de autenticação...', { token: !!token });
      
      if (!token) {
        console.log('[AUTH] Nenhum token encontrado');
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        console.log('[AUTH] Token encontrado, verificando com /auth/me...');
        const api = (await import('../api/config')).default;
        const userData = await api.get('/auth/me');
        console.log('[AUTH] ✅ Autenticação verificada:', userData.data);
        setUser(userData.data);
        setIsAuthenticated(true);
        setError('');
      } catch (err) {
        console.error('[AUTH] ❌ Falha ao verificar autenticação:', err.response?.status, err.response?.data);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.login({ email, password });
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Erro ao fazer login';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (email, code) => {
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.verify_code_login({ email, code });
      if (response.access_token) {
        localStorage.setItem('access_token', response.access_token);
        if (response.refresh_token) {
          localStorage.setItem('refresh_token', response.refresh_token);
        }
        
        // Obter dados do usuário
        const api = (await import('../api/config')).default;
        const userData = await api.get('/auth/me');
        setUser(userData.data);
        setIsAuthenticated(true);
        return response;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Erro na verificação';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setIsAuthenticated(false);
    setError('');
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated,
      error,
      login,
      handleVerifyCode,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
