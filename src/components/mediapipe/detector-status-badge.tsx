'use client';

import { DetectorStatus } from '@/types/mediapipe';
import { cn } from '@/lib/utils';

interface DetectorStatusBadgeProps {
  status: DetectorStatus;
  fps?: number;
  className?: string;
}

const STATUS_CONFIG: Record<
  DetectorStatus,
  { label: string; color: string; pulse: boolean }
> = {
  idle: { label: 'Inactivo', color: 'text-gray-400 bg-gray-800', pulse: false },
  loading: { label: 'Cargando modelo...', color: 'text-yellow-400 bg-yellow-900/40', pulse: true },
  ready: { label: 'Listo', color: 'text-green-400 bg-green-900/40', pulse: false },
  detecting: { label: 'Detectando', color: 'text-blue-400 bg-blue-900/40', pulse: true },
  error: { label: 'Error', color: 'text-red-400 bg-red-900/40', pulse: false },
};

export function DetectorStatusBadge({ status, fps, className }: DetectorStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium',
        config.color,
        className
      )}
    >
      <span
        className={cn(
          'w-2 h-2 rounded-full',
          status === 'idle' ? 'bg-gray-400' :
          status === 'loading' ? 'bg-yellow-400' :
          status === 'ready' ? 'bg-green-400' :
          status === 'detecting' ? 'bg-blue-400' : 'bg-red-400',
          config.pulse && 'animate-pulse'
        )}
      />
      <span>{config.label}</span>
      {fps !== undefined && fps > 0 && status === 'detecting' && (
        <span className="opacity-70">{fps} fps</span>
      )}
    </div>
  );
}
