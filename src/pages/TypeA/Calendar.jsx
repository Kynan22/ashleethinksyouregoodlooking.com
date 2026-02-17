import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Settings, Plus, Heart, LayoutGrid, List, Clock } from 'lucide-react';
import * as AllIcons from 'lucide-react';
import { supabase } from '../../supabase';
import { usePerson } from '../../hooks/usePerson';
import PersonToggle from './PersonToggle';
import DateReminder from './DateReminder';
import Timeline from './Timeline';
import EventModal from './EventModal';
import CategorySettings from './CategorySettings';

function getIcon(name, size = 14) {
  const pascal = name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  const Icon = AllIcons[pascal] || AllIcons.Calendar;
  return <Icon size={size} />;
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function Calendar() {
  const { person } = usePerson();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [personFilter, setPersonFilter] = useState('both');
  const [view, setView] = useState('grid');
  const [freeTimeMode, setFreeTimeMode] = useState(false);
  const [events, setEvents] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCategorySettings, setShowCategorySettings] = useState(false);
  const [eventModalPrefill, setEventModalPrefill] = useState({});
  const [editEvent, setEditEvent] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey(k => k + 1);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const monthName = firstDay.toLocaleString('en-AU', { month: 'long' });

  // Load events
  useEffect(() => {
    async function load() {
      const startDate = `${year}-${String(month+1).padStart(2,'0')}-01`;
      const endMonth = month + 2 > 12 ? 1 : month + 2;
      const endYear = month + 2 > 12 ? year + 1 : year;
      const endDate = `${endYear}-${String(endMonth).padStart(2,'0')}-01`;

      let query = supabase
        .from('events')
        .select('*, categories(*)')
        .or(`event_date.gte.${startDate},end_date.gte.${startDate}`)
        .or(`event_date.lt.${endDate},end_date.lt.${endDate}`)
        .lte('event_date', endDate);

      if (personFilter !== 'both') {
        query = query.or(`owner.eq.${personFilter},is_shared.eq.true`);
      }

      const { data } = await query;
      setEvents(data || []);

      // Load availability
      const { data: avail } = await supabase
        .from('availability')
        .select('person, free_date')
        .gte('free_date', startDate)
        .lt('free_date', endDate);

      setAvailability(avail || []);
    }

    load();
  }, [year, month, personFilter, refreshKey]);

  // Get events for a specific date, including multi-day events that span this date
  const getEventsForDate = (dateStr) => events.filter(e => {
    if (e.event_date === dateStr) return true;
    if (e.end_date && e.event_date <= dateStr && e.end_date >= dateStr) return true;
    return false;
  });

  const getAvailabilityForDate = (dateStr) => {
    const people = new Set(availability.filter(a => a.free_date === dateStr).map(a => a.person));
    if (people.size === 2) return 'both';
    if (people.has('kynan')) return 'kynan';
    if (people.has('ashlee')) return 'ashlee';
    return null;
  };

  // Check if a date has no events from anyone
  const isDayFree = (dateStr) => {
    const dayEvents = getEventsForDate(dateStr);
    return dayEvents.length === 0;
  };

  const toggleFreeTime = async (dateStr) => {
    if (!person) return;
    const existing = availability.find(a => a.free_date === dateStr && a.person === person);
    if (existing) {
      await supabase.from('availability').delete().eq('person', person).eq('free_date', dateStr);
    } else {
      await supabase.from('availability').insert({ person, free_date: dateStr });
    }
    refresh();
  };

  const handleDayClick = (dateStr) => {
    if (freeTimeMode) {
      toggleFreeTime(dateStr);
    }
  };

  const handleEventClick = (e, ev) => {
    e.stopPropagation();
    setEditEvent(ev);
    setEventModalPrefill({});
    setShowEventModal(true);
  };

  const openQuickDate = (dateStr) => {
    setEditEvent(null);
    setEventModalPrefill({ date: dateStr, shared: true });
    setShowEventModal(true);
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  return (
    <>
      <DateReminder />

      {/* Toolbar */}
      <div className="cal-toolbar">
        <div className="cal-toolbar-group">
          <PersonToggle value={personFilter} onChange={setPersonFilter} />
        </div>
        <div className="cal-toolbar-group">
          <div className="ta-view-toggle">
            <button className={`ta-view-btn ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')}>
              <LayoutGrid size={14} /> Grid
            </button>
            <button className={`ta-view-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
              <List size={14} /> Timeline
            </button>
          </div>
          <button
            className={`free-time-btn ${freeTimeMode ? 'active' : ''}`}
            onClick={() => setFreeTimeMode(!freeTimeMode)}
          >
            <Clock size={14} /> Free
          </button>
          <button className="cal-settings-btn" onClick={() => setShowCategorySettings(true)}>
            <Settings size={16} />
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <Timeline personFilter={personFilter} onEventClick={(ev) => { setEditEvent(ev); setEventModalPrefill({}); setShowEventModal(true); }} />
      ) : (
        <>
          {/* Month navigation */}
          <div className="cal-header">
            <button className="cal-nav-btn" onClick={prevMonth}><ChevronLeft size={18} /></button>
            <h2 className="cal-title">{monthName} {year}</h2>
            <button className="cal-nav-btn" onClick={nextMonth}><ChevronRight size={18} /></button>
          </div>

          {/* Calendar grid */}
          <div className="cal-grid">
            {DAYS.map((d, i) => (
              <div key={`dow-${i}`} className="cal-dow">{d}</div>
            ))}

            {/* Leading blanks */}
            {Array.from({ length: startDow }, (_, i) => (
              <div key={`blank-${i}`} className="cal-day cal-day--outside" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const isToday = dateStr === todayStr;
              const dayEvents = getEventsForDate(dateStr);
              const freeStatus = getAvailabilityForDate(dateStr);
              const dayIsFree = isDayFree(dateStr);

              let freeClass = '';
              if (freeTimeMode && dayIsFree) {
                freeClass = 'cal-day--free-highlight';
              } else if (freeStatus === 'both') {
                freeClass = 'cal-day--free-both';
              } else if (freeStatus === 'kynan') {
                freeClass = 'cal-day--free-kynan';
              } else if (freeStatus === 'ashlee') {
                freeClass = 'cal-day--free-ashlee';
              }

              return (
                <div
                  key={dateStr}
                  className={`cal-day ${isToday ? 'cal-day--today' : ''} ${freeClass}`}
                  onClick={() => handleDayClick(dateStr)}
                >
                  <span className="cal-num">{day}</span>
                  <div className="cal-events">
                    {dayEvents.slice(0, 3).map(ev => (
                      <button
                        key={ev.id}
                        className="cal-event-chip"
                        style={{ background: ev.categories?.color || '#999' }}
                        onClick={(e) => handleEventClick(e, ev)}
                        title={ev.title}
                      >
                        {getIcon(ev.categories?.icon || 'calendar', 11)}
                        <span className="cal-event-label">{ev.title}</span>
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="cal-event-more">+{dayEvents.length - 3}</span>
                    )}
                  </div>
                  {freeStatus === 'both' && !freeTimeMode && (
                    <button
                      className="cal-quick-date"
                      onClick={(e) => { e.stopPropagation(); openQuickDate(dateStr); }}
                      title="Plan a date!"
                    >
                      <Heart size={10} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* FAB */}
      <button className="ta-fab" onClick={() => { setEditEvent(null); setEventModalPrefill({}); setShowEventModal(true); }}>
        <Plus size={24} />
      </button>

      {/* Modals */}
      {showEventModal && (
        <EventModal
          onClose={() => { setShowEventModal(false); setEditEvent(null); }}
          onSaved={refresh}
          prefillDate={eventModalPrefill.date}
          prefillShared={eventModalPrefill.shared}
          existingEvent={editEvent}
        />
      )}
      {showCategorySettings && (
        <CategorySettings
          onClose={() => setShowCategorySettings(false)}
          onChanged={refresh}
        />
      )}
    </>
  );
}
