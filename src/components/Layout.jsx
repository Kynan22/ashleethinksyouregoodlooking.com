import { useAuth } from '../hooks/useAuth';
import BackButton from './BackButton';
import Lightrope from './Lightrope';
import { useSeason } from '../hooks/useSeason';

export default function Layout({ children, title, subtitle, showBack = true, showFooter = true }) {
  const { signOut } = useAuth();
  const { isChristmas } = useSeason();

  return (
    <>
      {isChristmas && <Lightrope />}
      <main className="shell">
        {showBack && (
          <div className="game-header">
            <BackButton />
            <div aria-hidden="true" style={{ flex: 1 }} />
          </div>
        )}

        {(title || subtitle) && (
          <section className="card">
            {title && <h1 className="title">{title}</h1>}
            {subtitle && <p className="message">{subtitle}</p>}
          </section>
        )}

        {children}

        {showFooter && (
          <footer>
            <button className="link" onClick={signOut} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              Logout
            </button>
          </footer>
        )}
      </main>
    </>
  );
}
