import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { RitualCardVariant, RitualIconPreset, ritualIconMap } from '../utils/ritualPresentation';

export type RitualType = 'water' | 'breath' | 'stretch';

interface Ritual {
  id: string;
  type: RitualType;
  title: string;
  current: number;
  total: number;
  label: string;
  cardVariant?: RitualCardVariant;
  iconPreset?: RitualIconPreset;
  color?: string;
}

export default function RitualCard({ ritual, onClick }: { ritual: Ritual; onClick: () => void }) {
  const variant = ritual.cardVariant || ritual.type;
  const Icon = ritualIconMap[ritual.iconPreset || ritual.type];
  const isDark = variant === 'breath';
  const progress = (ritual.current / ritual.total) * 100;
  const isCompleted = ritual.current === ritual.total;
  const isStretch = variant === 'stretch';
  const isFocus = variant === 'focus';

  const cardClassName = isDark
    ? 'bg-primary text-on-primary aspect-square'
    : isStretch
      ? 'aspect-video bg-surface-container-highest hover:bg-surface-container-high'
      : isFocus
        ? 'aspect-[16/10] bg-surface-container-low text-primary hover:bg-surface-container'
        : 'bg-surface-container-low hover:bg-surface-container aspect-[16/10]';

  return (
    <motion.div
      whileHover={{ y: -5 }}
      animate={isCompleted ? {
        scale: [1, 1.03, 1],
        boxShadow: isDark 
          ? ['0px 0px 0px rgba(0,0,0,0)', '0px 0px 40px rgba(255,255,255,0.15)', '0px 0px 0px rgba(0,0,0,0)']
          : ['0px 0px 0px rgba(0,0,0,0)', '0px 10px 40px rgba(0,0,0,0.08)', '0px 0px 0px rgba(0,0,0,0)']
      } : {}}
      transition={{ duration: 0.8, ease: [0.2, 0, 0, 1] }}
      onClick={onClick}
      className={`group relative cursor-pointer p-10 flex flex-col justify-between transition-colors duration-500 cubic-bezier-transition
        ${cardClassName}
        ${isCompleted && !isDark ? 'bg-surface-container' : ''}
      `}
    >
      <div className="flex justify-between items-start">
        <Icon size={40} strokeWidth={1.2} className={isDark ? 'text-on-primary' : 'text-primary'} />
        <div className="text-right">
          <p className={`text-[10px] uppercase tracking-widest font-medium ${isDark ? 'text-on-primary/60' : 'text-on-surface-variant'}`}>
            {ritual.label}
          </p>
          <div className="flex items-center justify-end gap-2">
            <p className={`text-xl font-bold ${!isDark && ritual.current === 0 ? 'text-error' : ''}`}>
              {ritual.current}/{ritual.total}
            </p>
            {isCompleted && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={isDark ? 'text-on-primary' : 'text-primary'}
              >
                <Check size={18} strokeWidth={3} />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h3 className="mb-6 text-4xl font-bold tracking-tight">{ritual.title}</h3>

        {variant === 'breath' ? (
          <div className="flex gap-1">
            {Array.from({ length: ritual.total }).map((_, i) => (
              <div 
                key={i} 
                className={`h-1 w-full transition-all duration-700 ${i < ritual.current ? 'bg-on-primary' : 'bg-on-primary/20'}`} 
              />
            ))}
          </div>
        ) : isFocus ? (
          <div className="space-y-5">
            <div className="relative h-28 overflow-hidden">
              <svg
                viewBox="0 0 320 160"
                className="absolute inset-0 h-full w-full text-primary/12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <circle cx="242" cy="46" r="34" stroke="currentColor" strokeWidth="1" />
                <circle cx="242" cy="46" r="24" stroke="currentColor" strokeWidth="1" />
                <circle cx="242" cy="46" r="15" stroke="currentColor" strokeWidth="1" />
                <path d="M112 142C146 86 188 86 224 142" stroke="currentColor" strokeWidth="1" />
                <path d="M92 152C132 96 182 96 238 152" stroke="currentColor" strokeWidth="1" opacity="0.52" />
                <path d="M122 146H270" stroke="currentColor" strokeWidth="1" opacity="0.4" />
              </svg>
              <motion.div
                initial={{ opacity: 0.12, scale: 0.98 }}
                animate={{ opacity: [0.12, 0.2, 0.12], scale: [0.98, 1.02, 0.98] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
                className="absolute left-10 top-16 h-6 w-6 rounded-full bg-primary/6"
              />
            </div>

            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                Daily Progress
              </p>
              <div className="mb-5 flex items-baseline gap-1">
                <span className="text-5xl font-bold tracking-tight text-primary">{ritual.current}</span>
                <span className="text-lg font-medium text-primary/35">/ {ritual.total}</span>
              </div>
            </div>

            <div className="flex gap-1.5">
              {Array.from({ length: ritual.total }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0.22 }}
                  animate={{
                    opacity: i < ritual.current ? 1 : 0.22,
                  }}
                  transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
                  className="h-[3px] flex-1 rounded-full bg-primary/28"
                />
              ))}
            </div>
          </div>
        ) : isStretch ? (
          <div className="space-y-8">
            <div className="relative flex h-20 items-center justify-center overflow-hidden">
              <div className="absolute h-px w-28 bg-primary/8" />
              <motion.div
                initial={{ opacity: 0.3, scale: 0.92 }}
                animate={{ opacity: [0.3, 0.55, 0.3], scale: [0.92, 1, 0.92] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
                className="absolute h-[4.5rem] w-[4.5rem] rounded-[1.6rem] border border-primary/10"
              />
              <motion.div
                initial={{ opacity: 0.35, scale: 0.94 }}
                animate={{ opacity: [0.35, 0.65, 0.35], scale: [0.94, 1.03, 0.94] }}
                transition={{ duration: 3.6, repeat: Infinity, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
                className="absolute h-[3.25rem] w-[3.25rem] rounded-[1.1rem] border border-primary/14"
              />
              <motion.div
                initial={{ opacity: 0.45, y: 0 }}
                animate={{ opacity: [0.45, 0.7, 0.45], y: [0, -2, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
                className="absolute h-8 w-8 rounded-[0.9rem] bg-primary/14"
              />
            </div>

            <div className="w-full h-[2px] bg-outline-variant/30 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: [0.2, 0, 0, 1] }}
                className={`h-full ${isDark ? 'bg-on-primary' : 'bg-primary'}`}
              />
            </div>
          </div>
        ) : (
          <div className="w-full h-[2px] bg-outline-variant/30 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: [0.2, 0, 0, 1] }}
              className={`h-full ${isDark ? 'bg-on-primary' : 'bg-primary'}`}
            />
          </div>
        )}
      </div>

      {/* Subtle completion overlay for dark cards */}
      {isCompleted && isDark && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          className="absolute inset-0 bg-white pointer-events-none"
        />
      )}
    </motion.div>
  );
}
