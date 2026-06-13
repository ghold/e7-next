'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Swords, FileText, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';

const navItems = [
  { href: '/', label: '装备分析', icon: Swords },
  { href: '/rules', label: '规则引擎', icon: FileText },
  { href: '/converter', label: '转换估算', icon: ArrowLeftRight },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="container mx-auto flex h-12 items-center px-4">
        <Link href="/" className="mr-8 flex items-center gap-2.5 group">
          <div className="relative flex items-center justify-center w-7 h-7">
            <Swords className="h-4 w-4 text-gold-400 transition-colors group-hover:text-gold-300" />
            <div className="absolute inset-0 rounded border border-gold-500/20 group-hover:border-gold-400/40 transition-colors" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-gold-400 uppercase">
              E7 GEAR
            </span>
            <span className="text-[9px] font-mono text-steel-500 tracking-[0.15em] uppercase">
              分析系统
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium tracking-wide transition-all",
                  "hover:text-gold-300",
                  isActive
                    ? "text-gold-400"
                    : "text-steel-400"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="uppercase tracking-widest">{item.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-accent-green animate-glow-pulse" />
          <span className="text-[10px] font-mono text-steel-500 uppercase tracking-wider hidden sm:inline">
            SYSTEM ONLINE
          </span>
          <ThemeToggle />
        </div>
      </div>
      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
    </header>
  );
}
