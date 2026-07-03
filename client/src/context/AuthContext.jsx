import { useState, useEffect } from 'react';
import * as authAPI from '../api/auth';
import api from '../api/config';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  // Verificar autenticação ao montar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await authAPI.refresh_token();
        console.log('[AUTH] Token encontrado, verificando com /auth/me...');
        const userData = await api.get('/auth/me');
        console.log('[AUTH] ✅ Autenticação verificada:', userData.data);
        setUser(userData.data);
        setIsAuthenticated(true);
        setError('');
      } catch (err) {
        console.error('[AUTH] ❌ Falha ao verificar autenticação:', err.response?.status, err.response?.data);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const expireSession = () => {
      setUser(null);
      setIsAuthenticated(false);
    };

    window.addEventListener('auth:session-expired', expireSession);
    return () => window.removeEventListener('auth:session-expired', expireSession);
  }, []);

  const login = async (email, password) => {
    setError('');
    try {
      const response = await authAPI.login({ email, password });
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Erro ao fazer login';
      setError(errorMessage);
      throw err;
    }
  };

  const handleVerifyCode = async (email, code) => {
    setError('');
    try {
      const response = await authAPI.verify_code_login({ email, code });
      if (response.access_token) {
        // O JWT já foi armazenado por verify_code_login. A autenticação não
        // deve depender de uma segunda requisição para carregar o perfil.
        setIsAuthenticated(true);

        try {
          const userData = await api.get('/auth/me');
          setUser(userData.data);
        } catch (profileError) {
          console.error('[AUTH] Sessão iniciada, mas não foi possível carregar o perfil:', profileError);
          setUser(null);
        }

        return response;
      }

      throw new Error('Token de acesso não recebido após a verificação');
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Erro na verificação';
      setError(errorMessage);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setError('');
    }
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
