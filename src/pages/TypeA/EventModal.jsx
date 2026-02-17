import { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { supabase } from '../../supabase';
import { usePerson } from '../../hooks/usePerson';
import Overlay from '../../components/Overlay';

function getIcon(name, size = 14) {
  const pascal = name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  const Icon = Icons[pascal] || Icons.Calendar;
  return <Icon size={size} />;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ['00', '15', '30', '45'];

function parseTimeTo12h(time24) {
  if (!time24) return { hour: '12', minute: '00', period: 'AM' };
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const nearestMin = MINUTES.reduce((prev, curr) =>
    Math.abs(parseInt(curr) - m) < Math.abs(parseInt(prev) - m) ? curr : prev
  );
  return { hour: String(hour12), minute: nearestMin, period };
}

function to24h(hour, minute, period) {
  let h = parseInt(hour);
  if (period === 'AM' && h === 12) h = 0;
  if (period === 'PM' && h !== 12) h += 12;
  return `${String(h).padStart(2, '0')}:${minute}`;
}

export default function EventModal({ onClose, onSaved, prefillDate, prefillShared, existingEvent }) {
  const { person } = usePerson();
  const isEdit = !!existingEvent;

  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState(existingEvent?.title || '');
  const [eventDate, setEventDate] = useState(existingEvent?.event_date || prefillDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(existingEvent?.end_date || '');
  const [owner, setOwner] = useState(existingEvent?.owner || person || 'kynan');
  const [categoryId, setCategoryId] = useState(existingEvent?.category_id || '');
  const [notes, setNotes] = useState(existingEvent?.notes || '');
  const [isShared, setIsShared] = useState(existingEvent?.is_shared || prefillShared || false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Time picker state
  const startParsed = parseTimeTo12h(existingEvent?.start_time);
  const endParsed = parseTimeTo12h(existingEvent?.end_time);
  const [useTime, setUseTime] = useState(!!(existingEvent?.start_time));
  const [startHour, setStartHour] = useState(startParsed.hour);
  const [startMinute, setStartMinute] = useState(startParsed.minute);
  const [startPeriod, setStartPeriod] = useState(startParsed.period);
  const [endHour, setEndHour] = useState(endParsed.hour);
  const [endMinute, setEndMinute] = useState(endParsed.minute);
  const [endPeriod, setEndPeriod] = useState(endParsed.period);

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      setCategories(data || []);
      if (data?.length && !categoryId) {
        const dateCat = data.find(c => c.name === 'Date');
        setCategoryId(prefillShared && dateCat ? dateCat.id : data[0].id);
      }
    });
  }, []);

  // Auto-shared when Date category selected
  const handleCategoryChange = (catId) => {
    setCategoryId(catId);
    const cat = categories.find(c => c.id === catId);
    if (cat && cat.name === 'Date') {
      setIsShared(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !categoryId) return;
    setSaving(true);

    const startTime = useTime ? to24h(startHour, startMinute, startPeriod) : null;
    const endTime = useTime ? to24h(endHour, endMinute, endPeriod) : null;

    const eventData = {
      title: title.trim(),
      event_date: eventDate,
      end_date: endDate || null,
      owner,
      category_id: categoryId,
      start_time: startTime,
      end_time: endTime,
      notes: notes.trim() || null,
      is_shared: isShared,
    };

    if (isEdit) {
      const { error } = await supabase.from('events').update(eventData).eq('id', existingEvent.id);
      if (!error) {
        onSaved?.();
        onClose();
      }
    } else {
      const { data, error } = await supabase.from('events').insert(eventData).select().single();
      if (!error && data) {
        const cat = categories.find(c => c.id === categoryId);
        if (cat && cat.name === 'Date') {
          await supabase.from('date_log').insert({
            event_id: data.id,
            date_date: eventDate,
            title: title.trim(),
          });
        }
        onSaved?.();
        onClose();
      }
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    if (!existingEvent) return;
    await supabase.from('events').delete().eq('id', existingEvent.id);
    onSaved?.();
    onClose();
  };

  return (
    <Overlay onClose={onClose}>
      <div className="ta-modal" role="dialog" aria-modal="true">
        <div className="ta-modal-header">
          <h2 className="ta-modal-title">{isEdit ? 'Edit Event' : 'Add Event'}</h2>
          <button className="closeBtn" onClick={onClose}>
            <Icons.X size={18} />
          </button>
        </div>
        <form className="ta-modal-body" onSubmit={handleSubmit}>
          <div className="ta-field">
            <label className="ta-label" htmlFor="eventTitle">Title</label>
            <input className="ta-input" id="eventTitle" type="text" required
              placeholder="What's happening?" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="ta-field-row">
            <div className="ta-field" style={{ flex: 1 }}>
              <label className="ta-label" htmlFor="eventDate">Start Date</label>
              <input className="ta-input" id="eventDate" type="date" required
                value={eventDate} onChange={e => setEventDate(e.target.value)} />
            </div>
            <div className="ta-field" style={{ flex: 1 }}>
              <label className="ta-label" htmlFor="eventEndDate">End Date <span style={{ fontWeight: 400, textTransform: 'none' }}>(multi-day)</span></label>
              <input className="ta-input" id="eventEndDate" type="date"
                value={endDate} onChange={e => setEndDate(e.target.value)}
                min={eventDate} />
            </div>
          </div>

          <div className="ta-field-row">
            <div className="ta-field" style={{ flex: 1 }}>
              <label className="ta-label" htmlFor="eventOwner">Who</label>
              <select className="ta-input ta-select" id="eventOwner"
                value={owner} onChange={e => setOwner(e.target.value)}>
                <option value="kynan">Kynan</option>
                <option value="ashlee">Ashlee</option>
              </select>
            </div>
          </div>

          <div className="ta-field">
            <label className="ta-label">Category</label>
            <div className="ta-category-picker">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  className={`ta-cat-chip ${categoryId === cat.id ? 'selected' : ''}`}
                  style={{ '--cat-color': cat.color }}
                  onClick={() => handleCategoryChange(cat.id)}
                >
                  {getIcon(cat.icon, 14)} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Time picker */}
          <div className="ta-field">
            <label className="ta-checkbox-row" style={{ marginBottom: 8 }}>
              <input type="checkbox" checked={useTime} onChange={e => setUseTime(e.target.checked)} />
              <span>Set time</span>
            </label>
            {useTime && (
              <div className="ta-field-row" style={{ flexWrap: 'wrap' }}>
                <div className="ta-field" style={{ flex: 1, minWidth: 140 }}>
                  <label className="ta-label">Start</label>
                  <div className="ta-time-picker">
                    <select className="ta-time-select" value={startHour} onChange={e => setStartHour(e.target.value)}>
                      {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span className="ta-time-sep">:</span>
                    <select className="ta-time-select" value={startMinute} onChange={e => setStartMinute(e.target.value)}>
                      {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select className="ta-time-select" value={startPeriod} onChange={e => setStartPeriod(e.target.value)}>
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
                <div className="ta-field" style={{ flex: 1, minWidth: 140 }}>
                  <label className="ta-label">End</label>
                  <div className="ta-time-picker">
                    <select className="ta-time-select" value={endHour} onChange={e => setEndHour(e.target.value)}>
                      {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span className="ta-time-sep">:</span>
                    <select className="ta-time-select" value={endMinute} onChange={e => setEndMinute(e.target.value)}>
                      {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select className="ta-time-select" value={endPeriod} onChange={e => setEndPeriod(e.target.value)}>
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="ta-field">
            <label className="ta-label" htmlFor="eventNotes">Notes</label>
            <textarea className="ta-input ta-textarea" id="eventNotes" rows="2"
              placeholder="Optional..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <label className="ta-checkbox-row">
            <input type="checkbox" checked={isShared} onChange={e => setIsShared(e.target.checked)} />
            <span>Shared event (both of us)</span>
          </label>

          <div className="ta-modal-actions">
            {isEdit && (
              confirmDelete ? (
                <>
                  <span style={{ fontSize: 13, color: 'var(--ta-muted)', marginRight: 'auto' }}>Are you sure?</span>
                  <button type="button" className="ghost" onClick={() => setConfirmDelete(false)}>No</button>
                  <button type="button" className="btn-solid" style={{ background: '#dc2626', color: 'white' }} onClick={handleDelete}>Delete</button>
                </>
              ) : (
                <button type="button" className="ghost" onClick={() => setConfirmDelete(true)} style={{ marginRight: 'auto', color: '#dc2626' }}>
                  <Icons.Trash2 size={14} style={{ marginRight: 4, verticalAlign: -2 }} /> Delete
                </button>
              )
            )}
            {!confirmDelete && (
              <>
                <button type="button" className="ghost" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn-solid ta-btn-red" disabled={saving}>
                  {saving ? 'Saving...' : isEdit ? 'Update' : 'Save Event'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </Overlay>
  );
}
