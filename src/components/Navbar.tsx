import React from 'react';
import { Page } from '../types';
import { LayoutDashboard, PenTool, History, Shield } from 'lucide-react';

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const tabs: { id: Page; label: string; icon: any }[] = [
    { id: 'admin', label: 'Admin', icon: Shield },
    { id: 'setup', label: 'Exam', icon: PenTool },
    { id: 'history', label: 'Records', icon: History },
  ];

  // Don't show tabs during exam
  if (currentPage === 'exam') return null;

  return (
    <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
            <LayoutDashboard className="text-white" size={24} />
          </div>
          <span className="hidden md:block font-black text-xl tracking-tighter bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent px-1">
            CSA MCQ PRO
          </span>
        </div>

        <div className="flex gap-2 bg-bg p-2 rounded-2xl border border-border">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-widest ${
                currentPage === tab.id || (currentPage === 'result' && tab.id === 'setup')
                  ? 'bg-accent text-white shadow-[0_10px_20px_rgba(37,99,235,0.3)] scale-105'
                  : 'text-text-dim hover:text-text-main hover:bg-surface-hover'
              }`}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
