import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, BellOff, CheckCircle } from 'lucide-react';
import Layout from './components/Layout';
import RitualCard, { RitualType } from './components/RitualCard';
import SplashScreen from './components/SplashScreen';
import HabitEditor from './components/HabitEditor';
import { haptics } from './utils/haptics';
import { notifications, NotificationStatus } from './utils/notifications';

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

const RITUALS_STORAGE_KEY = 'zen-reminders-rituals';

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

function minutesFromTime(value?: string) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) {
    return null;
  }

  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function timeFromMinutes(totalMinutes: number) {
  const minutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function getReminderTimes(ritual: Ritual) {
  const start = minutesFromTime(ritual.startTime);
  const end = minutesFromTime(ritual.endTime);

  if (start === null) {
    return [];
  }

  if (!ritual.total || ritual.total <= 1 || end === null || end <= start) {
    return [timeFromMinutes(start)];
  }

  const step = (end - start) / (ritual.total - 1);
  const slots = Array.from({ length: ritual.total }, (_, index) =>
    timeFromMinutes(Math.round(start + step * index)),
  );

  return Array.from(new Set(slots));
}

function loadInitialRituals() {
  if (typeof window === 'undefined') {
    return INITIAL_RITUALS;
  }

  const saved = window.localStorage.getItem(RITUALS_STORAGE_KEY);

  if (!saved) {
    return INITIAL_RITUALS;
  }

  try {
    const parsed = JSON.parse(saved) as Ritual[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_RITUALS;
  } catch {
    return INITIAL_RITUALS;
  }
}

function statusCopy(status: NotificationStatus) {
  switch (status) {
    case 'granted':
      return 'Reminders are enabled.';
    case 'denied':
      return 'Notifications are blocked for this site in Safari settings.';
    case 'install-required':
      return 'On iPhone, install this app to the Home Screen before Safari will allow reminders.';
    case 'unsupported':
      return 'This browser does not expose notifications for this app.';
    default:
      return 'Enable reminders so your ritual windows can alert you.';
  }
}

function getVisibleHomeRituals(rituals: Ritual[]) {
  return rituals.filter((ritual) => ritual.current < ritual.total);
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'list' | 'check'>('home');
  const [rituals, setRituals] = useState<Ritual[]>(loadInitialRituals);
  const [isAdding, setIsAdding] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Ritual | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus>('default');
  const lastNotifiedRef = useRef<Record<string, string>>({});

  useEffect(() => {
    void notifications
      .registerServiceWorker()
      .catch(() => null)
      .then(() => {
        setNotificationStatus(notifications.getStatus());
      });
  }, []);

  useEffect(() => {
    window.localStorage.setItem(RITUALS_STORAGE_KEY, JSON.stringify(rituals));
  }, [rituals]);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const dayKey = now.toISOString().slice(0, 10);

      rituals.forEach((ritual) => {
        const notificationKey = `${dayKey}:${currentTime}`;
        const reminderTimes = getReminderTimes(ritual);

        if (
          reminderTimes.includes(currentTime) &&
          lastNotifiedRef.current[ritual.id] !== notificationKey
        ) {
          void notifications.show(
            `Ritual Time: ${ritual.title}`,
            `It is time for your ${ritual.title.toLowerCase()} ritual.`,
            { tag: `${ritual.id}:${notificationKey}` },
          );
          lastNotifiedRef.current[ritual.id] = notificationKey;
        }
      });
    };

    checkReminders();
    const interval = window.setInterval(checkReminders, 15000);
    return () => window.clearInterval(interval);
  }, [rituals]);

  const handleEnableNotifications = async () => {
    const granted = await notifications.requestPermission();
    const nextStatus = notifications.getStatus();
    setNotificationStatus(nextStatus);

    if (granted) {
      haptics.success();
      await notifications.show('Zen Reminders Enabled', 'Your ritual reminders are ready.', {
        tag: 'notifications-enabled',
      });
      return;
    }

    haptics.warning();
  };

  const handleRitualClick = (id: string) => {
    setRituals((prev) =>
      prev.map((ritual) => {
        if (ritual.id !== id) {
          return ritual;
        }

        const nextValue = Math.min(ritual.total, ritual.current + 1);

        if (nextValue === ritual.total && ritual.current !== ritual.total) {
          haptics.success();
        } else if (ritual.current !== ritual.total) {
          haptics.medium();
        }

        return { ...ritual, current: nextValue };
      }),
    );
  };

  const handleAddHabit = (newHabit: Ritual) => {
    setRituals((prev) => [...prev, newHabit]);
    setIsAdding(false);
  };

  const handleUpdateHabit = (updatedHabit: Ritual) => {
    setRituals((prev) => prev.map((ritual) => (ritual.id === updatedHabit.id ? updatedHabit : ritual)));
    setEditingHabit(null);
  };

  const handleDeleteHabit = (id: string) => {
    setRituals((prev) => prev.filter((ritual) => ritual.id !== id));
    setEditingHabit(null);
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  const visibleHomeRituals = getVisibleHomeRituals(rituals);

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
              <p className="mb-2 text-[10px] uppercase tracking-widest text-on-surface-variant">The Daily Path</p>
              <h2 className="text-6xl leading-none tracking-[-0.04em] text-primary md:text-8xl">The Rituals</h2>
            </section>

            <AnimatePresence initial={false}>
              {notificationStatus !== 'granted' && (
                <motion.section
                  key="notification-status"
                  layout
                  initial={{ opacity: 0, y: 24, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -28, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
                  className="overflow-hidden rounded-[2rem] border border-outline-variant/40 bg-surface-container-low px-6 py-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Reminder Status</p>
                      <h3 className="text-2xl font-bold tracking-tight">Notifications need setup</h3>
                      <p className="max-w-md text-sm text-on-surface-variant">{statusCopy(notificationStatus)}</p>
                    </div>
                    <div className="rounded-full border border-outline-variant/50 p-3 text-primary">
                      <BellOff size={22} />
                    </div>
                  </div>

                  {notificationStatus !== 'denied' && (
                    <button
                      onClick={() => void handleEnableNotifications()}
                      className="mt-5 rounded-full bg-primary px-5 py-3 text-sm font-medium text-on-primary transition-transform duration-300 active:scale-95"
                    >
                      Enable Reminders
                    </button>
                  )}
                </motion.section>
              )}
            </AnimatePresence>

            <motion.div layout className="grid grid-cols-1 items-start gap-8 md:grid-cols-12">
              <AnimatePresence initial={false}>
                {visibleHomeRituals[0] && (
                  <motion.div
                    key={visibleHomeRituals[0].id}
                    layout
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -28, scale: 0.94 }}
                    transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
                    className="md:col-span-7"
                  >
                    <RitualCard
                      ritual={visibleHomeRituals[0]}
                      onClick={() => handleRitualClick(visibleHomeRituals[0].id)}
                    />
                  </motion.div>
                )}

                {visibleHomeRituals.length > 1 && (
                  <motion.div
                    key="spacer-a"
                    layout
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
                    className="hidden h-24 md:col-span-5 md:block"
                  />
                )}
                {visibleHomeRituals.length > 2 && (
                  <motion.div
                    key="spacer-b"
                    layout
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
                    className="hidden h-24 md:col-span-2 md:block"
                  />
                )}

                {visibleHomeRituals[1] && (
                  <motion.div
                    key={visibleHomeRituals[1].id}
                    layout
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -28, scale: 0.94 }}
                    transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
                    className="md:col-span-6 md:-mt-32"
                  >
                    <RitualCard
                      ritual={visibleHomeRituals[1]}
                      onClick={() => handleRitualClick(visibleHomeRituals[1].id)}
                    />
                  </motion.div>
                )}

                {visibleHomeRituals[2] && (
                  <motion.div
                    key={visibleHomeRituals[2].id}
                    layout
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -28, scale: 0.94 }}
                    transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
                    className="md:col-span-5"
                  >
                    <RitualCard
                      ritual={visibleHomeRituals[2]}
                      onClick={() => handleRitualClick(visibleHomeRituals[2].id)}
                    />
                  </motion.div>
                )}

                {visibleHomeRituals.slice(3).map((ritual) => (
                  <motion.div
                    key={ritual.id}
                    layout
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -28, scale: 0.94 }}
                    transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
                    className="md:col-span-6"
                  >
                    <RitualCard ritual={ritual} onClick={() => handleRitualClick(ritual.id)} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="space-y-8">
            <h2 className="text-4xl font-black tracking-tight">Your Journey</h2>
            <div className="space-y-4">
              {rituals.map((ritual) => (
                <div
                  key={ritual.id}
                  onClick={() => setEditingHabit(ritual)}
                  className="cursor-pointer rounded-xl bg-surface-container-low p-6 transition-colors duration-300 hover:bg-surface-container"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold">{ritual.title}</h3>
                      <p className="text-sm text-on-surface-variant">
                        {ritual.label}: {ritual.current}/{ritual.total}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-wider text-on-surface-variant">
                        {getReminderTimes(ritual).join(' • ')}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-outline-variant">
                      {Math.round((ritual.current / ritual.total) * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'check' && (
          <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface-container-highest">
              <CheckCircle size={48} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold">All Rituals Complete?</h2>
            <p className="max-w-xs text-on-surface-variant">
              Reflection is the mirror of the soul. Take a moment to breathe.
            </p>
          </div>
        )}
      </Layout>

      <AnimatePresence>
        {isAdding && <HabitEditor onClose={() => setIsAdding(false)} onSave={handleAddHabit} />}
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
