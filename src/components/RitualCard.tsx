import { motion } from 'motion/react';
import { Droplets, Wind, Accessibility, Check } from 'lucide-react';

export type RitualType = 'water' | 'breath' | 'stretch';

interface Ritual {
  id: string;
  type: RitualType;
  title: string;
  current: number;
  total: number;
  label: string;
  color?: string;
}

const iconMap = {
  water: Droplets,
  breath: Wind,
  stretch: Accessibility,
};

export default function RitualCard({ ritual, onClick }: { ritual: Ritual; onClick: () => void }) {
  const Icon = iconMap[ritual.type];
  const isDark = ritual.type === 'breath';
  const progress = (ritual.current / ritual.total) * 100;
  const isCompleted = ritual.current === ritual.total;

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
        ${isDark ? 'bg-primary text-on-primary aspect-square' : 'bg-surface-container-low hover:bg-surface-container aspect-[16/10]'}
        ${ritual.type === 'stretch' ? 'aspect-video bg-surface-container-highest hover:bg-surface-container-high' : ''}
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
        <h3 className="text-4xl font-bold tracking-tight mb-6">{ritual.title}</h3>
        
        {ritual.type === 'breath' ? (
          <div className="flex gap-1">
            {Array.from({ length: ritual.total }).map((_, i) => (
              <div 
                key={i} 
                className={`h-1 w-full transition-all duration-700 ${i < ritual.current ? 'bg-on-primary' : 'bg-on-primary/20'}`} 
              />
            ))}
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
        
        {ritual.type === 'stretch' && ritual.current === 0 && (
          <p className="text-on-surface-variant mt-2 text-sm">Not started yet</p>
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
