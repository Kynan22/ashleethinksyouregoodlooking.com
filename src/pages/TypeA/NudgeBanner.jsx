import { useState, useEffect } from 'react';
import { HeartHandshake } from 'lucide-react';
import { supabase } from '../../supabase';
import { usePerson } from '../../hooks/usePerson';

export default function NudgeBanner() {
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

  return (
    <div className="nudge-banner">
      <HeartHandshake size={24} color="var(--ta-red)" />
      <div className="nudge-content">
        <strong>{nudge.from_person === 'kynan' ? 'Kynan' : 'Ashlee'}</strong>{' '}
        <span>{nudge.message}</span>
      </div>
      <button className="ghost" onClick={dismiss}>Got it</button>
    </div>
  );
}
