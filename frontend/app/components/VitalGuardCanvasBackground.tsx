'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface VitalGuardCanvasBackgroundProps {
  opacity?: number;
  isDark?: boolean;
}

export default function VitalGuardCanvasBackground({
  opacity = 0.90,
  isDark = true,
}: VitalGuardCanvasBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [isReady, setIsReady] = useState(false);
  const totalFrames = 80;

  // Track the last drawn frame index to avoid redundant canvas repaints
  const lastDrawnFrameRef = useRef<number>(-1);
  const currentFrameRef = useRef<number>(0);

  // Cached viewport dimensions
  const dimsRef = useRef({ width: 0, height: 0, dpr: 1 });

  // Direct, zero-latency canvas render
  const drawFrame = useCallback(
    (frameIndex: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const targetIndex = Math.min(totalFrames - 1, Math.max(0, Math.round(frameIndex)));

      // Avoid redundant repaints if frame didn't change
      if (targetIndex === lastDrawnFrameRef.current) return;

      let img = imagesRef.current[targetIndex];

      // If target image is still loading/decoding, find nearest loaded frame
      if (!img || !img.complete || img.naturalWidth === 0) {
        for (let offset = 1; offset < totalFrames; offset++) {
          const lower = imagesRef.current[targetIndex - offset];
          if (lower && lower.complete && lower.naturalWidth > 0) {
            img = lower;
            break;
          }
          const higher = imagesRef.current[targetIndex + offset];
          if (higher && higher.complete && higher.naturalWidth > 0) {
            img = higher;
            break;
          }
        }
      }

      if (!img || !img.complete || img.naturalWidth === 0) return;

      lastDrawnFrameRef.current = targetIndex;
      currentFrameRef.current = targetIndex;

      if (typeof window !== 'undefined') {
        (window as any).__lastDrawnFrame = targetIndex;
      }

      let { width: displayWidth, height: displayHeight, dpr } = dimsRef.current;
      if (displayWidth === 0 || displayHeight === 0) {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        displayWidth = window.innerWidth || 1280;
        displayHeight = window.innerHeight || 800;
        dimsRef.current = { width: displayWidth, height: displayHeight, dpr };
        canvas.width = Math.round(displayWidth * dpr);
        canvas.height = Math.round(displayHeight * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Solid backdrop base
      ctx.fillStyle = isDark ? '#0A0D12' : '#F8FAFC';
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      // Cover scaling with centered framing
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = displayWidth / displayHeight;

      let drawW: number;
      let drawH: number;
      let drawX: number;
      let drawY: number;

      if (canvasAspect > imgAspect) {
        drawW = displayWidth;
        drawH = drawW / imgAspect;
        drawX = 0;
        drawY = (displayHeight - drawH) / 2;
      } else {
        drawH = displayHeight;
        drawW = drawH * imgAspect;
        drawX = (displayWidth - drawW) / 2;
        drawY = 0;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
    },
    [isDark, totalFrames]
  );

  // Update canvas size on resize
  const updateDimensions = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth || 1280;
    const h = window.innerHeight || 800;

    dimsRef.current = { width: w, height: h, dpr };
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    // Force redraw on resize
    lastDrawnFrameRef.current = -1;
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight
    );
    const winHeight = window.innerHeight || 800;
    const maxScroll = Math.max(1, docHeight - winHeight);
    const progress = Math.min(1, Math.max(0, scrollY / maxScroll));
    const frameIndex = Math.min(totalFrames - 1, Math.max(0, Math.round(progress * (totalFrames - 1))));
    drawFrame(frameIndex);
  }, [drawFrame, totalFrames]);

  // Synchronous scroll handler tied directly to scrollbar and wheel
  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight
    );
    const winHeight = window.innerHeight || 800;
    const maxScroll = Math.max(1, docHeight - winHeight);
    const progress = Math.min(1, Math.max(0, scrollY / maxScroll));

    // Smoothly map scroll progress directly to frame 0..79
    const frameIndex = Math.min(totalFrames - 1, Math.max(0, Math.round(progress * (totalFrames - 1))));

    if (typeof window !== 'undefined') {
      (window as any).__canvasDiag = {
        scrollY,
        maxScroll,
        progress,
        frameIndex,
        lastDrawnFrame: lastDrawnFrameRef.current,
        totalFrames,
        imagesLoadedCount: imagesRef.current.filter((im) => im && im.complete).length,
      };
    }

    drawFrame(frameIndex);
  }, [drawFrame, totalFrames]);

  // Preload and decode all 80 frames on mount
  useEffect(() => {
    let isCancelled = false;
    const loadedImages: HTMLImageElement[] = [];
    let loadedCount = 0;

    for (let i = 0; i < totalFrames; i++) {
      const img = new Image();
      const numStr = String(i).padStart(3, '0');
      img.src = `/assets/vitalguard/exploded-frames/frame_${numStr}.jpg`;

      img.onload = () => {
        if (!isCancelled) {
          loadedCount++;
          if (loadedCount === 1) {
            setIsReady(true);
            drawFrame(0);
          } else if (loadedCount === 10) {
            setIsReady(true);
            handleScroll();
          }
        }
      };

      // Use decode API when available for stutter-free GPU rendering
      if ('decode' in img) {
        img.decode().catch(() => {});
      }

      loadedImages.push(img);
    }

    imagesRef.current = loadedImages;
    updateDimensions();

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', handleScroll, { passive: true });
    window.addEventListener('touchmove', handleScroll, { passive: true });
    window.addEventListener('resize', updateDimensions, { passive: true });

    // Initial draw
    handleScroll();

    return () => {
      isCancelled = true;
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleScroll);
      window.removeEventListener('touchmove', handleScroll);
      window.removeEventListener('resize', updateDimensions);
    };
  }, [totalFrames, updateDimensions, drawFrame, handleScroll]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        backgroundColor: isDark ? '#0A0D12' : '#F8FAFC',
        transform: 'translateZ(0)',
      }}
    >
      {/* ── HTML5 Canvas ───────────────────────────────────────────── */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          opacity: isReady ? opacity : 0,
          transition: 'opacity 300ms ease-out',
        }}
      />

      {/* ── Subtle Ambient Cyber Overlay (Light, Non-Obtrusive) ────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isDark
            ? 'radial-gradient(ellipse at 50% 50%, rgba(10, 13, 18, 0.08) 0%, rgba(10, 13, 18, 0.45) 85%, #0A0D12 100%)'
            : 'radial-gradient(ellipse at 50% 50%, rgba(248, 250, 252, 0.12) 0%, rgba(248, 250, 252, 0.60) 85%, #F8FAFC 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
