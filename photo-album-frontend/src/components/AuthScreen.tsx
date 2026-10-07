import { useState } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import { login, register } from '../api';
import type { User } from '../types';

type Props = { onAuthenticated: (user: User) => void };

export function AuthScreen({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const session = mode === 'login'
        ? await login(email, password)
        : await register(email, password);
      onAuthenticated(session.user);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to authenticate.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-paper">
        <span className="brand-mark"><BookOpen size={18} strokeWidth={1.8} /></span>
        <p className="eyebrow"><Sparkles size={14} /> Your personal archive</p>
        <h1>Keep the good<br /><em>close.</em></h1>
        <p className="auth-copy">A quieter place for the photographs and people that matter.</p>
        <form onSubmit={submit} className="auth-form">
          <label>Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Password<input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {error && <p className="auth-error">{error}</p>}
          <button className="new-album-button" disabled={busy}>{busy ? 'Opening...' : mode === 'login' ? 'Open my albums' : 'Create my folio'}</button>
        </form>
        <button className="auth-switch" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}
        </button>
      </div>
    </main>
  );
}
