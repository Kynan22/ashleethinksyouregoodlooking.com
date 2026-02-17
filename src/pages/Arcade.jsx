import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

export default function Arcade() {
  return (
    <Layout title="Arcade" subtitle="Pick a game to play">
      <section className="sections">
        <div className="btn arcade" style={{ opacity: 0.45, pointerEvents: 'none' }}>
          <span className="chip">Runner</span>
          <h3>Gizmo Run</h3>
          <p>Under Maintenance</p>
        </div>

        <Link className="btn" to="/wordle" style={{ background: '#fff' }}>
          <span className="chip">Daily</span>
          <h3>Wordle</h3>
          <p>5 letters. 6 guesses. Updates Daily!</p>
        </Link>

        <div className="btn_cs crossword">
          <span className="chip">Puzzle</span>
          <h3>Crossword</h3>
          <p>Coming Soon...</p>
        </div>
      </section>
    </Layout>
  );
}
