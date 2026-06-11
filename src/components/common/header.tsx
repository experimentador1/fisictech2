'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Dumbbell, Camera, BarChart2, Activity } from 'lucide-react';

const NAV_LINKS = [
  { href: '/training',   label: 'Cargar Lección', icon: Dumbbell },
  { href: '/evaluation', label: 'Evaluación',    icon: Camera },
  { href: '/sessions',   label: 'Sesiones',      icon: BarChart2 },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-gray-950/80 backdrop-blur-xl">
      <div className="container max-w-6xl mx-auto flex h-14 items-center justify-between px-4">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 group cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow duration-200">
            <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-black text-white tracking-tight">
            Pose<span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Flow</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
                  active
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-white/[0.06]'
                )}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
