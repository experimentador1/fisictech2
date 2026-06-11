'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/training', label: '🎓 Entrenamiento' },
  { href: '/evaluation', label: '📷 Evaluación' },
  { href: '/sessions', label: '📊 Sesiones' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-950/90 backdrop-blur">
      <div className="container max-w-6xl mx-auto flex h-14 items-center px-4">
        <Link href="/" className="mr-8 flex items-center gap-2">
          <span className="text-xl">🤸</span>
          <span className="font-bold text-white">EDUC FÍSICA</span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
