import { useState } from 'react';
import { LifeBuoy } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function LoginPage({ onLogin }) {
  const [error, setError] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');

    if (!email || !password) {
      setError('Informe e-mail e senha para continuar.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.token) {
        throw new Error(data.message || 'Credenciais inválidas.');
      }

      onLogin({
        token: data.token,
        userId: data.userId,
        name: data.name,
        role: data.role,
      });
    } catch (loginError) {
      setError(loginError.message || 'Não foi possível entrar no sistema.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand auth-brand">
          <span className="brand-mark"><LifeBuoy size={20} /></span>
          <span>helpdesk<span className="brand-dot">.</span></span>
        </div>

        <div className="auth-header">
          <p className="eyebrow">ACESSO RESTRITO</p>
          <h1>Entrar no painel</h1>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            E-mail
            <input type="email" name="email" placeholder="usuario@empresa.com" autoComplete="username" />
          </label>

          <label>
            Senha
            <input type="password" name="password" placeholder="Digite sua senha" autoComplete="current-password" />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button className="primary-button auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
