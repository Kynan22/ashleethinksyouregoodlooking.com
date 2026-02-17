import { Heart } from 'lucide-react';

export default function PersonToggle({ value, onChange }) {
  const options = [
    { key: 'kynan', label: 'K', color: 'var(--ta-blue)' },
    { key: 'ashlee', label: 'A', color: 'var(--ta-rose)' },
    { key: 'both', label: <Heart size={14} />, color: 'var(--ta-gold)' },
  ];

  return (
    <div className="person-toggle">
      {options.map(opt => (
        <button
          key={opt.key}
          className={`person-btn ${value === opt.key ? 'active' : ''}`}
          style={{ '--person-color': opt.color }}
          onClick={() => onChange(opt.key)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
