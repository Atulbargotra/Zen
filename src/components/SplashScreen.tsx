import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 z-[100] bg-surface flex flex-col items-center justify-center p-6 overflow-hidden"
    >
      <div className="flex flex-col items-center gap-16 md:gap-24">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.2, 0, 0, 1] }}
          className="flex flex-col items-center"
        >
          <h1 className="font-black text-6xl md:text-8xl tracking-[-0.05em] leading-none text-primary text-center">
            Zen
            <span className="block mt-[-0.1em] font-light text-on-surface-variant/60">Reminders</span>
          </h1>
          <motion.div 
            initial={{ h: 0 }}
            animate={{ height: 48 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mt-8 w-1 bg-primary rounded-full opacity-20"
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 1, duration: 1 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <p className="text-sm uppercase tracking-[0.2em] text-on-surface-variant font-light">
            Breathe, Drink, Flow.
          </p>
          <div className="h-2 w-2 bg-primary rounded-full mt-4 animate-pulse" />
        </motion.div>
      </div>

      <footer className="absolute bottom-16 left-0 w-full px-12 flex justify-between items-end">
        <div className="max-w-[120px]">
          <p className="text-[10px] uppercase tracking-widest text-outline-variant leading-relaxed">
            Designed for <br/> Clarity
          </p>
        </div>
      </footer>

      {/* Decorative background element */}
      <div className="fixed top-0 right-0 w-1/3 h-screen bg-surface-container-lowest/30 -z-10 translate-x-1/2 rounded-full blur-[120px]" />
    </motion.div>
  );
}
