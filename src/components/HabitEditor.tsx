import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Check, Minus, Plus, Clock, Moon, Trash2 } from 'lucide-react';
import { haptics } from '../utils/haptics';
import { RitualType } from './RitualCard';

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
    startTime?: string;
    endTime?: string;
  };
}

export default function HabitEditor({ onClose, onSave, onDelete, initialHabit }: HabitEditorProps) {
  const [name, setName] = useState(initialHabit?.title || '');
  const [intervals, setIntervals] = useState(initialHabit?.total || 3);
  const [startTime, setStartTime] = useState(initialHabit?.startTime || '08:00');
  const [endTime, setEndTime] = useState(initialHabit?.endTime || '22:00');

  const handleSave = () => {
    if (!name) return;
    onSave({
      id: initialHabit?.id || Math.random().toString(36).substr(2, 9),
      title: name,
      type: initialHabit?.type || 'water',
      current: initialHabit?.current || 0,
      total: intervals,
      label: initialHabit?.label || 'Frequency',
      startTime,
      endTime,
    });
  };

  const handleDelete = () => {
    if (initialHabit && onDelete) {
      onDelete(initialHabit.id);
      haptics.medium();
    }
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
      className="fixed inset-0 z-[60] bg-surface flex flex-col"
    >
      <header className="px-6 py-4 flex justify-between items-center bg-surface sticky top-0 z-10">
        <button onClick={onClose} className="p-2 hover:opacity-70 transition-opacity">
          <X size={24} strokeWidth={1.5} />
        </button>
        <h1 className="font-bold tracking-tighter text-2xl">Zen Reminders</h1>
        <div className="flex items-center gap-2">
          {initialHabit && (
            <button onClick={handleDelete} className="p-2 text-error hover:opacity-70 transition-opacity">
              <Trash2 size={24} strokeWidth={1.5} />
            </button>
          )}
          <button onClick={handleSave} className="p-2 hover:opacity-70 transition-opacity">
            <Check size={24} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-screen-sm mx-auto w-full px-6 pt-12 pb-32 overflow-y-auto hide-scrollbar">
        <div className="mb-16">
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2 block">
            {initialHabit ? 'Edit Ritual' : 'New Habit'}
          </span>
          <h2 className="text-5xl font-black tracking-tight leading-tight">
            {initialHabit ? 'Refine your ritual' : 'What is your ritual?'}
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

        <div className="mb-20 flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-12 block">How many times daily?</span>
          <div className="relative w-72 h-72 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-outline-variant/20" />
            <div className="absolute inset-4 rounded-full border border-outline-variant/10" />
            <div className="text-center z-10">
              <span className="text-9xl font-black tracking-tighter block leading-none">{intervals}</span>
              <span className="text-sm uppercase tracking-[0.2em] text-on-surface-variant">Intervals</span>
            </div>
            {/* Abstract Dial Visuals */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-[2px] bg-primary absolute rotate-[45deg] scale-x-110 opacity-10" />
              <div className="w-full h-[2px] bg-primary absolute rotate-[-45deg] scale-x-110 opacity-5" />
            </div>
          </div>

          <div className="mt-12 w-full flex items-center justify-between gap-8">
            <button 
              onClick={() => {
                setIntervals(Math.max(1, intervals - 1));
                haptics.light();
              }}
              className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all duration-400 active:scale-90"
            >
              <Minus size={20} />
            </button>
            <div className="flex-1 h-[2px] bg-surface-container-highest relative">
              <div className="absolute h-full bg-primary left-0" style={{ width: `${(intervals / 10) * 100}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-4 border-surface shadow-sm" style={{ left: `${(intervals / 10) * 100}%` }} />
            </div>
            <button 
              onClick={() => {
                setIntervals(Math.min(10, intervals + 1));
                haptics.light();
              }}
              className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all duration-400 active:scale-90"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-6 block">Window of activation</span>
          <div className="space-y-1">
            <div className="flex items-center justify-between p-6 bg-surface-container-low rounded-xl group hover:bg-surface-container transition-colors duration-400">
              <div className="flex flex-col flex-1">
                <span className="text-xs uppercase tracking-wider text-on-surface-variant mb-1">Starting at</span>
                <input 
                  type="time" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-transparent text-xl font-bold tracking-tight focus:outline-none"
                />
              </div>
              <Clock size={24} className="text-outline-variant group-hover:text-primary transition-colors" />
            </div>
            <div className="flex items-center justify-between p-6 bg-surface-container-low rounded-xl group hover:bg-surface-container transition-colors duration-400">
              <div className="flex flex-col flex-1">
                <span className="text-xs uppercase tracking-wider text-on-surface-variant mb-1">Ending at</span>
                <input 
                  type="time" 
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-transparent text-xl font-bold tracking-tight focus:outline-none"
                />
              </div>
              <Moon size={24} className="text-outline-variant group-hover:text-primary transition-colors" />
            </div>
          </div>
        </div>

        <div className="mt-24 pl-12 border-l border-outline-variant/30 max-w-xs">
          <p className="text-on-surface-variant text-sm italic leading-relaxed">
            Consistency is the architecture of progress. Set your windows to align with your natural rhythm.
          </p>
        </div>
      </main>

      {/* Visual Artifact */}
      <div className="fixed top-0 right-0 w-1/4 h-screen pointer-events-none opacity-5 overflow-hidden">
        <div className="absolute top-1/4 -right-20 w-80 h-80 rounded-full border-[60px] border-primary" />
      </div>
    </motion.div>
  );
}
