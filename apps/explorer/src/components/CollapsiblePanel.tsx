'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Theme detection hook
const useTheme = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDark(theme !== 'light');
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
};

interface CollapsiblePanelProps {
  title: React.ReactNode;
  isCollapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  position: 'left' | 'middle' | 'right';
  defaultWidth: string;
  collapsedWidth?: string;
}

export default function CollapsiblePanel({
  title,
  isCollapsed,
  onToggle,
  children,
  position,
  defaultWidth,
  collapsedWidth = '48px',
}: CollapsiblePanelProps) {
  const isDark = useTheme();

  const borderClasses = {
    left: 'border-r border-blue-500/20',
    middle: 'border-r border-blue-500/20',
    right: '',
  };

  // Theme-aware colors
  const titleColor = isDark ? '#bfdbfe' : '#1e40af'; // blue-200 in dark, blue-800 in light
  const collapsedTitleColor = isDark ? '#60a5fa' : '#2563eb'; // blue-400 in dark, blue-600 in light

  return (
    <div
      className={`relative h-full glass-panel panel-transition overflow-hidden ${borderClasses[position]}`}
      style={{ width: isCollapsed ? collapsedWidth : defaultWidth }}
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute top-4 right-2 z-10 p-1 rounded-md bg-blue-500/20 hover:bg-blue-500/40 transition-colors"
        aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" style={{ color: collapsedTitleColor }} />
        ) : (
          <ChevronLeft className="w-4 h-4" style={{ color: collapsedTitleColor }} />
        )}
      </button>

      {/* Panel Header */}
      <div
        className={`p-4 border-b border-blue-500/20 ${isCollapsed ? 'opacity-0' : 'opacity-100'} transition-opacity`}
      >
        <h2 className="text-lg font-semibold pr-8" style={{ color: titleColor }}>{title}</h2>
      </div>

      {/* Collapsed Title (Vertical) */}
      {isCollapsed && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span
            className="text-sm font-medium tracking-wider"
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              color: collapsedTitleColor,
            }}
          >
            {title}
          </span>
        </div>
      )}

      {/* Panel Content */}
      <div
        className={`p-4 overflow-y-auto h-[calc(100%-65px)] ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity`}
      >
        {children}
      </div>
    </div>
  );
}
