import { useState, useEffect } from 'react';
import { HeartHandshake, X } from 'lucide-react';
import { supabase } from '../supabase';
import { usePerson } from '../hooks/usePerson';

export default function NudgeNotification() {
  const { person } = usePerson();
  const [nudge, setNudge] = useState(null);

  useEffect(() => {
    if (!person) return;

    async function checkNudges() {
      const { data } = await supabase
        .from('nudges')
        .select('*')
        .eq('to_person', person)
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setNudge(data);
    }

    checkNudges();
  }, [person]);

  const dismiss = async () => {
    if (!nudge) return;
    await supabase.from('nudges').update({ read_at: new Date().toISOString() }).eq('id', nudge.id);
    setNudge(null);
  };

  if (!nudge) return null;

  const fromName = nudge.from_person === 'kynan' ? 'Kynan' : 'Ashlee';

  return (
    <div className="nudge-toast">
      <HeartHandshake size={24} color="var(--sage)" />
      <div className="nudge-toast-body">
        <strong>{fromName}</strong> {nudge.message}
      </div>
      <button className="nudge-toast-close" onClick={dismiss} aria-label="Dismiss">
        <X size={18} />
      </button>
    </div>
  );
}
