import { useState, useEffect } from 'react';
import { Plus, Check, X, Camera, BookOpen } from 'lucide-react';
import { supabase } from '../../supabase';
import { usePerson } from '../../hooks/usePerson';
import Overlay from '../../components/Overlay';
import Memories from './Memories';

export default function BucketList() {
  const { person } = usePerson();
  const [items, setItems] = useState([]);
  const [lists, setLists] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [showAddList, setShowAddList] = useState(false);
  const [showMemories, setShowMemories] = useState(false);
  const [showDoneModal, setShowDoneModal] = useState(null);
  const [newListName, setNewListName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [doneNote, setDoneNote] = useState('');
  const [donePhoto, setDonePhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [{ data: listData }, { data: itemData }] = await Promise.all([
      supabase.from('todo_lists').select('*').order('sort_order').order('created_at'),
      supabase.from('bucket_items').select('*').order('is_done').order('sort_order').order('created_at', { ascending: false }),
    ]);
    setLists(listData || []);
    setItems(itemData || []);
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.category === filter);
  const doneCount = items.filter(i => i.is_done).length;
  const progress = items.length ? (doneCount / items.length) * 100 : 0;

  // Group items by list
  const grouped = {};
  filtered.forEach(item => {
    const listName = item.category || 'General';
    if (!grouped[listName]) grouped[listName] = [];
    grouped[listName].push(item);
  });

  async function handleMarkDone(item) {
    if (item.is_done) {
      // Unmark as done
      await supabase.from('bucket_items').update({
        is_done: false, done_date: null, done_note: null, done_photo_url: null,
      }).eq('id', item.id);
      loadAll();
    } else {
      // Show done modal
      setDoneNote('');
      setDonePhoto(null);
      setShowDoneModal(item);
    }
  }

  async function submitDone() {
    if (!showDoneModal) return;
    setUploading(true);

    let photoUrl = null;
    if (donePhoto) {
      const ext = donePhoto.name.split('.').pop();
      const path = `${showDoneModal.id}.${ext}`;
      const { error } = await supabase.storage.from('memories').upload(path, donePhoto, { upsert: true });
      if (!error) {
        const { data: urlData } = supabase.storage.from('memories').getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }
    }

    await supabase.from('bucket_items').update({
      is_done: true,
      done_date: new Date().toISOString().split('T')[0],
      done_note: doneNote.trim() || null,
      done_photo_url: photoUrl,
    }).eq('id', showDoneModal.id);

    setShowDoneModal(null);
    setUploading(false);
    loadAll();
  }

  async function addItem(e) {
    e.preventDefault();
    if (!newTitle.trim() || !newCategory) return;
    const { error } = await supabase.from('bucket_items').insert({
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      category: newCategory,
      added_by: person || 'kynan',
      sort_order: items.length,
    });
    if (error) {
      console.error('Failed to add item:', error);
      return;
    }
    setNewTitle('');
    setNewDesc('');
    setShowAdd(false);
    loadAll();
  }

  async function addList(e) {
    e.preventDefault();
    if (!newListName.trim()) return;
    await supabase.from('todo_lists').insert({
      name: newListName.trim(),
      sort_order: lists.length,
    });
    setNewListName('');
    setShowAddList(false);
    loadAll();
  }

  async function deleteList(listName) {
    // Delete all items in the list first, then the list itself
    await supabase.from('bucket_items').delete().eq('category', listName);
    await supabase.from('todo_lists').delete().eq('name', listName);
    if (filter === listName) setFilter('all');
    loadAll();
  }

  async function deleteItem(id) {
    await supabase.from('bucket_items').delete().eq('id', id);
    loadAll();
  }

  if (showMemories) {
    return <Memories onBack={() => setShowMemories(false)} />;
  }

  return (
    <>
      <div className="card ta-card">
        <div className="ta-header-row">
          <h2 className="ta-heading">To Do List</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="ghost" onClick={() => setShowMemories(true)}>
              <BookOpen size={14} style={{ marginRight: 4, verticalAlign: -2 }} /> Memories
            </button>
            <button className="ghost" onClick={() => { setNewCategory(lists.length ? lists[0].name : ''); setShowAdd(true); }}>
              <Plus size={14} style={{ marginRight: 4, verticalAlign: -2 }} /> Add
            </button>
          </div>
        </div>

        {/* Filter pills with add list button */}
        <div className="bucket-filters">
          <button
            className={`ta-pill-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          {lists.map(list => (
            <div key={list.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
              <button
                className={`ta-pill-btn ${filter === list.name ? 'active' : ''}`}
                onClick={() => setFilter(list.name)}
              >
                {list.name}
              </button>
              {filter === list.name && (
                <button
                  className="ta-delete-btn"
                  style={{ padding: 2, opacity: 0.5 }}
                  title={`Delete ${list.name}`}
                  onClick={() => {
                    if (confirm(`Delete "${list.name}" list and all its items?`)) deleteList(list.name);
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
          <button
            className="ta-pill-btn ta-pill-add"
            onClick={() => setShowAddList(true)}
          >
            <Plus size={12} />
          </button>
        </div>

        {/* Items grouped by list */}
        <div className="bucket-list">
          {filter === 'all' ? (
            Object.entries(grouped).length === 0 ? (
              <p className="ta-empty">No items yet. Create a list to get started!</p>
            ) : (
              Object.entries(grouped).map(([listName, listItems]) => (
                <div key={listName}>
                  <div className="bucket-group-header">{listName}</div>
                  {listItems.map(item => (
                    <BucketItem key={item.id} item={item} onToggle={handleMarkDone} onDelete={deleteItem} />
                  ))}
                </div>
              ))
            )
          ) : (
            filtered.length === 0 ? (
              <p className="ta-empty">No items in this list yet.</p>
            ) : (
              filtered.map(item => (
                <BucketItem key={item.id} item={item} onToggle={handleMarkDone} onDelete={deleteItem} />
              ))
            )
          )}
        </div>

        {/* Progress */}
        {items.length > 0 && (
          <>
            <div className="bucket-progress">
              <div className="bucket-progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <span className="bucket-progress-text">{doneCount}/{items.length} done</span>
          </>
        )}
      </div>

      {/* Add item modal */}
      {showAdd && (
        <Overlay onClose={() => setShowAdd(false)}>
          <div className="ta-modal" role="dialog" aria-modal="true">
            <div className="ta-modal-header">
              <h2 className="ta-modal-title">Add Item</h2>
              <button className="closeBtn" onClick={() => setShowAdd(false)}>
                <X size={18} />
              </button>
            </div>
            <form className="ta-modal-body" onSubmit={addItem}>
              <div className="ta-field">
                <label className="ta-label">What do you want to do?</label>
                <input className="ta-input" placeholder="Visit Japan together..."
                  value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
              </div>

              <div className="ta-field">
                <label className="ta-label">Description (optional)</label>
                <textarea className="ta-input ta-textarea" rows="2" placeholder="Any details..."
                  value={newDesc} onChange={e => setNewDesc(e.target.value)} />
              </div>

              <div className="ta-field">
                <label className="ta-label">List</label>
                <div className="ta-bucket-categories">
                  {lists.map(list => (
                    <button
                      key={list.id}
                      type="button"
                      className={`ta-pill-btn ${newCategory === list.name ? 'active' : ''}`}
                      onClick={() => setNewCategory(list.name)}
                    >
                      {list.name}
                    </button>
                  ))}
                </div>
                {lists.length === 0 && (
                  <p style={{ fontSize: 12, color: 'var(--ta-muted)', marginTop: 6 }}>
                    Create a list first using the + button.
                  </p>
                )}
              </div>

              <div className="ta-modal-actions">
                <button type="button" className="ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn-solid ta-btn-red" disabled={!newCategory}>Add to List</button>
              </div>
            </form>
          </div>
        </Overlay>
      )}

      {/* Add list modal */}
      {showAddList && (
        <Overlay onClose={() => setShowAddList(false)}>
          <div className="ta-modal" role="dialog" aria-modal="true">
            <div className="ta-modal-header">
              <h2 className="ta-modal-title">New List</h2>
              <button className="closeBtn" onClick={() => setShowAddList(false)}>
                <X size={18} />
              </button>
            </div>
            <form className="ta-modal-body" onSubmit={addList}>
              <div className="ta-field">
                <label className="ta-label">List Name</label>
                <input className="ta-input" placeholder="e.g. Travel, Date Ideas, Movies..."
                  value={newListName} onChange={e => setNewListName(e.target.value)} required />
              </div>
              <div className="ta-modal-actions">
                <button type="button" className="ghost" onClick={() => setShowAddList(false)}>Cancel</button>
                <button type="submit" className="btn-solid ta-btn-red">Create List</button>
              </div>
            </form>
          </div>
        </Overlay>
      )}

      {/* Mark as done modal */}
      {showDoneModal && (
        <Overlay onClose={() => setShowDoneModal(null)}>
          <div className="ta-modal" role="dialog" aria-modal="true">
            <div className="ta-modal-header">
              <h2 className="ta-modal-title">Mark as Done</h2>
              <button className="closeBtn" onClick={() => setShowDoneModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="ta-modal-body">
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>{showDoneModal.title}</p>

              <div className="ta-field">
                <label className="ta-label">Add a memory note (optional)</label>
                <textarea className="ta-input ta-textarea" rows="2" placeholder="How was it?"
                  value={doneNote} onChange={e => setDoneNote(e.target.value)} />
              </div>

              <div className="ta-field">
                <label className="ta-label">Add a photo (optional)</label>
                <label className="ta-photo-upload">
                  <Camera size={16} />
                  <span>{donePhoto ? donePhoto.name : 'Choose photo...'}</span>
                  <input type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => setDonePhoto(e.target.files[0] || null)} />
                </label>
              </div>

              <div className="ta-modal-actions">
                <button className="ghost" onClick={() => {
                  // Skip photo/note, just mark done
                  setDoneNote('');
                  setDonePhoto(null);
                  submitDone();
                }}>Skip</button>
                <button className="btn-solid ta-btn-red" onClick={submitDone} disabled={uploading}>
                  {uploading ? 'Saving...' : 'Save Memory'}
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}
    </>
  );
}

function BucketItem({ item, onToggle, onDelete }) {
  return (
    <div className={`bucket-item ${item.is_done ? 'done' : ''}`}>
      <button
        className={`bucket-check ${item.is_done ? 'checked' : ''}`}
        onClick={() => onToggle(item)}
      >
        {item.is_done && <Check size={14} />}
      </button>
      <div className="bucket-content">
        <span className="bucket-title">{item.title}</span>
        <span className="bucket-meta">
          {item.added_by === 'kynan' ? 'Kynan' : 'Ashlee'}
          {item.done_date && ` · Done ${item.done_date}`}
        </span>
      </div>
      <button className="ta-delete-btn" onClick={() => onDelete(item.id)} title="Remove">
        <X size={14} />
      </button>
    </div>
  );
}
