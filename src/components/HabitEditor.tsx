import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Clock, Moon, Trash2, X } from "lucide-react";
import { haptics } from "../utils/haptics";
import { RitualType } from "./RitualCard";
import { RitualCardVariant, RitualIconPreset } from "../utils/ritualPresentation";

interface HabitEditorProps {
  onClose: () => void;
  onSave: (habit: any) => void;
  onDelete?: (id: string) => void;
  initialHabit?: {
    id: string;
    title: string;
    total: number;
    type: RitualType;
    current: number;
    label: string;
    cardVariant?: RitualCardVariant;
    iconPreset?: RitualIconPreset;
    startTime?: string;
    endTime?: string;
  };
}

export default function HabitEditor({
  onClose,
  onSave,
  onDelete,
  initialHabit,
}: HabitEditorProps) {
  const minIntervals = 1;
  const maxIntervals = 10;
  const [name, setName] = useState(initialHabit?.title || "");
  const [intervals, setIntervals] = useState(initialHabit?.total || 3);
  const [startTime, setStartTime] = useState(
    initialHabit?.startTime || "08:00",
  );
  const [endTime, setEndTime] = useState(initialHabit?.endTime || "22:00");
  const lastHapticValueRef = useRef(intervals);
  const sliderTrackRef = useRef<HTMLDivElement | null>(null);
  const isDraggingSliderRef = useRef(false);
  const lastScrubAtRef = useRef(0);

  const handleIntervalsChange = (nextValue: number) => {
    const clampedValue = Math.min(
      maxIntervals,
      Math.max(minIntervals, nextValue),
    );

    if (lastHapticValueRef.current !== clampedValue) {
      const now = Date.now();
      if (now - lastScrubAtRef.current > 45) {
        haptics.scrubTick();
        lastScrubAtRef.current = now;
      }
      lastHapticValueRef.current = clampedValue;
    }

    setIntervals(clampedValue);
  };

  const updateIntervalsFromPointer = (clientX: number) => {
    const track = sliderTrackRef.current;

    if (!track) {
      return;
    }

    const { left, width } = track.getBoundingClientRect();
    const relativeX = Math.min(Math.max(clientX - left, 0), width);
    const ratio = width === 0 ? 0 : relativeX / width;
    const nextValue = Math.round(
      minIntervals + ratio * (maxIntervals - minIntervals),
    );

    handleIntervalsChange(nextValue);
  };

  const stopSliderDrag = () => {
    isDraggingSliderRef.current = false;
  };

  const handleSave = () => {
    if (!name) {
      haptics.error();
      return;
    }

    onSave({
      id: initialHabit?.id || Math.random().toString(36).substr(2, 9),
      title: name,
      type: initialHabit?.type || "water",
      current: initialHabit?.current || 0,
      total: intervals,
      label: initialHabit?.label || "Frequency",
      cardVariant: initialHabit?.cardVariant,
      iconPreset: initialHabit?.iconPreset,
      startTime,
      endTime,
    });
    haptics.success();
  };

  const handleDelete = () => {
    if (initialHabit && onDelete) {
      onDelete(initialHabit.id);
      haptics.medium();
    }
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
      className="fixed inset-0 z-[60] bg-surface flex flex-col"
    >
      <header className="px-6 py-4 flex justify-between items-center bg-surface sticky top-0 z-10">
        <button
          onClick={onClose}
          className="p-2 hover:opacity-70 transition-opacity"
        >
          <X size={24} strokeWidth={1.5} />
        </button>
        <h1 className="font-bold tracking-tighter text-2xl">Zen Reminders</h1>
        <div className="flex items-center gap-2">
          {initialHabit && (
            <button
              onClick={handleDelete}
              className="p-2 text-error hover:opacity-70 transition-opacity"
            >
              <Trash2 size={24} strokeWidth={1.5} />
            </button>
          )}
          <button
            onClick={handleSave}
            className="p-2 hover:opacity-70 transition-opacity"
          >
            <Check size={24} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-screen-sm mx-auto w-full px-6 pt-12 pb-32 overflow-y-auto hide-scrollbar">
        <div className="mb-16">
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2 block">
            {initialHabit ? "Edit Ritual" : "New Habit"}
          </span>
          <h2 className="text-5xl font-black tracking-tight leading-tight">
            {initialHabit ? "Refine your ritual" : "What is your ritual?"}
          </h2>
        </div>

        <div className="mb-20">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent border-b-2 border-outline-variant px-0 py-4 text-2xl font-medium placeholder:text-outline-variant focus:outline-none focus:border-primary transition-all duration-400"
            placeholder="e.g. Drink Water"
          />
        </div>

        <div className="mb-20">
          <span className="mb-6 block text-[10px] uppercase tracking-widest text-on-surface-variant">
            How many times daily?
          </span>

          <motion.section
            layout
            transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
            className="rounded-[2rem]"
          >
            <div className="text-center">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={intervals}
                  initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="leading-none"
                >
                  <span className="block text-[7rem] font-black tracking-[-0.09em] text-primary md:text-[7.5rem]">
                    {intervals}
                  </span>
                </motion.div>
              </AnimatePresence>
              <span className="mt-1 block text-[2rem] font-medium tracking-tight text-on-surface-variant">
                intervals
              </span>
            </div>

            <div
              ref={sliderTrackRef}
              className="relative mt-8 touch-none"
              onPointerDown={(event) => {
                isDraggingSliderRef.current = true;
                event.currentTarget.setPointerCapture(event.pointerId);
                updateIntervalsFromPointer(event.clientX);
              }}
              onPointerMove={(event) => {
                if (!isDraggingSliderRef.current) {
                  return;
                }

                updateIntervalsFromPointer(event.clientX);
              }}
              onPointerUp={() => {
                stopSliderDrag();
              }}
              onPointerCancel={() => {
                stopSliderDrag();
              }}
              onTouchStart={(event) => {
                isDraggingSliderRef.current = true;
                updateIntervalsFromPointer(event.touches[0].clientX);
              }}
              onTouchMove={(event) => {
                if (!isDraggingSliderRef.current) {
                  return;
                }

                updateIntervalsFromPointer(event.touches[0].clientX);
              }}
              onTouchEnd={() => {
                stopSliderDrag();
              }}
              onTouchCancel={() => {
                stopSliderDrag();
              }}
            >
              <div className="pointer-events-none flex items-center justify-between px-[2px]">
                {Array.from(
                  { length: maxIntervals - minIntervals + 1 },
                  (_, index) => {
                    const value = minIntervals + index;
                    const isActive = value === intervals;

                    return (
                      <motion.span
                        key={value}
                        animate={{
                          height: isActive ? 72 : 46,
                          backgroundColor: isActive ? "#4f4f4b" : "#d9d7d1",
                          opacity: isActive ? 1 : 0.95,
                        }}
                        transition={{
                          duration: 0.18,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="block w-[4px] rounded-full"
                      />
                    );
                  },
                )}
              </div>
            </div>
          </motion.section>
        </div>

        <div className="space-y-4">
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-6 block">
            Window of activation
          </span>
          <div className="space-y-1">
            <div className="flex items-center justify-between p-6 bg-surface-container-low rounded-xl group hover:bg-surface-container transition-colors duration-400">
              <div className="flex flex-col flex-1">
                <span className="text-xs uppercase tracking-wider text-on-surface-variant mb-1">
                  Starting at
                </span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-transparent text-xl font-bold tracking-tight focus:outline-none"
                />
              </div>
              <Clock
                size={24}
                className="text-outline-variant group-hover:text-primary transition-colors"
              />
            </div>
            <div className="flex items-center justify-between p-6 bg-surface-container-low rounded-xl group hover:bg-surface-container transition-colors duration-400">
              <div className="flex flex-col flex-1">
                <span className="text-xs uppercase tracking-wider text-on-surface-variant mb-1">
                  Ending at
                </span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-transparent text-xl font-bold tracking-tight focus:outline-none"
                />
              </div>
              <Moon
                size={24}
                className="text-outline-variant group-hover:text-primary transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="mt-24 pl-12 border-l border-outline-variant/30 max-w-xs">
          <p className="text-on-surface-variant text-sm italic leading-relaxed">
            Consistency is the architecture of progress. Set your windows to
            align with your natural rhythm.
          </p>
        </div>
      </main>
    </motion.div>
  );
}
