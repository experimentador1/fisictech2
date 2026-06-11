'use client';

import { ReferencePose } from '@/types/mediapipe';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PoseCardProps {
  pose: ReferencePose;
  onSelect?: (pose: ReferencePose) => void;
  onDelete?: (id: string) => void;
  isSelected?: boolean;
  className?: string;
}

const CATEGORY_COLORS = {
  pilates: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  yoga: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  stretching: 'bg-green-500/20 text-green-300 border-green-500/30',
  strength: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  other: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

const CATEGORY_LABELS = {
  pilates: 'Pilates',
  yoga: 'Yoga',
  stretching: 'Estiramiento',
  strength: 'Fuerza',
  other: 'Otro',
};

export function PoseCard({
  pose,
  onSelect,
  onDelete,
  isSelected = false,
  className,
}: PoseCardProps) {
  const jointCount = Object.keys(pose.angles).length;

  return (
    <div
      className={cn(
        'rounded-xl border bg-gray-900 p-4 cursor-pointer transition-all duration-200',
        isSelected
          ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-950/30'
          : 'border-gray-700 hover:border-gray-500',
        className
      )}
      onClick={() => onSelect?.(pose)}
    >
      {/* Thumbnail */}
      <div className="w-full aspect-video rounded-lg bg-gray-800 mb-3 overflow-hidden flex items-center justify-center">
        {pose.imageDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pose.imageDataUrl}
            alt={pose.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl">🧘</span>
        )}
      </div>

      {/* Info */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-white leading-tight">{pose.name}</h3>
          <span
            className={cn(
              'shrink-0 text-xs px-2 py-0.5 rounded-full border',
              CATEGORY_COLORS[pose.category]
            )}
          >
            {CATEGORY_LABELS[pose.category]}
          </span>
        </div>

        {pose.description && (
          <p className="text-xs text-gray-400 line-clamp-2">{pose.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{jointCount} articulaciones</span>
          <span>{new Date(pose.createdAt).toLocaleDateString('es-MX')}</span>
        </div>

        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            className="flex-1 text-xs"
            onClick={e => {
              e.stopPropagation();
              onSelect?.(pose);
            }}
          >
            {isSelected ? 'Seleccionada' : 'Seleccionar'}
          </Button>
          {onDelete && (
            <Button
              size="sm"
              variant="destructive"
              className="text-xs"
              onClick={e => {
                e.stopPropagation();
                onDelete(pose.id);
              }}
            >
              ✕
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
