'use client';

import { useMemo } from 'react';

export interface SpritePreview {
  type: 'sprite';
  dataUrl: string;
  frameWidth: number;
  frameCount: number;
}

export interface StaticPreview {
  type: 'static';
  dataUrl: string;
}

export type PreviewData = SpritePreview | StaticPreview;

/**
 * Parsea el gifDataUrl de un Exercise y devuelve la info necesaria
 * para renderizar la preview (estática o sprite animado).
 *
 * Formato sprite: "sprite:<frameWidth>:<frameCount>:<dataUrl>"
 */
export function useAnimatedPreview(gifDataUrl?: string): PreviewData | null {
  return useMemo(() => {
    if (!gifDataUrl) return null;

    if (gifDataUrl.startsWith('sprite:')) {
      const firstColon  = gifDataUrl.indexOf(':');
      const secondColon = gifDataUrl.indexOf(':', firstColon + 1);
      const thirdColon  = gifDataUrl.indexOf(':', secondColon + 1);

      const frameWidth  = parseInt(gifDataUrl.slice(firstColon + 1, secondColon), 10);
      const frameCount  = parseInt(gifDataUrl.slice(secondColon + 1, thirdColon), 10);
      const dataUrl     = gifDataUrl.slice(thirdColon + 1);

      if (!isNaN(frameWidth) && !isNaN(frameCount) && dataUrl) {
        return { type: 'sprite', dataUrl, frameWidth, frameCount };
      }
    }

    return { type: 'static', dataUrl: gifDataUrl };
  }, [gifDataUrl]);
}
