import { useState, useRef, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';

const SLICE_COLORS = [
  "#E3F0E9", "#F6EBDD", "#F7F4EE", "#E9F2E5", "#F1E5D4", "#EDE7F3"
];

export default function DateNight() {
  const [options, setOptions] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [centerText, setCenterText] = useState('Add options & spin');

  const canvasRef = useRef(null);
  const spinnerRef = useRef(null);
  const rotationRef = useRef(0);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 320;
    canvas.width = size;
    canvas.height = size;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 8;

    ctx.clearRect(0, 0, size, size);

    if (!options.length) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#E3F0E9";
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.08)";
      ctx.lineWidth = 3;
      ctx.stroke();
      return;
    }

    const sliceAngle = (Math.PI * 2) / options.length;
    const baseFontSize = options.length > 10 ? 11 : 13;
    const textRadius = radius - 26;

    options.forEach((opt, i) => {
      const start = i * sliceAngle;
      const end = start + sliceAngle;
      const mid = start + sliceAngle / 2;
      const color = SLICE_COLORS[i % SLICE_COLORS.length];

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.06)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(mid + Math.PI / 2);
      ctx.fillStyle = "#3A4B42";
      ctx.font = `600 ${baseFontSize}px "Mulish", system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const label = opt.length > 20 ? opt.slice(0, 17) + "…" : opt;
      ctx.fillText(label, 0, -textRadius);
      ctx.restore();
    });
  }, [options]);

  useEffect(() => { drawWheel(); }, [drawWheel]);

  const addOption = () => {
    const val = inputVal.trim();
    if (!val || options.includes(val)) return;
    setOptions(prev => [...prev, val]);
    setInputVal('');
    setCenterText('Ready to spin');
  };

  const removeOption = (opt) => {
    setOptions(prev => prev.filter(o => o !== opt));
  };

  const clearAll = () => {
    setOptions([]);
    setCenterText('Add options & spin');
  };

  const spinWheel = () => {
    if (isSpinning || options.length < 2) return;
    setIsSpinning(true);
    setCenterText('Spinning…');

    const extraTurns = 6 + Math.floor(Math.random() * 4);
    const randomOffset = Math.random() * 360;
    const targetRotation = rotationRef.current + extraTurns * 360 + randomOffset;
    rotationRef.current = targetRotation;

    const spinner = spinnerRef.current;
    spinner.style.transition = "transform 4s cubic-bezier(0.33, 1, 0.68, 1)";
    spinner.style.transform = `rotate(${targetRotation}deg)`;
  };

  const handleTransitionEnd = () => {
    if (!isSpinning) return;
    setIsSpinning(false);

    const spinner = spinnerRef.current;
    spinner.style.transition = "none";

    if (!options.length) return;

    const sliceDeg = 360 / options.length;
    let finalRotation = rotationRef.current % 360;
    if (finalRotation < 0) finalRotation += 360;

    const pointerDeg = 270;
    let localAngle = pointerDeg - finalRotation;
    localAngle = ((localAngle % 360) + 360) % 360;

    const index = Math.floor(localAngle / sliceDeg) % options.length;
    setCenterText(options[index]);

    rotationRef.current = finalRotation;
    spinner.style.transform = `rotate(${finalRotation}deg)`;
  };

  return (
    <Layout title="Date Night" subtitle="Add ideas, spin the wheel, and let it pick for you!">
      <p className="message msg2">"You're Not You When You're Hangry"</p>

      <section className="date-grid">
        <article className="card date-card">
          <h2 className="date-heading">Spin the wheel</h2>
          <div className="wheel-area">
            <div className="wheel-container">
              <div className="wheel-arrow" aria-hidden="true" />
              <div
                ref={spinnerRef}
                className="wheel-spinner"
                onTransitionEnd={handleTransitionEnd}
              >
                <canvas ref={canvasRef} id="wheelCanvas" />
              </div>
              <div className="wheel-center">{centerText}</div>
            </div>
          </div>

          <div className="spin-row">
            <button className="btn-solid" onClick={spinWheel} disabled={isSpinning}>Spin</button>
            <button className="ghost ghost-small" onClick={clearAll} disabled={isSpinning}>Clear all</button>
          </div>

          <div className="date-options-compact">
            <div className="date-options-row">
              <input
                type="text"
                className="date-input"
                placeholder="Add an option..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
              />
              <button className="ghost" onClick={addOption}>Add</button>
            </div>

            <div className="date-options-list">
              {options.length === 0 ? (
                <div className="options-empty">No options yet.</div>
              ) : (
                <ul className="options-ul">
                  {options.map((opt) => (
                    <li key={opt} className="options-li">
                      <span className="opt-label">{opt}</span>
                      <button className="remove-btn" onClick={() => removeOption(opt)}>✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </article>
      </section>
    </Layout>
  );
}
