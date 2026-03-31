import { ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Home, List, CheckCircle, Plus } from "lucide-react";
import { haptics } from "../utils/haptics";

interface LayoutProps {
  children: ReactNode;
  activeTab: "home" | "list" | "check";
  onTabChange: (tab: "home" | "list" | "check") => void;
  onAddClick?: () => void;
  showAddButton?: boolean;
}

export default function Layout({
  children,
  activeTab,
  onTabChange,
  onAddClick,
  showAddButton = true,
}: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-primary font-black tracking-tighter text-2xl">
            Zen Reminders
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-6 pt-12 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Action Button */}
      {showAddButton && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            onAddClick?.();
            haptics.light();
          }}
          className="fixed bottom-25 right-8 md:bottom-13 md:right-12 w-16 h-16 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-[0px_20px_40px_rgba(0,0,0,0.15)] z-50"
        >
          <Plus size={32} strokeWidth={1.5} />
        </motion.button>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-10 pb-8 pt-4 bg-surface/70 backdrop-blur-xl border-t border-black/5 shadow-[0px_-10px_30px_rgba(0,0,0,0.03)]">
        <button
          onClick={() => {
            onTabChange("home");
            haptics.light();
          }}
          className={`p-3 rounded-full transition-all duration-500 ${
            activeTab === "home"
              ? "bg-primary text-on-primary scale-110"
              : "text-on-surface-variant hover:scale-110"
          }`}
        >
          <Home
            size={24}
            fill={activeTab === "home" ? "currentColor" : "none"}
            strokeWidth={1.5}
          />
        </button>
        <button
          onClick={() => {
            onTabChange("list");
            haptics.light();
          }}
          className={`p-3 rounded-full transition-all duration-500 ${
            activeTab === "list"
              ? "bg-primary text-on-primary scale-110"
              : "text-on-surface-variant hover:scale-110"
          }`}
        >
          <List size={24} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => {
            onTabChange("check");
            haptics.light();
          }}
          className={`p-3 rounded-full transition-all duration-500 ${
            activeTab === "check"
              ? "bg-primary text-on-primary scale-110"
              : "text-on-surface-variant hover:scale-110"
          }`}
        >
          <CheckCircle size={24} strokeWidth={1.5} />
        </button>
      </nav>
    </div>
  );
}
