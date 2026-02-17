import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '../../supabase';

export default function DateReminder() {
  const [daysSince, setDaysSince] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    async function check() {
      const today = new Date().toISOString().split('T')[0];

      // Last date event
      const { data: lastDate } = await supabase
        .from('date_log')
        .select('date_date')
        .order('date_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Any upcoming shared/date event
      const { data: futureDate } = await supabase
        .from('events')
        .select('event_date')
        .eq('is_shared', true)
        .gte('event_date', today)
        .order('event_date')
        .limit(1)
        .maybeSingle();

      if (lastDate) {
        const days = Math.floor((Date.now() - new Date(lastDate.date_date).getTime()) / 86400000);
        setDaysSince(days);
        setShow(days > 14 && !futureDate);
      }
    }

    check();
  }, []);

  if (!show) return null;

  return (
    <div className="date-reminder">
      <div className="date-reminder-heart">
        <Heart size={32} fill="var(--ta-red)" stroke="none" />
        <span className="date-counter-num">{daysSince}</span>
      </div>
      <p className="date-reminder-text">
        days since your last date — time to plan one!
      </p>
    </div>
  );
}
