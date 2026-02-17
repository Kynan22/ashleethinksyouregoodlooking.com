import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSeason } from '../hooks/useSeason';
import Lightrope from '../components/Lightrope';
import NudgeNotification from '../components/NudgeNotification';

function pad(n) { return n.toString().padStart(2, '0'); }

export default function Home() {
  const { signOut } = useAuth();
  const { isChristmas, isValentines } = useSeason();
  const [time, setTime] = useState({ d: '–', h: '–', m: '–', s: '–' });
  const [message, setMessage] = useState('Newcastle Countdown');

  const targetDate = new Date('2025-12-19T17:00:00');

  useEffect(() => {
    function tick() {
      const now = new Date();
      const diff = targetDate - now;
      if (diff <= 0) {
        setTime({ d: '00', h: '00', m: '00', s: '00' });
        setMessage('TIME TO HANG :)');
        return;
      }
      const sec = Math.floor(diff / 1000);
      setTime({
        d: pad(Math.floor(sec / 86400)),
        h: pad(Math.floor((sec % 86400) / 3600)),
        m: pad(Math.floor((sec % 3600) / 60)),
        s: pad(sec % 60)
      });
    }

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {isChristmas && <Lightrope />}
      <NudgeNotification />
      <main className="shell">
        <section className="card">
          {isChristmas ? (
            <h1 className="title">Merry Christmas Ashlee!</h1>
          ) : isValentines ? (
            <h1 className="title" style={{ color: '#c9354d' }}>Happy Valentine's Day</h1>
          ) : (
            <h1 className="title">Missing You</h1>
          )}

          {isChristmas ? (
            <p className="message" style={{ color: '#e47068', lineHeight: 1.65 }}>
              Getting to spend Christmas with you is the greatest gift I ever could have wished for.
              I love you more than you know, thank you for being there for me, thank you for treating
              me so well, and thank you for loving on me in every way that you do.
            </p>
          ) : (
            <>
              <div className="countdown" aria-live="polite">
                <div className="timebox"><div className="num">{time.d}</div><div className="label">Days</div></div>
                <div className="timebox"><div className="num">{time.h}</div><div className="label">Hours</div></div>
                <div className="timebox"><div className="num">{time.m}</div><div className="label">Mins</div></div>
                <div className="timebox"><div className="num">{time.s}</div><div className="label">Secs</div></div>
              </div>
              <p className="message">{message}</p>
            </>
          )}
        </section>

        <section className="sections">
          {isValentines && (
            <Link className="btn" to="/valentines" style={{ background: 'linear-gradient(135deg, #fff5f5, #ffe0e6)', borderColor: '#f0c0c8' }}>
              <span className="chip" style={{ background: '#c9354d', color: '#fff', borderColor: '#a02a3e' }}>♥</span>
              <h3 style={{ color: '#8b1a2b' }}>Valentine's Dinner</h3>
              <p>Tonight's menu, just for us</p>
            </Link>
          )}

          <Link className="btn arcade" to="/arcade">
            <span className="chip">Play</span>
            <h3>Arcade</h3>
            <p>Bored at work? Click here to pass the time</p>
          </Link>

          <Link className="btn date" to="/date-night">
            <span className="chip">Decide</span>
            <h3>Date Night</h3>
            <p>CLICK HERE IN A HANGRY EMERGENCY</p>
          </Link>

          <Link className="btn love" to="/stories">
            <span className="chip">Hehe</span>
            <h3>I Love You</h3>
            <p>I really do</p>
          </Link>

          <Link className="btn" to="/typea" style={{ background: '#fff' }}>
            <span className="chip">Organise</span>
            <h3>Type A(shlee)</h3>
            <p>Calendar, dates & to-dos</p>
          </Link>
        </section>

        <footer>
          <button className="link" onClick={signOut} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Logout
          </button>
        </footer>
      </main>
    </>
  );
}
