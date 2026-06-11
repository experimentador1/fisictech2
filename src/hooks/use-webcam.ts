'use client';

import { useState, useRef, useCallback } from 'react';

export type WebcamStatus = 'idle' | 'requesting' | 'active' | 'error';

export interface UseWebcamReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: WebcamStatus;
  errorMessage: string | null;
  startWebcam: (constraints?: MediaStreamConstraints) => Promise<void>;
  stopWebcam: () => void;
  isActive: boolean;
}

const DEFAULT_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'user',
    frameRate: { ideal: 30 },
  },
  audio: false,
};

export function useWebcam(): UseWebcamReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<WebcamStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startWebcam = useCallback(
    async (constraints: MediaStreamConstraints = DEFAULT_CONSTRAINTS) => {
      try {
        setStatus('requesting');
        setErrorMessage(null);

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await new Promise<void>(resolve => {
            if (!videoRef.current) return resolve();
            videoRef.current.onloadedmetadata = () => resolve();
          });
          await videoRef.current.play();
        }

        setStatus('active');
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Error al acceder a la cámara';
        setErrorMessage(msg);
        setStatus('error');
      }
    },
    []
  );

  const stopWebcam = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('idle');
  }, []);

  return {
    videoRef,
    status,
    errorMessage,
    startWebcam,
    stopWebcam,
    isActive: status === 'active',
  };
}
