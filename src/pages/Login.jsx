import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await signIn(email, password);

    if (authError) {
      setError("That's not it — try again?");
      setLoading(false);
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="center">
      <form className="card login" onSubmit={handleSubmit}>
        <h1 className="title">Ashlee Login</h1>
        <p className="message"></p>

        <div style={{ marginTop: 14 }} />
        <label htmlFor="email" className="note">Email</label>
        <input
          className="input"
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div style={{ height: 12 }} />

        <label htmlFor="pw" className="note">Password</label>
        <input
          className="input"
          id="pw"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div style={{ height: 12 }} />

        <div className="row">
          <button className="btn-solid" type="submit" disabled={loading}>
            {loading ? 'Loading...' : 'Let me in'}
          </button>
          <span className="note" role="alert" aria-live="polite">{error}</span>
        </div>
      </form>
    </div>
  );
}
