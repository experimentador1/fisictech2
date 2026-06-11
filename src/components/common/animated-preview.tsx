'use client';

import { useAnimatedPreview } from '@/hooks/use-animated-preview';
import { Dumbbell } from 'lucide-react';

interface AnimatedPreviewProps {
  gifDataUrl?: string;
  className?: string;
  /** Velocidad en ms por frame (default 600) */
  frameDuration?: number;
}

/**
 * Muestra la preview de un ejercicio:
 * - Si es un sprite sheet (formato "sprite:..."), lo anima con CSS steps()
 * - Si es una imagen estática, la muestra directamente
 * - Si no hay nada, muestra un placeholder
 */
export function AnimatedPreview({
  gifDataUrl,
  className = '',
  frameDuration = 600,
}: AnimatedPreviewProps) {
  const preview = useAnimatedPreview(gifDataUrl);

  if (!preview) {
    return (
      <div className={`flex items-center justify-center bg-gray-800 ${className}`}>
        <Dumbbell className="w-7 h-7 text-gray-600" strokeWidth={1} />
      </div>
    );
  }

  if (preview.type === 'static') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={preview.dataUrl}
        alt=""
        className={`object-cover ${className}`}
      />
    );
  }

  // Sprite sheet animado via CSS
  const totalWidth  = preview.frameWidth * preview.frameCount;
  const animationMs = frameDuration * preview.frameCount;

  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{
        backgroundImage:    `url(${preview.dataUrl})`,
        backgroundSize:     `${totalWidth}px 100%`,
        backgroundRepeat:   'no-repeat',
        backgroundPosition: '0 0',
        animation:          `poseflow-sprite ${animationMs}ms steps(${preview.frameCount}) infinite`,
      }}
    />
  );
}
