import { useState } from 'react';
import { Calendar as CalIcon, Heart, CheckSquare } from 'lucide-react';
import Layout from '../../components/Layout';
import Calendar from './Calendar';
import DatePlanner from './DatePlanner';
import BucketList from './BucketList';

const TABS = [
  { key: 'calendar', label: 'Calendar', icon: CalIcon },
  { key: 'planner', label: 'Date Planner', icon: Heart },
  { key: 'bucket', label: 'To Do', icon: CheckSquare },
];

export default function TypeA() {
  const [activeTab, setActiveTab] = useState('calendar');

  return (
    <div className="typea-page">
      <Layout title="Type A(shlee)" subtitle="Type A Type Beat" showBack={true}>
        {/* Tab bar */}
        <nav className="typea-tabs" role="tablist">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                className={`typea-tab ${activeTab === tab.key ? 'active' : ''}`}
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Tab panels */}
        <div className={`typea-panel ${activeTab === 'calendar' ? 'active' : ''}`} role="tabpanel">
          {activeTab === 'calendar' && <Calendar />}
        </div>
        <div className={`typea-panel ${activeTab === 'planner' ? 'active' : ''}`} role="tabpanel">
          {activeTab === 'planner' && <DatePlanner />}
        </div>
        <div className={`typea-panel ${activeTab === 'bucket' ? 'active' : ''}`} role="tabpanel">
          {activeTab === 'bucket' && <BucketList />}
        </div>
      </Layout>
    </div>
  );
}
