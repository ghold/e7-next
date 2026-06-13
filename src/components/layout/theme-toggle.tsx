'use client';

import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from './theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-steel-500 hover:text-gold-400 hover:bg-gold-400/10 transition-colors"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? '切换到日光模式' : '切换到暗黑模式'}
    >
      {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
    </Button>
  );
}
