import { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '../../supabase';

export default function Memories({ onBack }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('bucket_items')
        .select('*')
        .eq('is_done', true)
        .not('done_date', 'is', null)
        .order('done_date', { ascending: false });
      setItems(data || []);
    }
    load();
  }, []);

  return (
    <div className="card ta-card">
      <div className="ta-header-row">
        <button className="ghost" onClick={onBack} style={{ marginRight: 8 }}>
          <ChevronLeft size={16} style={{ verticalAlign: -3 }} /> Back
        </button>
        <h2 className="ta-heading" style={{ margin: 0 }}>Memories</h2>
      </div>

      {items.length === 0 ? (
        <p className="ta-empty">No memories yet. Complete items from your lists to create memories!</p>
      ) : (
        <div className="memories-list">
          {items.map(item => (
            <div key={item.id} className="memory-card">
              {item.done_photo_url && (
                <img src={item.done_photo_url} alt={item.title} className="memory-photo" />
              )}
              <div className="memory-body">
                <span className="memory-title">{item.title}</span>
                <span className="memory-date">{item.done_date} · {item.category}</span>
                {item.done_note && (
                  <p className="memory-note">{item.done_note}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
