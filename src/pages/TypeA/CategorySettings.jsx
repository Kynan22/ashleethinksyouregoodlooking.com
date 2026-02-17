import { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { supabase } from '../../supabase';
import Overlay from '../../components/Overlay';
import { ICON_NAMES } from './icons';

function getIcon(name, size = 18) {
  const pascal = name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  const Icon = Icons[pascal] || Icons.Calendar;
  return <Icon size={size} />;
}

export default function CategorySettings({ onClose, onChanged }) {
  const [categories, setCategories] = useState([]);
  const [iconPickerFor, setIconPickerFor] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    setCategories(data || []);
  }

  async function updateCategory(id, field, value) {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    await supabase.from('categories').update({ [field]: value }).eq('id', id);
    onChanged?.();
  }

  async function addCategory() {
    const { data } = await supabase.from('categories').insert({
      name: 'New Category',
      icon: 'calendar',
      color: '#E85D75',
      sort_order: categories.length,
    }).select().single();
    if (data) setCategories(prev => [...prev, data]);
    onChanged?.();
  }

  async function deleteCategory(id) {
    await supabase.from('categories').delete().eq('id', id);
    setCategories(prev => prev.filter(c => c.id !== id));
    onChanged?.();
  }

  return (
    <Overlay onClose={onClose}>
      <div className="ta-modal ta-modal--wide" role="dialog" aria-modal="true">
        <div className="ta-modal-header">
          <h2 className="ta-modal-title">Category Settings</h2>
          <button className="closeBtn" onClick={onClose}>
            <Icons.X size={18} />
          </button>
        </div>
        <div className="ta-modal-body">
          <div className="ta-category-list">
            {categories.map(cat => (
              <div key={cat.id} className="ta-category-row">
                <button
                  className="ta-icon-option"
                  style={{ color: cat.color }}
                  onClick={() => setIconPickerFor(iconPickerFor === cat.id ? null : cat.id)}
                  title="Change icon"
                >
                  {getIcon(cat.icon, 18)}
                </button>

                <input
                  type="color"
                  value={cat.color}
                  onChange={e => updateCategory(cat.id, 'color', e.target.value)}
                />

                <input
                  type="text"
                  value={cat.name}
                  onChange={e => updateCategory(cat.id, 'name', e.target.value)}
                />

                <button className="ta-delete-btn" onClick={() => deleteCategory(cat.id)} title="Delete">
                  <Icons.Trash2 size={16} />
                </button>

                {iconPickerFor === cat.id && (
                  <div className="ta-icon-picker" style={{ gridColumn: '1 / -1' }}>
                    {ICON_NAMES.map(name => (
                      <button
                        key={name}
                        className={`ta-icon-option ${cat.icon === name ? 'selected' : ''}`}
                        onClick={() => { updateCategory(cat.id, 'icon', name); setIconPickerFor(null); }}
                        title={name}
                      >
                        {getIcon(name, 16)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button className="ghost" onClick={addCategory} style={{ marginTop: 12 }}>
            + Add Category
          </button>
        </div>
      </div>
    </Overlay>
  );
}
