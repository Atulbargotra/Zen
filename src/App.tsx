import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bell, BellOff } from "lucide-react";
import Layout from "./components/Layout";
import RitualCard, { RitualType } from "./components/RitualCard";
import HabitEditor from "./components/HabitEditor";
import { haptics } from "./utils/haptics";
import { notifications, NotificationStatus } from "./utils/notifications";
import {
  RitualCardVariant,
  RitualIconPreset,
  getMeaningfulIconPreset,
  getRandomCardVariant,
} from "./utils/ritualPresentation";

interface Ritual {
  id: string;
  type: RitualType;
  title: string;
  current: number;
  total: number;
  label: string;
  cardVariant?: RitualCardVariant;
  iconPreset?: RitualIconPreset;
  startTime?: string;
  endTime?: string;
}

const RITUALS_STORAGE_KEY = "zen-reminders-rituals";
const RITUAL_HISTORY_STORAGE_KEY = "zen-reminders-history";

interface RitualHistoryRecord {
  date: string;
  completed: number;
  planned: number;
  rituals: Array<{
    id: string;
    title: string;
    completed: number;
    planned: number;
  }>;
}

const INITIAL_RITUALS: Ritual[] = [
  {
    id: "1",
    type: "water",
    title: "Mineral Water",
    current: 1,
    total: 4,
    label: "Frequency",
    cardVariant: "water",
    iconPreset: "water",
    startTime: "08:00",
    endTime: "22:00",
  },
  {
    id: "2",
    type: "breath",
    title: "Deep Breath",
    current: 3,
    total: 6,
    label: "Balance",
    cardVariant: "breath",
    iconPreset: "breath",
    startTime: "09:00",
    endTime: "21:00",
  },
  {
    id: "3",
    type: "stretch",
    title: "Stretch",
    current: 0,
    total: 2,
    label: "Stamina",
    cardVariant: "stretch",
    iconPreset: "stretch",
    startTime: "10:00",
    endTime: "20:00",
  },
];

function withPresentation(ritual: Ritual) {
  return {
    ...ritual,
    cardVariant: ritual.cardVariant || getRandomCardVariant(`${ritual.id}:${ritual.title}`),
    iconPreset: ritual.iconPreset || getMeaningfulIconPreset(ritual.title),
  };
}

function minutesFromTime(value?: string) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) {
    return null;
  }

  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function timeFromMinutes(totalMinutes: number) {
  const minutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(remainder).padStart(
    2,
    "0",
  )}`;
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
  if (typeof window === "undefined") {
    return INITIAL_RITUALS;
  }

  const saved = window.localStorage.getItem(RITUALS_STORAGE_KEY);

  if (!saved) {
    return INITIAL_RITUALS;
  }

  try {
    const parsed = JSON.parse(saved) as Ritual[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed.map(withPresentation)
      : INITIAL_RITUALS;
  } catch {
    return INITIAL_RITUALS;
  }
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function loadHistory() {
  if (typeof window === "undefined") {
    return [] as RitualHistoryRecord[];
  }

  const saved = window.localStorage.getItem(RITUAL_HISTORY_STORAGE_KEY);

  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved) as RitualHistoryRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildTodayHistoryRecord(
  rituals: Ritual[],
  date = new Date(),
): RitualHistoryRecord {
  return {
    date: getLocalDateKey(date),
    completed: rituals.reduce((sum, ritual) => sum + ritual.current, 0),
    planned: rituals.reduce((sum, ritual) => sum + ritual.total, 0),
    rituals: rituals.map((ritual) => ({
      id: ritual.id,
      title: ritual.title,
      completed: ritual.current,
      planned: ritual.total,
    })),
  };
}

function upsertHistoryRecord(
  history: RitualHistoryRecord[],
  nextRecord: RitualHistoryRecord,
) {
  const withoutCurrentDay = history.filter(
    (record) => record.date !== nextRecord.date,
  );
  return [...withoutCurrentDay, nextRecord].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

function getLastNDates(count: number, endDate = new Date()) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(endDate);
    date.setDate(endDate.getDate() - (count - index - 1));
    return date;
  });
}

function formatArchiveRange(start: Date, end: Date) {
  const formatPart = (date: Date) =>
    date
      .toLocaleDateString("en-US", { month: "short", day: "numeric" })
      .toUpperCase();

  return `${formatPart(start)} - ${formatPart(end)}`;
}

function statusCopy(status: NotificationStatus) {
  switch (status) {
    case "granted":
      return "Reminders are enabled.";
    case "denied":
      return "Notifications are blocked for this site in Safari settings.";
    case "install-required":
      return "On iPhone, install this app to the Home Screen before Safari will allow reminders.";
    case "unsupported":
      return "This browser does not expose notifications for this app.";
    default:
      return "Enable reminders so your ritual windows can alert you.";
  }
}

function getVisibleHomeRituals(rituals: Ritual[]) {
  return rituals.filter((ritual) => ritual.current < ritual.total);
}

function ProgressRing({ current, total }: { current: number; total: number }) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const size = 72;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#d2d4d4"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#111111"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: progress }}
          transition={{ duration: 0.7, ease: [0.2, 0, 0, 1] }}
          strokeDasharray={circumference}
          strokeDashoffset={progress}
        />
      </svg>
      <span className="absolute text-[1.15rem] font-medium tracking-tight text-primary">
        {percentage}
      </span>
    </div>
  );
}

type ArchiveTone = "light" | "mid" | "deep" | "dark";

interface ArchiveDay {
  day: string;
  count: number;
  tone: ArchiveTone;
}

function archiveTileClass(tone: ArchiveTone) {
  switch (tone) {
    case "dark":
      return "bg-primary text-on-primary";
    case "deep":
      return "bg-neutral-700 text-white";
    case "mid":
      return "bg-surface-container-highest text-primary";
    default:
      return "bg-surface-container text-primary";
  }
}

function getArchiveTone(count: number, maxCount: number): ArchiveTone {
  if (count >= Math.max(4, maxCount - 1)) {
    return "dark";
  }
  if (count >= Math.max(3, maxCount - 2)) {
    return "deep";
  }
  if (count >= 2) {
    return "mid";
  }
  return "light";
}

function buildArchiveData(history: RitualHistoryRecord[]) {
  const historyByDate = new Map(history.map((record) => [record.date, record]));
  const lastSevenDates = getLastNDates(7);
  const weekBase = lastSevenDates.map((date) => {
    const record = historyByDate.get(getLocalDateKey(date));
    return {
      day: date
        .toLocaleDateString("en-US", { weekday: "short" })
        .charAt(0)
        .toUpperCase(),
      count: record?.completed ?? 0,
      planned: record?.planned ?? 0,
    };
  });

  const maxCount = Math.max(...weekBase.map((entry) => entry.count), 1);
  const week: ArchiveDay[] = weekBase.map((entry) => ({
    day: entry.day,
    count: entry.count,
    tone: getArchiveTone(entry.count, maxCount),
  }));

  let streakDays = 0;
  const today = new Date();

  for (let offset = 0; offset < history.length + 1; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const record = historyByDate.get(getLocalDateKey(date));

    if (!record || record.completed === 0) {
      break;
    }

    streakDays += 1;
  }

  const totals = weekBase.reduce(
    (sum, entry) => ({
      completed: sum.completed + entry.count,
      planned: sum.planned + entry.planned,
    }),
    { completed: 0, planned: 0 },
  );

  return {
    streakDays,
    completion:
      totals.planned > 0
        ? Math.round((totals.completed / totals.planned) * 100)
        : 0,
    week,
    totalRituals: totals.completed,
    rangeLabel: formatArchiveRange(
      lastSevenDates[0],
      lastSevenDates[lastSevenDates.length - 1],
    ),
  };
}

function ArchiveGarden() {
  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[16rem] items-center justify-center">
      <div className="absolute inset-0 rounded-[0.8rem] bg-surface-container-low/35" />
      <div className="absolute left-1/2 top-0 h-8 w-px -translate-x-1/2 bg-primary/8" />
      <div className="absolute bottom-0 left-1/2 h-8 w-px -translate-x-1/2 bg-primary/8" />
      <div className="absolute left-0 top-1/2 h-px w-8 -translate-y-1/2 bg-primary/8" />
      <div className="absolute right-0 top-1/2 h-px w-8 -translate-y-1/2 bg-primary/8" />

      {[90, 68, 46, 24].map((size, index) => (
        <motion.div
          key={size}
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.7,
            delay: index * 0.08,
            ease: [0.2, 0, 0, 1],
          }}
          className="absolute rounded-[0.55rem] border border-primary/[0.08] bg-surface/[0.45]"
          style={{ width: `${size}%`, height: `${size}%` }}
        />
      ))}

      <div className="absolute h-[20%] w-[20%] rounded-[0.5rem] border border-primary/10 bg-surface shadow-[0px_8px_18px_rgba(27,28,28,0.04)]">
        <div className="absolute inset-1.5 rounded-[0.35rem] border border-primary/8" />
        <motion.div
          initial={{ scale: 0.94, opacity: 0.7 }}
          animate={{ scale: [0.94, 1, 0.94], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 4, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-[18%] rounded-[0.3rem] bg-primary/55"
        />
        <div className="absolute left-[14%] top-[14%] h-1 w-1 rounded-full border border-primary/20" />
        <div className="absolute bottom-[14%] right-[14%] h-1 w-1 rounded-full border border-primary/20" />
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"home" | "list" | "check">("home");
  const [rituals, setRituals] = useState<Ritual[]>(loadInitialRituals);
  const [history, setHistory] = useState<RitualHistoryRecord[]>(loadHistory);
  const [isAdding, setIsAdding] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Ritual | null>(null);
  const [notificationStatus, setNotificationStatus] =
    useState<NotificationStatus>("default");
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
    const todayRecord = buildTodayHistoryRecord(rituals);
    setHistory((currentHistory) => {
      const nextHistory = upsertHistoryRecord(currentHistory, todayRecord);
      window.localStorage.setItem(
        RITUAL_HISTORY_STORAGE_KEY,
        JSON.stringify(nextHistory),
      );
      return nextHistory;
    });
  }, [rituals]);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes(),
      ).padStart(2, "0")}`;
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
      await notifications.show(
        "Zen Reminders Enabled",
        "Your ritual reminders are ready.",
        {
          tag: "notifications-enabled",
        },
      );
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
    setRituals((prev) => [...prev, withPresentation(newHabit)]);
    setIsAdding(false);
  };

  const handleUpdateHabit = (updatedHabit: Ritual) => {
    setRituals((prev) =>
      prev.map((ritual) =>
        ritual.id === updatedHabit.id ? withPresentation(updatedHabit) : ritual,
      ),
    );
    setEditingHabit(null);
  };

  const handleDeleteHabit = (id: string) => {
    setRituals((prev) => prev.filter((ritual) => ritual.id !== id));
    setEditingHabit(null);
  };

  const visibleHomeRituals = getVisibleHomeRituals(rituals);
  const archiveData = buildArchiveData(history);

  return (
    <>
      <Layout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddClick={() => setIsAdding(true)}
        showAddButton={activeTab !== "check"}
      >
        {activeTab === "home" && (
          <div className="space-y-12">
            <section className="mb-20">
              <p className="mb-2 text-[10px] uppercase tracking-widest text-on-surface-variant">
                The Daily Path
              </p>
              <h2 className="text-6xl leading-none tracking-[-0.04em] text-primary md:text-8xl">
                The Rituals
              </h2>
            </section>

            <AnimatePresence initial={false}>
              {notificationStatus !== "granted" && (
                <motion.section
                  key="notification-status"
                  layout
                  initial={{ opacity: 0, y: 24, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -28, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
                  className="overflow-hidden rounded-[2rem] border border-outline-variant/40 bg-surface-container-low px-6 py-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                        Reminder Status
                      </p>
                      <h3 className="text-2xl font-bold tracking-tight">
                        Notifications need setup
                      </h3>
                      <p className="max-w-md text-sm text-on-surface-variant">
                        {statusCopy(notificationStatus)}
                      </p>
                    </div>
                    <div className="rounded-full border border-outline-variant/50 p-3 text-primary">
                      <BellOff size={22} />
                    </div>
                  </div>

                  {notificationStatus !== "denied" && (
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

            <motion.div
              layout
              className="grid grid-cols-1 items-start gap-8 md:grid-cols-12"
            >
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
                      onClick={() =>
                        handleRitualClick(visibleHomeRituals[0].id)
                      }
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
                      onClick={() =>
                        handleRitualClick(visibleHomeRituals[1].id)
                      }
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
                      onClick={() =>
                        handleRitualClick(visibleHomeRituals[2].id)
                      }
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
                    <RitualCard
                      ritual={ritual}
                      onClick={() => handleRitualClick(ritual.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        )}

        {activeTab === "list" && (
          <div className="space-y-8">
            <h2 className="text-4xl font-black tracking-tight">Your Journey</h2>
            <div className="space-y-4">
              {rituals.map((ritual) => (
                <div
                  key={ritual.id}
                  onClick={() => setEditingHabit(ritual)}
                  className="cursor-pointer rounded-[1.75rem] bg-surface-container-low px-6 py-7 transition-colors duration-300 hover:bg-surface-container"
                >
                  <div className="flex items-center justify-between gap-5">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[2rem] font-bold tracking-tight leading-none">
                        {ritual.title}
                      </h3>
                      <p className="mt-2 text-sm text-on-surface-variant">
                        {ritual.label}: {ritual.current}/{ritual.total}
                      </p>
                      <p className="mt-2 max-w-[18rem] text-sm leading-relaxed text-on-surface-variant md:max-w-none">
                        {getReminderTimes(ritual).join(" • ")}
                      </p>
                    </div>
                    <ProgressRing
                      current={ritual.current}
                      total={ritual.total}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "check" && (
          <div className="mx-auto w-full max-w-[19rem] space-y-14 pb-2">
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.2, 0, 0, 1] }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <p className="text-[9px] uppercase tracking-[0.26em] text-on-surface-variant/45">
                  Current Momentum
                </p>
                <h2 className="text-[3.15rem] font-black leading-[0.88] tracking-[-0.08em] text-primary">
                  {archiveData.streakDays} DAY
                  <br />
                  STREAK
                </h2>
              </div>

              <div className="relative h-[2px] overflow-hidden bg-surface-container-highest">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.max(28, archiveData.completion)}%`,
                  }}
                  transition={{
                    duration: 0.95,
                    delay: 0.15,
                    ease: [0.2, 0, 0, 1],
                  }}
                  className="absolute inset-y-0 left-0 bg-primary"
                />
              </div>

              <p className="max-w-[14.75rem] text-[0.88rem] leading-[1.7] text-on-surface-variant">
                Your focus remains unbroken. The quiet consistency of your
                practice defines the architecture of your days.
              </p>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08, ease: [0.2, 0, 0, 1] }}
              className="space-y-4"
            >
              <div className="flex items-end justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-[9px] uppercase tracking-[0.26em] text-on-surface-variant/45">
                    Weekly Density
                  </p>
                  <h3 className="text-[2.05rem] font-black tracking-tight leading-none text-primary">
                    Daily Rituals
                  </h3>
                </div>
                <p className="pb-1 text-[9px] uppercase tracking-[0.12em] text-on-surface-variant/70">
                  {archiveData.rangeLabel}
                </p>
              </div>

              <div className="flex items-center justify-between gap-1">
                {archiveData.week.map((entry, index) => (
                  <motion.div
                    key={`${entry.day}-${index}`}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.45,
                      delay: 0.12 + index * 0.04,
                      ease: [0.2, 0, 0, 1],
                    }}
                    className={`flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-[2px] ${archiveTileClass(
                      entry.tone,
                    )}`}
                  >
                    <span className="text-[7px] uppercase leading-none opacity-55">
                      {entry.day}
                    </span>
                    <span className="mt-1 text-[0.82rem] font-bold leading-none">
                      {entry.count}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-0.5 text-[0.58rem] text-on-surface-variant/55">
                <span>Total Rituals: {archiveData.totalRituals}</span>
                <span>Completion: {archiveData.completion}%</span>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16, ease: [0.2, 0, 0, 1] }}
              className="space-y-5 py-1"
            >
              <div className="space-y-2 text-center">
                <p className="text-[9px] uppercase tracking-[0.3em] text-on-surface-variant/45">
                  Generative Bloom
                </p>
                <h3 className="text-[1.95rem] font-light uppercase leading-[1.08] tracking-[0.22em] text-primary">
                  The Zen
                  <br />
                  Garden
                </h3>
              </div>

              <ArchiveGarden />

              <p className="px-8 text-center text-[0.68rem] italic leading-relaxed text-on-surface-variant/65">
                Your garden blooms in direct proportion to your silence.
              </p>
            </motion.section>
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
