import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { CheckCircle } from 'lucide-react';
import Layout from './components/Layout';
import RitualCard, { RitualType } from './components/RitualCard';
import SplashScreen from './components/SplashScreen';
import HabitEditor from './components/HabitEditor';
import { haptics } from './utils/haptics';
import { notifications } from './utils/notifications';

interface Ritual {
  id: string;
  type: RitualType;
  title: string;
  current: number;
  total: number;
  label: string;
  startTime?: string;
  endTime?: string;
}

const INITIAL_RITUALS: Ritual[] = [
  {
    id: '1',
    type: 'water',
    title: 'Mineral Water',
    current: 1,
    total: 4,
    label: 'Frequency',
    startTime: '08:00',
    endTime: '22:00',
  },
  {
    id: '2',
    type: 'breath',
    title: 'Deep Breath',
    current: 3,
    total: 6,
    label: 'Balance',
    startTime: '09:00',
    endTime: '21:00',
  },
  {
    id: '3',
    type: 'stretch',
    title: 'Stretch',
    current: 0,
    total: 2,
    label: 'Stamina',
    startTime: '10:00',
    endTime: '20:00',
  },
];

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'list' | 'check'>('home');
  const [rituals, setRituals] = useState<Ritual[]>(INITIAL_RITUALS);
  const [isAdding, setIsAdding] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Ritual | null>(null);
  const lastNotifiedRef = useRef<Record<string, string>>({});

  useEffect(() => {
    notifications.requestPermission();
  }, []);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      rituals.forEach(ritual => {
        if (ritual.startTime === currentTime && lastNotifiedRef.current[ritual.id] !== currentTime) {
          notifications.show(
            `Ritual Time: ${ritual.title}`,
            `It's time for your ${ritual.title} ritual. Stay consistent.`
          );
          lastNotifiedRef.current[ritual.id] = currentTime;
        }
      });
    };

    const interval = setInterval(checkReminders, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [rituals]);

  const handleRitualClick = (id: string) => {
    setRituals(prev => prev.map(r => {
      if (r.id === id) {
        const nextValue = Math.min(r.total, r.current + 1);
        if (nextValue === r.total && r.current !== r.total) {
          haptics.success();
        } else if (r.current !== r.total) {
          haptics.medium();
        }
        return { ...r, current: nextValue };
      }
      return r;
    }));
  };

  const handleAddHabit = (newHabit: Ritual) => {
    setRituals(prev => [...prev, newHabit]);
    setIsAdding(false);
  };

  const handleUpdateHabit = (updatedHabit: Ritual) => {
    setRituals(prev => prev.map(r => r.id === updatedHabit.id ? updatedHabit : r));
    setEditingHabit(null);
  };

  const handleDeleteHabit = (id: string) => {
    setRituals(prev => prev.filter(r => r.id !== id));
    setEditingHabit(null);
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <>
      <Layout 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onAddClick={() => setIsAdding(true)}
      >
        {activeTab === 'home' && (
          <div className="space-y-12">
            <section className="mb-20">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">The Daily Path</p>
              <h2 className="font-black text-6xl md:text-8xl tracking-[-0.04em] text-primary leading-none">The Rituals</h2>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Staggered Layout Logic */}
              {rituals[0] && (
                <div className="md:col-span-7">
                  <RitualCard 
                    ritual={rituals[0]} 
                    onClick={() => handleRitualClick(rituals[0].id)} 
                  />
                </div>
              )}
              
              <div className="hidden md:block md:col-span-5 h-24" />
              <div className="hidden md:block md:col-span-2 h-24" />
              
              <div className="md:col-span-6 md:-mt-32">
                {rituals[1] && (
                  <RitualCard 
                    ritual={rituals[1]} 
                    onClick={() => handleRitualClick(rituals[1].id)} 
                  />
                )}
              </div>

              <div className="md:col-span-5">
                {rituals[2] && (
                  <RitualCard 
                    ritual={rituals[2]} 
                    onClick={() => handleRitualClick(rituals[2].id)} 
                  />
                )}
              </div>

              {/* Render any additional rituals */}
              {rituals.slice(3).map((ritual) => (
                <div key={ritual.id} className="md:col-span-6">
                  <RitualCard 
                    ritual={ritual} 
                    onClick={() => handleRitualClick(ritual.id)} 
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="space-y-8">
            <h2 className="text-4xl font-black tracking-tight">Your Journey</h2>
            <div className="space-y-4">
              {rituals.map(ritual => (
                <div 
                  key={ritual.id} 
                  onClick={() => setEditingHabit(ritual)}
                  className="p-6 bg-surface-container-low rounded-xl flex justify-between items-center cursor-pointer hover:bg-surface-container transition-colors duration-300"
                >
                  <div>
                    <h3 className="font-bold text-xl">{ritual.title}</h3>
                    <p className="text-sm text-on-surface-variant">{ritual.label}: {ritual.current}/{ritual.total}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center">
                    {Math.round((ritual.current / ritual.total) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'check' && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-surface-container-highest flex items-center justify-center">
              <CheckCircle size={48} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold">All Rituals Complete?</h2>
            <p className="text-on-surface-variant max-w-xs">Reflection is the mirror of the soul. Take a moment to breathe.</p>
          </div>
        )}
      </Layout>

      <AnimatePresence>
        {isAdding && (
          <HabitEditor 
            onClose={() => setIsAdding(false)} 
            onSave={handleAddHabit} 
          />
        )}
        {editingHabit && (
          <HabitEditor 
            initialHabit={editingHabit}
            onClose={() => setEditingHabit(null)} 
            onSave={handleUpdateHabit}
            onDelete={handleDeleteHabit}
          />
        )}
      </AnimatePresence>
    </>
  );
}
