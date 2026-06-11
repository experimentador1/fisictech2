'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { cn } from '@/lib/utils';

interface WebcamCaptureProps {
  onVideoReady?: (video: HTMLVideoElement, canvas: HTMLCanvasElement) => void;
  onStop?: () => void;
  className?: string;
  width?: number;
  height?: number;
  mirror?: boolean;
}

export interface WebcamCaptureRef {
  video: HTMLVideoElement | null;
  canvas: HTMLCanvasElement | null;
  captureImage: () => string | null;
}

const WebcamCapture = forwardRef<WebcamCaptureRef, WebcamCaptureProps>(
  (
    {
      onVideoReady,
      onStop,
      className,
      width = 640,
      height = 480,
      mirror = true,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useImperativeHandle(ref, () => ({
      video: videoRef.current,
      canvas: canvasRef.current,
      captureImage: () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx || !videoRef.current) return null;
        if (mirror) {
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(videoRef.current, 0, 0, width, height);
        return canvas.toDataURL('image/jpeg', 0.8);
      },
    }));

    useEffect(() => {
      let mounted = true;

      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: width }, height: { ideal: height }, facingMode: 'user' },
            audio: false,
          });

          if (!mounted) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }

          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = async () => {
              await videoRef.current?.play();
              if (videoRef.current && canvasRef.current) {
                canvasRef.current.width = videoRef.current.videoWidth || width;
                canvasRef.current.height = videoRef.current.videoHeight || height;
                onVideoReady?.(videoRef.current, canvasRef.current);
              }
            };
          }
        } catch (err) {
          console.error('Error al acceder a la cámara:', err);
        }
      };

      startCamera();

      return () => {
        mounted = false;
        streamRef.current?.getTracks().forEach(t => t.stop());
        onStop?.();
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <div
        className={cn('relative overflow-hidden rounded-xl', className)}
        style={{ width, height }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: mirror ? 'scaleX(-1)' : 'none' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ transform: mirror ? 'scaleX(-1)' : 'none' }}
        />
      </div>
    );
  }
);

WebcamCapture.displayName = 'WebcamCapture';
export { WebcamCapture };
