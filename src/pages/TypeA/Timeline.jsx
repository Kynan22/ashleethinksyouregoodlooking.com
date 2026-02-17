import { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { supabase } from '../../supabase';

function getIcon(name, size = 12) {
  const pascal = name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  const Icon = Icons[pascal] || Icons.Calendar;
  return <Icon size={size} />;
}

export default function Timeline({ personFilter, categoryFilter, onEventClick }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split('T')[0];
      let query = supabase
        .from('events')
        .select('*, categories(*)')
        .gte('event_date', today)
        .order('event_date')
        .order('start_time')
        .limit(30);

      if (personFilter !== 'both') {
        query = query.or(`owner.eq.${personFilter},is_shared.eq.true`);
      }

      const { data } = await query;
      let filtered = data || [];

      // Filter by category name if specified
      if (categoryFilter) {
        filtered = filtered.filter(ev => ev.categories?.name === categoryFilter);
      }

      setEvents(filtered);
    }

    load();
  }, [personFilter, categoryFilter]);

  if (!events.length) {
    return <p className="ta-empty">No upcoming events. Time to plan something!</p>;
  }

  let currentDate = null;

  return (
    <div className="ta-timeline">
      {events.map(ev => {
        const showDate = ev.event_date !== currentDate;
        if (showDate) currentDate = ev.event_date;
        const ownerColor = ev.owner === 'kynan' ? 'var(--ta-blue)' : 'var(--ta-rose)';
        const catColor = ev.categories?.color || 'var(--ta-muted)';
        const d = new Date(ev.event_date + 'T00:00:00');

        return (
          <div key={ev.id}>
            {showDate && (
              <div className="tl-date-header">
                {d.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            )}
            <div
              className={`tl-item ${onEventClick ? 'tl-item--clickable' : ''}`}
              onClick={() => onEventClick?.(ev)}
            >
              <div className="tl-line" style={{ background: ownerColor }} />
              <div className="tl-dot" style={{ background: catColor }}>
                {getIcon(ev.categories?.icon || 'calendar', 12)}
              </div>
              <div className="tl-body">
                <span className="tl-title">{ev.title}</span>
                <span className="tl-time">
                  {ev.start_time ? ev.start_time.slice(0, 5) : 'All day'}
                  {ev.is_shared ? ' · Shared' : ''}
                  {ev.end_date ? ` · Until ${ev.end_date}` : ''}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
