import { useState, useEffect } from 'react';
import { Sparkles, Heart } from 'lucide-react';
import { supabase } from '../../supabase';
import { usePerson } from '../../hooks/usePerson';
import NudgeBanner from './NudgeBanner';
import Timeline from './Timeline';
import Overlay from '../../components/Overlay';
import { X } from 'lucide-react';

export default function DatePlanner() {
  const { person } = usePerson();
  const [lists, setLists] = useState([]);
  const [idea, setIdea] = useState(null);
  const [showListPicker, setShowListPicker] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.from('todo_lists').select('*').order('sort_order').then(({ data }) => {
      setLists(data || []);
    });
  }, []);

  const pickFromList = async (listName) => {
    const { data } = await supabase
      .from('bucket_items')
      .select('*')
      .eq('category', listName)
      .eq('is_done', false);

    if (data && data.length > 0) {
      const random = data[Math.floor(Math.random() * data.length)];
      setIdea({ text: random.title, list: listName });
    } else {
      setIdea({ text: 'No items left in this list!', list: listName });
    }
    setShowListPicker(false);
  };

  const sendNudge = async () => {
    if (!person) return;
    setSending(true);
    const toPerson = person === 'kynan' ? 'ashlee' : 'kynan';
    const { error } = await supabase.from('nudges').insert({
      from_person: person,
      to_person: toPerson,
      message: 'Hey! I love you 💕',
      nudge_type: 'nudge',
    });
    setSending(false);
    if (error) {
      console.error('Nudge insert failed:', error);
      return;
    }
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  return (
    <>
      <NudgeBanner />

      {/* Idea generator */}
      <div className="card ta-card">
        <h2 className="ta-heading">Need a date idea?</h2>

        {idea && (
          <div className="idea-card">
            <span className="idea-icon"><Sparkles size={24} /></span>
            <div>
              <span className="idea-text">{idea.text}</span>
              {idea.list && <span style={{ fontSize: 12, color: 'var(--ta-muted)', display: 'block', marginTop: 2 }}>from {idea.list}</span>}
            </div>
          </div>
        )}

        <div className="spin-row">
          <button className="btn-solid ta-btn-red" onClick={() => setShowListPicker(true)}>
            <Sparkles size={16} style={{ marginRight: 6, verticalAlign: -2 }} />
            Surprise Me
          </button>
        </div>
      </div>

      {/* Send a nudge */}
      <div className="card ta-card">
        <h2 className="ta-heading">Send a Nudge</h2>
        <p className="ta-subtext">Let them know you're thinking about them</p>

        <button
          className="btn-solid ta-btn-red"
          onClick={sendNudge}
          disabled={!person || sending || sent}
          style={{ width: '100%' }}
        >
          <Heart size={16} style={{ marginRight: 6, verticalAlign: -2 }} />
          {sent ? 'Nudge sent!' : sending ? 'Sending...' : !person ? 'Loading...' : 'Send a Nudge'}
        </button>
      </div>

      {/* Upcoming dates */}
      <div className="card ta-card">
        <h2 className="ta-heading">Upcoming Dates</h2>
        <Timeline personFilter="both" categoryFilter="Date" />
      </div>

      {/* List picker modal */}
      {showListPicker && (
        <Overlay onClose={() => setShowListPicker(false)}>
          <div className="ta-modal" role="dialog" aria-modal="true">
            <div className="ta-modal-header">
              <h2 className="ta-modal-title">Pick a list</h2>
              <button className="closeBtn" onClick={() => setShowListPicker(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="ta-modal-body">
              {lists.length === 0 ? (
                <p className="ta-empty">No lists yet. Create some in the To Do tab!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {lists.map(list => (
                    <button
                      key={list.id}
                      className="btn-solid"
                      style={{ background: 'var(--ta-surface)', color: 'var(--ta-ink)', boxShadow: 'none', textAlign: 'left' }}
                      onClick={() => pickFromList(list.name)}
                    >
                      {list.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Overlay>
      )}
    </>
  );
}
