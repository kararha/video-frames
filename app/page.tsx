"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";

const ModelViewer = dynamic(() => import("./ModelViewer"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full rounded-3xl flex items-center justify-center"
      style={{
        aspectRatio: '1 / 1',
        backgroundColor: 'rgba(255,255,255,0.5)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
      }}
    >
      <div
        className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'rgba(0,0,0,0.1)', borderTopColor: '#ff5500' }}
      />
    </div>
  ),
});

const TOTAL_FRAMES = 150;

// ─────────────────────────────────────────────────────────────────────────────
// Storytelling Chapter Definitions
// Each chapter appears at a specific scroll % range over the 150-frame animation
// ─────────────────────────────────────────────────────────────────────────────
interface StoryChapter {
  id: string;
  startPercent: number; // When this chapter starts appearing (0-100)
  endPercent: number;   // When this chapter finishes disappearing (0-100)
  badge?: string;
  headline: React.ReactNode;
  subline: string;
  showCTA?: boolean;
}

const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: "ch-intro",
    startPercent: 0,
    endPercent: 22,
    badge: "دريم فريم",
    headline: (
      <>
        نصنع <span className="accent">المستحيل</span>
        <br />
        في عالم <span className="gold">رقمي</span>
      </>
    ),
    subline: "حيث يلتقي الخيال بالهندسة — نبني تجارب رقمية تتحدى التوقعات",
  },
  {
    id: "ch-vision",
    startPercent: 22,
    endPercent: 44,
    badge: "الرؤية",
    headline: (
      <>
        كل <span className="accent">بكسل</span> يروي قصة
      </>
    ),
    subline: "من الفكرة الأولى إلى المنتج النهائي، نحوّل كل تفصيلة إلى تجربة سينمائية لا تُنسى",
  },
  {
    id: "ch-tech",
    startPercent: 44,
    endPercent: 66,
    badge: "التقنية",
    headline: (
      <>
        بنية تحتية <span className="accent">فائقة</span>
        <br />
        بلا حدود
      </>
    ),
    subline: "أنظمة موزعة عالمياً، ذكاء اصطناعي توليدي، وأداء لا يُضاهى — بسرعة التفكير",
  },
  {
    id: "ch-craft",
    startPercent: 66,
    endPercent: 85,
    badge: "الحِرفة",
    headline: (
      <>
        هندسة <span className="gold">الجيل</span> القادم
      </>
    ),
    subline: "نجمع بين الفن والعلم لنبني منتجات رقمية تُلهم وتُغيّر قواعد اللعبة",
  },
  {
    id: "ch-cta",
    startPercent: 85,
    endPercent: 100,
    badge: "ابدأ الآن",
    headline: (
      <>
        جاهز لـ<span className="accent">تحويل</span> رؤيتك؟
      </>
    ),
    subline: "اكتشف كيف نبني تجارب رقمية تتجاوز الخيال",
    showCTA: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Inline SVG Logos (unchanged, monochrome)
// ─────────────────────────────────────────────────────────────────────────────
const ReactLogo = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="-11.5 -10.23174 23 20.46348" fill="currentColor">
    <circle cx="0" cy="0" r="2.05" />
    <g stroke="currentColor" strokeWidth="1" fill="none">
      <ellipse rx="11" ry="4.2" />
      <ellipse rx="11" ry="4.2" transform="rotate(60)" />
      <ellipse rx="11" ry="4.2" transform="rotate(120)" />
    </g>
  </svg>
);

const NextjsLogo = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.666 17.382l-6.953-8.868v8.868H9.25V6.618h1.833l7.083 9.043V6.618h1.5v10.764h-2z" />
  </svg>
);

const FlutterLogo = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14.314 0L2.3 12 6 15.7 21.684.013h-7.37zm.014 11.072L7.857 17.53l3.7 3.702 3.7-3.702 6.443-6.458h-7.372zM15.243 24l-3.686-3.686 3.686-3.686h7.372L18.93 20.314 22.615 24h-7.372z" />
  </svg>
);

const NodeLogo = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a1.5 1.5 0 0 0-.75.2l-8 4.62A1.5 1.5 0 0 0 2.5 8.12v9.24a1.5 1.5 0 0 0 .75 1.3l8 4.62a1.5 1.5 0 0 0 1.5 0l8-4.62a1.5 1.5 0 0 0 .75-1.3V8.12a1.5 1.5 0 0 0-.75-1.3l-8-4.62A1.5 1.5 0 0 0 12 2zm0 2.3 6.5 3.75v7.5L12 19.3 5.5 15.55v-7.5L12 4.3z" />
    <path d="M10 8h2v8h-2z" />
  </svg>
);

const ExpressLogo = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M1.5 16.5l4.5-8h2l-3.3 5.7L8 16.5H6.2l-2.4-4.3-2.3 4.3H0l4.5-8zm11.5 0V8.5h4.8c1.5 0 2.7.9 2.7 2.3 0 .9-.5 1.7-1.3 2 1 .3 1.7 1.2 1.7 2.2 0 1.5-1.2 2.5-2.8 2.5H13zm2-5h2.6c.5 0 .9-.3.9-.8s-.4-.8-.9-.8H15v1.6zm0 3.4h2.8c.5 0 .9-.4.9-.9s-.4-.9-.9-.9H15v1.8z" />
  </svg>
);

const SupabaseLogo = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L.103 13.916a.396.396 0 0 0 .307.638H9.6v8.958a.396.396 0 0 0 .716.233l11.181-13.753a.396.396 0 0 0-.307-.638z" />
  </svg>
);

const GoLogo = () => (
  <svg className="w-6 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M1.5 10.5c.8-2.6 3.1-4.5 5.9-4.5 3.3 0 6 2.7 6 6s-2.7 6-6 6c-3.1 0-5.6-2.3-5.9-5.3H6c.4 1.8 2 3.1 3.9 3.1 2.2 0 4-1.8 4-4s-1.8-4-4-4c-1.8 0-3.3 1.2-3.8 2.8H8v2H1.5v-2.1zm12.5 1.5c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6-6-2.7-6-6zm10 0c0-2.2-1.8-4-4-4s-4 1.8-4 4 1.8 4 4 4 4-1.8 4-4z" />
  </svg>
);

const DockerLogo = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.983 11.078h2.119a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.119a.185.185 0 0 0-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 0 0 .186-.186V3.574a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 0 0 .186-.186V6.29a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.887c0 .102.082.186.185.186m-2.93 0h2.12a.186.186 0 0 0 .184-.186V6.29a.185.185 0 0 0-.185-.185H8.1a.185.185 0 0 0-.185.185v1.887c0 .102.083.186.185.186m-2.964 0h2.119a.186.186 0 0 0 .185-.186V6.29a.185.185 0 0 0-.185-.185H5.136a.186.186 0 0 0-.186.185v1.887c0 .102.084.186.186.186m5.893 2.715h2.119a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.119a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 0 0 .185-.185V9.006a.185.185 0 0 0-.185-.186H5.136a.186.186 0 0 0-.186.185v1.888c0 .102.084.185.186.185m-2.928 0h2.119a.185.185 0 0 0 .185-.185V9.006a.185.185 0 0 0-.185-.186H2.208a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185M23.79 9.89a4.94 4.94 0 0 0-3.27-2.457.48.48 0 0 0-.52.285 4.35 4.35 0 0 1-2.27 2.178.25.25 0 0 1-.295-.084 7.28 7.28 0 0 0-4.04-2.528.32.32 0 0 0-.34.195l-.12.288a.24.24 0 0 1-.22.146H.24a.24.24 0 0 0-.24.24v.24c0 3.29 1.48 6.27 4.13 8.16 2.06 1.47 4.6 2.27 7.23 2.27 7.05 0 12.35-4.49 12.63-10.74a.45.45 0 0 0-.2-.39" />
  </svg>
);

const NginxLogo = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0L1.6 6v12L12 24l10.4-6V6L12 0zm-1.8 17.5l-4-5.2v5.2H4.6V6.5h1.6l4 5.2V6.5h1.6v11h-1.6zm8.8 0h-4.2V6.5h1.6v9.4h2.6v1.6z" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Scroll Reveal Hook — Intersection Observer for storytelling sections
// ─────────────────────────────────────────────────────────────────────────────
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, revealed };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function DreamFrameHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // References for animation state & loaded images
  const imagesRef = useRef<Array<HTMLImageElement | null>>(new Array(TOTAL_FRAMES + 1).fill(null));
  const loadedFramesRef = useRef<Set<number>>(new Set());
  const targetFrameRef = useRef<number>(1);
  const currentFrameRef = useRef<number>(1);
  const lastDrawnFrameRef = useRef<number>(-1);
  const isLoadedRef = useRef<boolean>(false);

  // Scroll reveal hooks for each content section
  const marqueeReveal = useScrollReveal(0.1);
  const bentoReveal = useScrollReveal(0.08);
  const creatorReveal = useScrollReveal(0.08);

  const getFrameSrc = (index: number) => {
    const pad = String(index).padStart(3, "0");
    return `/output_frames/frame_${pad}.png`;
  };

  // Determine which story chapter is active based on scroll progress
  const getChapterState = useCallback((chapter: StoryChapter, progress: number) => {
    const percent = progress * 100;
    const fadeInEnd = chapter.startPercent + 5;
    const fadeOutStart = chapter.endPercent - 5;

    if (percent < chapter.startPercent || percent > chapter.endPercent) {
      return "hidden";
    }
    if (percent >= chapter.startPercent && percent < fadeInEnd) {
      return "active"; // Entering
    }
    if (percent >= fadeOutStart && percent <= chapter.endPercent) {
      if (chapter.endPercent >= 100) return "active"; // Last chapter stays
      return "exiting";
    }
    return "active";
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    let isComponentMounted = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReducedMotion = reducedMotionQuery.matches;
    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
    };
    reducedMotionQuery.addEventListener("change", handleMotionChange);

    const updateCanvasDimensions = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const targetPixelWidth = Math.round(width * dpr);
      const targetPixelHeight = Math.round(height * dpr);

      if (canvas.width !== targetPixelWidth || canvas.height !== targetPixelHeight) {
        canvas.width = targetPixelWidth;
        canvas.height = targetPixelHeight;
      }
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      renderFrame(Math.round(currentFrameRef.current), true);
    };

    const drawImageCover = (img: HTMLImageElement) => {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, w, h);

      const imgW = img.naturalWidth || 1280;
      const imgH = img.naturalHeight || 720;
      const imgRatio = imgW / imgH;
      const screenRatio = w / h;

      let drawW: number, drawH: number, drawX: number, drawY: number;
      if (screenRatio > imgRatio) {
        drawW = w; drawH = w / imgRatio; drawX = 0; drawY = (h - drawH) / 2;
      } else {
        drawW = h * imgRatio; drawH = h; drawX = (w - drawW) / 2; drawY = 0;
      }
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
    };

    const renderFrame = (frameIndex: number, force = false) => {
      const clamped = Math.max(1, Math.min(TOTAL_FRAMES, frameIndex));
      const loadedFrames = loadedFramesRef.current;
      let chosenFrame = clamped;

      if (!loadedFrames.has(chosenFrame)) {
        let bestDistance = Infinity;
        for (const loadedIdx of loadedFrames) {
          const dist = Math.abs(loadedIdx - chosenFrame);
          if (dist < bestDistance) { bestDistance = dist; chosenFrame = loadedIdx; }
        }
      }

      if (!force && chosenFrame === lastDrawnFrameRef.current) return;
      const img = imagesRef.current[chosenFrame];
      if (img && img.complete && img.naturalWidth > 0) {
        drawImageCover(img);
        lastDrawnFrameRef.current = chosenFrame;
      }
    };

    const updateScrollProgress = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      const maxScroll = containerHeight - viewportHeight;
      if (maxScroll <= 0) { targetFrameRef.current = 1; setScrollProgress(0); return; }

      const scrolled = -rect.top;
      const progress = Math.min(Math.max(scrolled / maxScroll, 0), 1);
      targetFrameRef.current = 1 + progress * (TOTAL_FRAMES - 1);
      setScrollProgress(progress);
    };

    const preloadImage = (index: number): Promise<void> => {
      return new Promise((resolve) => {
        if (imagesRef.current[index]) { resolve(); return; }
        const img = new Image();
        img.src = getFrameSrc(index);
        img.onload = () => {
          if (!isComponentMounted) return;
          imagesRef.current[index] = img;
          loadedFramesRef.current.add(index);
          if (index === 1 && !isLoadedRef.current) {
            isLoadedRef.current = true;
            renderFrame(1, true);
          } else {
            const currentTarget = Math.round(currentFrameRef.current);
            if (lastDrawnFrameRef.current === -1 || Math.abs(index - currentTarget) < Math.abs(lastDrawnFrameRef.current - currentTarget)) {
              renderFrame(currentTarget, true);
            }
          }
          resolve();
        };
        img.onerror = () => {
          const fallback = new Image();
          const pad = String(index).padStart(3, "0");
          fallback.src = `/output_frames/frame-${pad}.png`;
          fallback.onload = () => {
            if (!isComponentMounted) return;
            imagesRef.current[index] = fallback;
            loadedFramesRef.current.add(index);
            if (index === 1 && !isLoadedRef.current) {
              isLoadedRef.current = true;
              renderFrame(1, true);
            } else {
              const currentTarget = Math.round(currentFrameRef.current);
              if (lastDrawnFrameRef.current === -1 || Math.abs(index - currentTarget) < Math.abs(lastDrawnFrameRef.current - currentTarget)) {
                renderFrame(currentTarget, true);
              }
            }
            resolve();
          };
          fallback.onerror = () => resolve();
        };
      });
    };

    const preloadAllFrames = async () => {
      await preloadImage(1);
      const queue = Array.from({ length: TOTAL_FRAMES - 1 }, (_, i) => i + 2);
      const concurrency = 6;
      const worker = async () => {
        while (queue.length > 0 && isComponentMounted) {
          const frameIdx = queue.shift();
          if (frameIdx) await preloadImage(frameIdx);
        }
      };
      await Promise.all(Array.from({ length: concurrency }, () => worker()));
    };

    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

    const animationLoop = () => {
      if (!isComponentMounted) return;
      const target = targetFrameRef.current;
      const current = currentFrameRef.current;
      const diff = target - current;

      if (prefersReducedMotion) {
        currentFrameRef.current = target;
        renderFrame(Math.round(target));
      } else {
        if (Math.abs(diff) > 0.001) {
          currentFrameRef.current = lerp(current, target, 0.12);
          renderFrame(Math.round(currentFrameRef.current));
        } else if (current !== target) {
          currentFrameRef.current = target;
          renderFrame(Math.round(target));
        }
      }
      animationFrameId = requestAnimationFrame(animationLoop);
    };

    updateCanvasDimensions();
    updateScrollProgress();
    preloadAllFrames();
    animationLoop();

    const handleScroll = () => updateScrollProgress();
    const handleResize = () => { updateCanvasDimensions(); updateScrollProgress(); };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      isComponentMounted = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      reducedMotionQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  // Marquee data
  const row1Logos = [
    { name: "React", svg: <ReactLogo />, paddingClass: "px-9" },
    { name: "Next.js", svg: <NextjsLogo />, paddingClass: "px-12" },
    { name: "Flutter", svg: <FlutterLogo />, paddingClass: "px-8" },
    { name: "Node.js", svg: <NodeLogo />, paddingClass: "px-11" },
    { name: "Express", svg: <ExpressLogo />, paddingClass: "px-10" },
    { name: "Supabase", svg: <SupabaseLogo />, paddingClass: "px-12" },
    { name: "Go", svg: <GoLogo />, paddingClass: "px-8" },
    { name: "Docker", svg: <DockerLogo />, paddingClass: "px-10" },
    { name: "NGINX", svg: <NginxLogo />, paddingClass: "px-11" },
  ];

  const row2Logos = [
    { name: "Docker", svg: <DockerLogo />, paddingClass: "px-11" },
    { name: "Supabase", svg: <SupabaseLogo />, paddingClass: "px-8" },
    { name: "Next.js", svg: <NextjsLogo />, paddingClass: "px-12" },
    { name: "Go", svg: <GoLogo />, paddingClass: "px-9" },
    { name: "Flutter", svg: <FlutterLogo />, paddingClass: "px-11" },
    { name: "NGINX", svg: <NginxLogo />, paddingClass: "px-8" },
    { name: "React", svg: <ReactLogo />, paddingClass: "px-10" },
    { name: "Node.js", svg: <NodeLogo />, paddingClass: "px-12" },
    { name: "Express", svg: <ExpressLogo />, paddingClass: "px-9" },
  ];

  // Is hero section in view?
  const heroInView = scrollProgress < 1;

  return (
    <div className="relative w-full bg-black text-white selection:bg-amber-500/30 selection:text-white">

      {/* ═══════════════════════════════════════════════════════════════════════
          SCROLL PROGRESS BAR — Thin amber line at top
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className={`scroll-progress-bar ${heroInView ? 'visible' : ''}`}
        style={{ transform: `scaleX(${scrollProgress})` }}
      />

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO SECTION — 150-frame scroll sequence with cinematic text reveals
          ═══════════════════════════════════════════════════════════════════════ */}
      <section
        ref={containerRef}
        className="relative w-full h-[450vh] bg-black select-none"
      >
        {/* Sticky full-screen viewport */}
        <div className="sticky top-0 left-0 w-full h-screen h-dvh overflow-hidden">

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-0 object-cover"
          />

          {/* Cinematic Vignette */}
          <div
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{
              background:
                "radial-gradient(circle at 50% 48%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0.88) 80%, #000000 100%)",
            }}
          />

          {/* Noise grain */}
          <div
            className="pointer-events-none absolute inset-0 z-[2] opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat",
            }}
          />

          {/* ─── STORYTELLING CHAPTERS ─── */}
          {STORY_CHAPTERS.map((chapter) => {
            const state = getChapterState(chapter, scrollProgress);
            return (
              <div
                key={chapter.id}
                className={`story-chapter ${state === 'hidden' ? '' : state}`}
              >
                {chapter.badge && (
                  <div className="story-badge">
                    <span className="dot" />
                    <span>{chapter.badge}</span>
                  </div>
                )}
                <h1 className="story-headline">{chapter.headline}</h1>
                <div className="story-divider" />
                <p className="story-subline">{chapter.subline}</p>
                {chapter.showCTA && (
                  <button className="hero-cta mt-8" onClick={() => {
                    document.getElementById('chapter-tech')?.scrollIntoView({ behavior: 'smooth' });
                  }}>
                    <span>اكتشف المزيد</span>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17l9.2-9.2M17 17V7H7" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}

          {/* Scroll hint at bottom of first chapter */}
          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 transition-opacity duration-500"
            style={{ opacity: scrollProgress < 0.05 ? 1 : 0 }}
          >
            <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase">مرر للأسفل</span>
            <div className="w-5 h-8 rounded-full border border-zinc-600 flex items-start justify-center p-1.5">
              <div className="w-1 h-2 rounded-full bg-amber-500 animate-bounce" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          CONTENT SECTIONS — Narrative flow continues
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 w-full bg-[#000000] overflow-hidden">

        {/* Grain overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
          }}
        />

        {/* Atmospheric warm glows */}
        <div className="pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-[radial-gradient(ellipse_at_center,rgba(255,85,0,0.06),transparent_70%)] blur-3xl" />
        <div className="pointer-events-none absolute top-[750px] right-4 w-[650px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(212,160,23,0.05),transparent_70%)] blur-3xl" />
        <div className="pointer-events-none absolute bottom-40 left-10 w-[550px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(255,85,0,0.04),transparent_70%)] blur-3xl" />

        {/* ═══════════════════════════════════════════════════════════════════
            CHAPTER 01 — TECH STACK MARQUEE
            ═══════════════════════════════════════════════════════════════════ */}
        <section
          id="chapter-tech"
          ref={marqueeReveal.ref}
          className={`reveal-section ${marqueeReveal.revealed ? 'revealed' : ''} relative z-10 w-full pt-28 pb-28 overflow-hidden border-b border-white/[0.04]`}
        >
          {/* Narrative Section Header */}
          <div className="flex flex-col items-center justify-center text-center mb-14 px-4">
            <span className="section-chapter-number">الفصل الأول</span>
            <h2 className="section-narrative">
              أدوات <span className="accent">المحترفين</span>
            </h2>
            <p className="mt-3 text-zinc-400 font-light text-sm sm:text-base leading-relaxed max-w-lg">
              نختار تقنياتنا بعناية فائقة — كل أداة تم اختبارها في بيئات إنتاج حقيقية بملايين المستخدمين
            </p>
          </div>

          {/* Marquee with soft edge mask */}
          <div
            className="w-full flex flex-col gap-6"
            style={{
              maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
            }}
          >
            {/* Row 1: Right to Left */}
            <div className="flex w-max animate-marquee-left hover:[animation-play-state:paused] py-2">
              {row1Logos.map((item, idx) => (
                <div key={`r1-a-${idx}`} className={item.paddingClass}>
                  <div className="flex items-center gap-3 text-white/50 hover:text-white transition-opacity duration-300 cursor-pointer select-none">
                    {item.svg}
                    <span className="text-xs sm:text-sm font-medium tracking-wide">{item.name}</span>
                  </div>
                </div>
              ))}
              {row1Logos.map((item, idx) => (
                <div key={`r1-b-${idx}`} className={item.paddingClass}>
                  <div className="flex items-center gap-3 text-white/50 hover:text-white transition-opacity duration-300 cursor-pointer select-none">
                    {item.svg}
                    <span className="text-xs sm:text-sm font-medium tracking-wide">{item.name}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Row 2: Left to Right */}
            <div className="flex w-max animate-marquee-right hover:[animation-play-state:paused] py-2">
              {row2Logos.map((item, idx) => (
                <div key={`r2-a-${idx}`} className={item.paddingClass}>
                  <div className="flex items-center gap-3 text-white/50 hover:text-white transition-opacity duration-300 cursor-pointer select-none">
                    {item.svg}
                    <span className="text-xs sm:text-sm font-medium tracking-wide">{item.name}</span>
                  </div>
                </div>
              ))}
              {row2Logos.map((item, idx) => (
                <div key={`r2-b-${idx}`} className={item.paddingClass}>
                  <div className="flex items-center gap-3 text-white/50 hover:text-white transition-opacity duration-300 cursor-pointer select-none">
                    {item.svg}
                    <span className="text-xs sm:text-sm font-medium tracking-wide">{item.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            CHAPTER 02 — CAPABILITIES BENTO GRID
            ═══════════════════════════════════════════════════════════════════ */}
        <section
          ref={bentoReveal.ref}
          className={`reveal-section ${bentoReveal.revealed ? 'revealed' : ''} relative z-10 w-full py-28 sm:py-36 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto`}
        >
          {/* Narrative Header */}
          <div className="mb-16 sm:mb-20 max-w-2xl">
            <span className="section-chapter-number">الفصل الثاني</span>
            <h2 className="section-narrative">
              ما نبنيه <span className="accent">يُغيّر</span> القواعد
            </h2>
            <p className="mt-4 text-zinc-400 font-light text-sm sm:text-base leading-relaxed">
              هندسة أنظمة فائقة التزامن، وواجهات توليدية ذكية، وبنية تحتية رقمية موزعة ذات موثوقية عالية.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1.35fr_1.45fr] gap-4 sm:gap-5 lg:gap-6 auto-rows-[minmax(240px,auto)] reveal-stagger">

            {/* CARD 1: Automation */}
            <div className="bento-card group relative rounded-3xl bg-zinc-950/60 border border-white/[0.08] hover:border-amber-500/35 p-6 sm:p-7 flex flex-col justify-between overflow-hidden backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] col-span-1 lg:col-start-1 lg:row-start-1">
              <div className="pointer-events-none absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-amber-500/[0.04] blur-2xl group-hover:bg-amber-500/[0.12] transition-colors duration-500" />

              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">أدوات الأتمتة</span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  99.98% جاهزية
                </span>
              </div>

              <div className="my-6 z-10">
                <div className="rounded-2xl border border-white/[0.06] bg-black/40 p-4">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-3">
                    <span>المحفز: webhook</span>
                    <span className="text-amber-400">معالجة ذاتية</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-[10px] text-amber-400 font-mono">01</div>
                    <div className="h-0.5 flex-1 bg-gradient-to-r from-amber-500/60 to-zinc-700" />
                    <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-amber-500/40 flex items-center justify-center text-[10px] text-white font-mono shadow-[0_0_8px_rgba(255,85,0,0.3)]">02</div>
                    <div className="h-0.5 flex-1 bg-zinc-800" />
                    <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-[10px] text-zinc-400 font-mono">03</div>
                  </div>
                </div>
              </div>

              <div className="z-10">
                <h3 className="text-lg font-normal text-white tracking-tight group-hover:text-amber-400 transition-colors">
                  سير عمل ذاتي ومستقل
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">
                  طوابير أحداث مدفوعة بالبيانات، خطوط أنابيب مرنة، وتنسيق فوري لواجهات الويب هوك.
                </p>
              </div>
            </div>

            {/* CARD 2: Dashboards */}
            <div className="bento-card group relative rounded-3xl bg-zinc-950/60 border border-white/[0.08] hover:border-amber-500/35 p-6 sm:p-7 flex flex-col justify-between overflow-hidden backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] col-span-1 lg:col-start-2 lg:row-start-1">
              <div className="pointer-events-none absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-amber-500/[0.04] blur-2xl group-hover:bg-amber-500/[0.12] transition-colors duration-500" />

              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">لوحات التحكم الإدارية</span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/30 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                  استجابة &lt; 14 ملّي ثانية
                </span>
              </div>

              <div className="my-6 z-10">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-2xl sm:text-3xl font-light text-white tracking-tight font-mono">1.28M</span>
                  <span className="text-[11px] font-mono text-zinc-400">طلب / دقيقة</span>
                </div>
                <svg className="w-full h-16 overflow-visible" viewBox="0 0 300 70" fill="none">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff5500" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#ff5500" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 50 Q 50 40, 100 45 T 200 20 T 300 12 L 300 70 L 0 70 Z" fill="url(#chartGrad)" />
                  <path d="M0 50 Q 50 40, 100 45 T 200 20 T 300 12" stroke="#ff5500" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="300" cy="12" r="3.5" fill="#ffffff" stroke="#ff5500" strokeWidth="2" />
                </svg>
              </div>

              <div className="z-10">
                <h3 className="text-lg font-normal text-white tracking-tight group-hover:text-amber-400 transition-colors">
                  قياسات وتحليلات لحظية
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">
                  تحليلات مجمعة فائقة السرعة مع تدفق للمقاييس وسجلات تدقيق تفصيلية في أجزاء من الثانية.
                </p>
              </div>
            </div>

            {/* CARD 3: AI — FEATURED TALL */}
            <div className="bento-card group relative rounded-3xl bg-zinc-950/70 border border-white/[0.08] hover:border-amber-500/40 p-7 sm:p-8 flex flex-col justify-between overflow-hidden backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] col-span-1 sm:col-span-2 lg:col-start-3 lg:row-start-1 lg:row-span-2">
              <div className="pointer-events-none absolute -top-10 -right-10 w-72 h-72 rounded-full bg-amber-500/[0.08] blur-3xl group-hover:bg-amber-500/[0.16] transition-colors duration-700" />
              <div className="pointer-events-none absolute bottom-0 left-0 w-60 h-60 rounded-full bg-orange-600/[0.05] blur-3xl" />

              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] font-mono text-amber-400 tracking-widest uppercase">المنصة المميزة</span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-zinc-300 bg-white/[0.05] border border-white/10 px-3 py-1 rounded-full">
                  vLLM · 4.8k رمز/ث
                </span>
              </div>

              <div className="my-8 z-10 flex flex-col gap-6">
                <div className="relative w-full h-44 flex items-center justify-center">
                  <div className="absolute w-40 h-40 rounded-full border border-amber-500/20 animate-[spin_24s_linear_infinite]" />
                  <div className="absolute w-28 h-28 rounded-full border border-dashed border-white/20 animate-[spin_16s_linear_infinite_reverse]" />
                  <div className="absolute w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center shadow-[0_0_24px_rgba(255,85,0,0.3)]">
                    <span className="w-3 h-3 rounded-full bg-[#ff5500] animate-pulse" />
                  </div>
                  <span className="absolute top-2 left-6 text-[10px] font-mono text-zinc-400 bg-black/60 border border-white/10 px-2 py-0.5 rounded-md">
                    تضمين: 1536d
                  </span>
                  <span className="absolute bottom-3 right-6 text-[10px] font-mono text-amber-300 bg-black/60 border border-amber-500/30 px-2 py-0.5 rounded-md">
                    فضاء كامن: 16-bit
                  </span>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-black/60 p-4 font-mono text-xs text-zinc-300 leading-relaxed shadow-inner" dir="rtl">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-white/[0.06] mb-2.5 text-[10px] text-zinc-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                    <span>multi-modal-diffusion.engine</span>
                  </div>
                  <p className="text-zinc-400">
                    <span className="text-amber-400">&gt;</span> الأمر: &quot;لوحة فنية سينمائية واقعية بدقة 8K...&quot;
                  </p>
                  <p className="text-emerald-400 mt-1">
                    ✓ تم تجميع الأوزان (0.34ث) · الاستدلال نشط
                  </p>
                </div>
              </div>

              <div className="z-10">
                <h3 className="text-xl sm:text-2xl font-light text-white tracking-tight group-hover:text-amber-400 transition-colors">
                  تطبيقات مدمجة بالذكاء الاصطناعي
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">
                  تنسيق نماذج متعددة الوسائط مخصصة بدقة فائقة، واستدلال فوري، وتنفيذ موثوق لوكلاء الذكاء الاصطناعي.
                </p>
              </div>
            </div>

            {/* CARD 4: Mobile — TALL */}
            <div className="bento-card group relative rounded-3xl bg-zinc-950/60 border border-white/[0.08] hover:border-amber-500/35 p-6 sm:p-7 flex flex-col justify-between overflow-hidden backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] col-span-1 lg:col-start-1 lg:row-start-2 lg:row-span-2">
              <div className="pointer-events-none absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-amber-500/[0.04] blur-2xl group-hover:bg-amber-500/[0.12] transition-colors duration-500" />

              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">تطبيقات الجوال</span>
                <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.05] border border-white/10 px-2 py-0.5 rounded-full">
                  شاشة 120 إطار/ث
                </span>
              </div>

              <div className="my-8 z-10 flex justify-center">
                <div className="w-48 rounded-[28px] border-2 border-white/15 bg-black/80 p-3 shadow-2xl relative overflow-hidden">
                  <div className="w-16 h-3 rounded-full bg-zinc-900 mx-auto mb-4 border border-white/10" />
                  <div className="rounded-xl bg-zinc-900/80 border border-white/10 p-3 mb-2.5">
                    <div className="w-10 h-1.5 rounded-full bg-amber-500/60 mb-2" />
                    <div className="flex items-center justify-between text-[11px] font-mono text-white">
                      <span>حالة المزامنة</span>
                      <span className="text-emerald-400">متصل الآن</span>
                    </div>
                  </div>
                  <div className="flex items-end justify-between h-10 px-2 pb-1 gap-1">
                    <span className="w-1.5 bg-zinc-700 h-4 rounded-full" />
                    <span className="w-1.5 bg-zinc-600 h-7 rounded-full" />
                    <span className="w-1.5 bg-amber-500 h-9 rounded-full" />
                    <span className="w-1.5 bg-orange-400 h-6 rounded-full" />
                    <span className="w-1.5 bg-zinc-700 h-3 rounded-full" />
                  </div>
                </div>
              </div>

              <div className="z-10">
                <h3 className="text-lg font-normal text-white tracking-tight group-hover:text-amber-400 transition-colors">
                  تطبيقات جوال أصيلة وسلسة
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">
                  واجهات إيماءات تفاعلية بسرعة 120 إطاراً في الثانية مصممة بأعلى معايير الأداء لمنصتي iOS و Android.
                </p>
              </div>
            </div>

            {/* CARD 5: Edge Architecture */}
            <div className="bento-card group relative rounded-3xl bg-zinc-950/60 border border-white/[0.08] hover:border-amber-500/35 p-6 sm:p-7 flex flex-col justify-between items-center text-center overflow-hidden backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] col-span-1 lg:col-start-2 lg:row-start-2">
              <div className="pointer-events-none absolute inset-0 bg-radial from-amber-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="w-full flex justify-between z-10 text-[11px] font-mono text-zinc-500 uppercase">
                <span>البنية التحتية</span>
                <span className="text-amber-400">استجابة &lt; 8 ملّي ثانية</span>
              </div>

              <div className="my-6 z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:border-amber-500/40 group-hover:scale-105 transition-all duration-500 shadow-[0_0_20px_rgba(255,85,0,0.15)]">
                  <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="3" />
                    <circle cx="12" cy="19" r="3" />
                    <circle cx="5" cy="12" r="3" />
                    <circle cx="19" cy="12" r="3" />
                    <circle cx="12" cy="12" r="1.5" />
                  </svg>
                </div>
              </div>

              <div className="z-10 w-full text-start">
                <h3 className="text-base sm:text-lg font-normal text-white tracking-tight group-hover:text-amber-400 transition-colors">
                  الأنظمة الموزعة والحوسبة الطرفية
                </h3>
                <p className="mt-1 text-xs text-zinc-400 font-light leading-relaxed">
                  تشغيل لحظي فوري بدون تأخير مع تكرار جغرافي للبيانات وحوسبة سحابية موزعة على الحافة.
                </p>
              </div>
            </div>

            {/* CARD 6: E-Commerce */}
            <div className="bento-card group relative rounded-3xl bg-zinc-950/60 border border-white/[0.08] hover:border-amber-500/35 p-6 sm:p-7 flex flex-col justify-between overflow-hidden backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] col-span-1 lg:col-start-2 lg:row-start-3">
              <div className="pointer-events-none absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-amber-500/[0.04] blur-2xl group-hover:bg-amber-500/[0.12] transition-colors duration-500" />

              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">منصات التجارة الرقمية</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                  متعدد العملات
                </span>
              </div>

              <div className="my-5 z-10 flex flex-col items-start">
                <div className="text-3xl sm:text-4xl font-light text-white tracking-tight font-mono">
                  $48M<span className="text-amber-400">+</span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-[10px] font-mono text-zinc-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">USD</span>
                  <span className="text-[10px] font-mono text-zinc-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">EUR</span>
                  <span className="text-[10px] font-mono text-zinc-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">SAR</span>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-full">تسوية فورية</span>
                </div>
              </div>

              <div className="z-10">
                <h3 className="text-lg font-normal text-white tracking-tight group-hover:text-amber-400 transition-colors">
                  محركات التجارة العالمية
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">
                  إدارة متزامنة للمخزون، إتمام شراء متعدد العملات، ومعالجة مدفوعات مرنة بدون أي انقطاع.
                </p>
              </div>
            </div>

            {/* CARD 7: Creative Canvas */}
            <div className="bento-card group relative rounded-3xl bg-gradient-to-br from-[#ff5500]/20 via-zinc-950/90 to-amber-950/30 border border-white/[0.08] hover:border-amber-500/40 p-6 sm:p-7 flex flex-col justify-between overflow-hidden backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] col-span-1 lg:col-start-3 lg:row-start-3">
              <div className="pointer-events-none absolute inset-0 bg-radial from-[#ff5500]/15 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-700" />

              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] font-mono text-amber-300 uppercase tracking-wider">المساحة الإبداعية</span>
                <span className="text-[10px] font-mono text-zinc-300 bg-black/40 border border-white/10 px-2.5 py-0.5 rounded-full">
                  WebGL 2.0
                </span>
              </div>

              <div className="my-6 z-10 flex items-center justify-center">
                <svg className="w-full h-14 overflow-visible opacity-80 group-hover:opacity-100 transition-opacity" viewBox="0 0 200 50" fill="none">
                  <path d="M0 25 C 40 5, 60 45, 100 25 C 140 5, 160 45, 200 25" stroke="#ff5500" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M0 32 C 40 12, 60 52, 100 32 C 140 12, 160 52, 200 32" stroke="rgba(212, 160, 23, 0.4)" strokeWidth="1.5" strokeDasharray="4 4" />
                </svg>
              </div>

              <div className="z-10">
                <h3 className="text-lg font-normal text-white tracking-tight group-hover:text-amber-400 transition-colors">
                  رسوميات وتسريع عتادي فائق
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">
                  مظللات WebGL، معالجة فورية للصور، ووسائط تفاعلية غامرة مسرعة بالعتاد الرسومي.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            CHAPTER 03 — 3D MODEL CREATOR
            ═══════════════════════════════════════════════════════════════════ */}
        <section
          id="model-creator"
          ref={creatorReveal.ref}
          aria-label="أداة تصميم النماذج ثلاثية الأبعاد"
          className={`reveal-section ${creatorReveal.revealed ? 'revealed' : ''} relative z-20 w-full -mt-10`}
          style={{ backgroundColor: '#E8E8EA' }}
        >
          {/* Rounded overlay cap */}
          <div
            className="absolute inset-x-0 top-0 h-12 pointer-events-none"
            style={{
              backgroundColor: '#E8E8EA',
              borderRadius: '40px 40px 0 0',
              transform: 'translateY(-100%)',
            }}
          />

          <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-28 sm:pb-36">

            {/* Narrative Header */}
            <div className="mb-16 sm:mb-20 max-w-2xl">
              <span className="section-chapter-number" style={{ color: 'rgba(0,0,0,0.25)' }}>الفصل الثالث</span>
              <h2 className="section-narrative" style={{ color: '#18181b' }}>
                من <span className="accent">وصف نصي</span> إلى نموذج ثلاثي الأبعاد
              </h2>
              <p className="mt-4 text-sm sm:text-base font-light leading-relaxed" style={{ color: '#52525b' }}>
                صف ما تتخيله بدقة — يتولى المحرك بناء الهيكل الشبكي، وتوليد الخامات والتصدير في ثوانٍ معدودة.
              </p>
            </div>

            {/* Bento Grid */}
            <div className="model-creator-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 auto-rows-[minmax(220px,auto)]">

              {/* 3D VIEWER */}
              <div className="col-span-1 sm:col-span-2 lg:col-start-2 lg:col-span-2 lg:row-start-1 lg:row-span-2 order-first lg:order-none">
                <ModelViewer />
              </div>

              {/* CARD 1: Prompt Input */}
              <div
                className="light-card group relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between overflow-hidden col-span-1 lg:col-start-1 lg:row-start-1 lg:row-span-2"
                style={{
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: '#71717a' }}>
                    الوصف النصي (Prompt)
                  </span>
                  <span
                    className="text-[10px] font-mono px-2.5 py-0.5 rounded-full"
                    style={{
                      color: '#ff5500',
                      backgroundColor: 'rgba(255,85,0,0.08)',
                      border: '1px solid rgba(255,85,0,0.18)',
                    }}
                  >
                    محرك AI الإصدار 3
                  </span>
                </div>

                <div className="my-6 flex-1 flex flex-col">
                  <div
                    className="flex-1 rounded-2xl p-4 font-mono text-sm leading-relaxed"
                    style={{
                      backgroundColor: '#f4f4f5',
                      border: '1px solid rgba(0,0,0,0.06)',
                      color: '#3f3f46',
                    }}
                  >
                    <span style={{ color: '#ff5500' }}>&gt;</span>{' '}
                    بيت شجري أيزومتري مصغر بسقف مغطى بالطحالب، ونوافذ تشع بضوء دافئ، محاط بيرقات مضيئة — نموذج ثلاثي الأبعاد جاهز للألعاب…
                    <span
                      className="inline-block w-2 h-4 mr-1 align-middle animate-pulse rounded-sm"
                      style={{ backgroundColor: '#ff5500' }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {['اقتراح عشوائي', 'تعزيز التفاصيل', 'تبسيط النموذج'].map((label) => (
                      <button
                        key={label}
                        className="text-[11px] font-mono px-3 py-1 rounded-full transition-colors duration-200"
                        style={{
                          color: '#52525b',
                          backgroundColor: '#f4f4f5',
                          border: '1px solid rgba(0,0,0,0.08)',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="w-full py-3 rounded-xl text-sm font-medium tracking-wide transition-opacity duration-200 hover:opacity-90"
                  style={{ backgroundColor: '#ff5500', color: '#ffffff' }}
                >
                  توليد النموذج ثلاثي الأبعاد
                </button>
              </div>

              {/* CARD 2: Style Presets */}
              <div
                className="light-card group relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between overflow-hidden col-span-1 lg:col-start-4 lg:row-start-1"
                style={{
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: '#71717a' }}>
                    النمط الفني
                  </span>
                </div>

                <div className="my-5 grid grid-cols-3 gap-2">
                  {[
                    {
                      name: 'واقعي', active: false, icon: (
                        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20" />
                        </svg>
                      )
                    },
                    {
                      name: 'فني مميز', active: true, icon: (
                        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      )
                    },
                    {
                      name: 'بولي منخفض', active: false, icon: (
                        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2L2 19h20L12 2z" />
                          <path d="M12 2l5 10H7l5-10z" />
                        </svg>
                      )
                    },
                  ].map((style) => (
                    <div
                      key={style.name}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl text-center transition-colors duration-200"
                      style={{
                        backgroundColor: style.active ? 'rgba(255,85,0,0.07)' : '#f4f4f5',
                        border: style.active ? '1.5px solid rgba(255,85,0,0.35)' : '1px solid transparent',
                        color: style.active ? '#ff5500' : '#71717a',
                      }}
                    >
                      {style.icon}
                      <span className="text-[10px] font-mono">{style.name}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-base font-normal tracking-tight" style={{ color: '#18181b' }}>
                    التوجيه الفني
                  </h3>
                  <p className="mt-1 text-xs font-light leading-relaxed" style={{ color: '#71717a' }}>
                    حدد الطابع البصري لتوجيه كثافة الهيكل الشبكي وأسلوب التظليل.
                  </p>
                </div>
              </div>

              {/* CARD 3: Materials */}
              <div
                className="light-card group relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between overflow-hidden col-span-1 lg:col-start-4 lg:row-start-2"
                style={{
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: '#71717a' }}>
                    الخامة السطحية
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ color: '#52525b', backgroundColor: '#f4f4f5' }}>
                    خامات واقعية PBR
                  </span>
                </div>

                <div className="my-5 flex flex-col gap-2.5">
                  {[
                    { name: 'طين مطفي (Matte Clay)', color: '#d4c8b8', active: false },
                    { name: 'معدن مصقول (Brushed Metal)', color: '#9ca3af', active: true },
                    { name: 'زجاج مثلج (Frosted Glass)', color: '#bae6fd', active: false },
                    { name: 'حبيبات الخشب (Wood Grain)', color: '#a16207', active: false },
                  ].map((mat) => (
                    <div
                      key={mat.name}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors duration-200"
                      style={{
                        backgroundColor: mat.active ? 'rgba(255,85,0,0.06)' : 'transparent',
                        border: mat.active ? '1px solid rgba(255,85,0,0.25)' : '1px solid rgba(0,0,0,0.06)',
                      }}
                    >
                      <span
                        className="w-5 h-5 rounded-full shrink-0 border"
                        style={{
                          backgroundColor: mat.color,
                          borderColor: mat.active ? '#ff5500' : 'rgba(0,0,0,0.08)',
                        }}
                      />
                      <span className="text-xs font-mono" style={{ color: mat.active ? '#ff5500' : '#52525b' }}>
                        {mat.name}
                      </span>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-base font-normal tracking-tight" style={{ color: '#18181b' }}>
                    المظهر واللمسة النهائية
                  </h3>
                  <p className="mt-1 text-xs font-light leading-relaxed" style={{ color: '#71717a' }}>
                    تطبيق خامات تحاكي الواقع الفيزيائي مع خرائط UV مولدة تلقائياً.
                  </p>
                </div>
              </div>

            </div>

            {/* Bottom Row: Export + Pipeline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 mt-4 sm:mt-5 lg:mt-6">

              {/* CARD 4: Output Formats */}
              <div
                className="light-card group relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between overflow-hidden"
                style={{
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: '#71717a' }}>
                    تصدير النماذج
                  </span>
                </div>

                <div className="my-5 flex flex-col gap-3">
                  {[
                    { ext: 'GLB', desc: 'تنسيق glTF ثنائي — جاهز للويب والواقع المعزز', active: true },
                    { ext: 'OBJ', desc: 'تنسيق Wavefront — توافق شامل مع كافة البرامج', active: false },
                    { ext: 'PNG', desc: 'رندرات استوديو 4K (4 زوايا تصوير)', active: false },
                  ].map((fmt) => (
                    <div
                      key={fmt.ext}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200"
                      style={{
                        backgroundColor: fmt.active ? 'rgba(255,85,0,0.06)' : '#f4f4f5',
                        border: fmt.active ? '1.5px solid rgba(255,85,0,0.30)' : '1px solid transparent',
                      }}
                    >
                      <span
                        className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: fmt.active ? '#ff5500' : '#e4e4e7',
                          color: fmt.active ? '#ffffff' : '#3f3f46',
                        }}
                      >
                        {fmt.ext}
                      </span>
                      <span className="text-[11px] font-light" style={{ color: '#52525b' }}>
                        {fmt.desc}
                      </span>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-base font-normal tracking-tight" style={{ color: '#18181b' }}>
                    تصدير فوري بنقرة واحدة
                  </h3>
                  <p className="mt-1 text-xs font-light leading-relaxed" style={{ color: '#71717a' }}>
                    تحميل أصول جاهزة للإنتاج والاستخدام المباشر — بدون الحاجة لأي معالجة إضافية.
                  </p>
                </div>
              </div>

              {/* CARD 5: Pipeline */}
              <div
                className="light-card group relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between overflow-hidden"
                style={{
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: '#71717a' }}>
                    مراحل المعالجة
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-0.5 rounded-full"
                    style={{
                      color: '#16a34a',
                      backgroundColor: 'rgba(22,163,74,0.08)',
                      border: '1px solid rgba(22,163,74,0.20)',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#16a34a' }} />
                    جاهز للعمل
                  </span>
                </div>

                <div className="my-5 flex flex-col gap-3">
                  {[
                    { step: '01', label: 'تحليل الوصف النصي', status: 'done' },
                    { step: '02', label: 'توليد الهيكل الشبكي (Mesh)', status: 'active' },
                    { step: '03', label: 'تطبيق الخامات والإضاءة', status: 'pending' },
                    { step: '04', label: 'تصدير الأصول ثلاثية الأبعاد', status: 'pending' },
                  ].map((s, i, arr) => (
                    <div key={s.step} className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-mono font-semibold"
                          style={{
                            backgroundColor: s.status === 'active' ? '#ff5500' : s.status === 'done' ? '#f4f4f5' : '#fafafa',
                            color: s.status === 'active' ? '#ffffff' : s.status === 'done' ? '#16a34a' : '#a1a1aa',
                            border: s.status === 'active' ? 'none' : '1px solid rgba(0,0,0,0.06)',
                            boxShadow: s.status === 'active' ? '0 0 12px rgba(255,85,0,0.3)' : 'none',
                          }}
                        >
                          {s.status === 'done' ? '✓' : s.step}
                        </span>
                        {i < arr.length - 1 && (
                          <span className="w-0.5 h-4 mt-1" style={{ backgroundColor: s.status === 'done' ? '#16a34a' : '#e4e4e7' }} />
                        )}
                      </div>
                      <span
                        className="text-xs font-mono"
                        style={{
                          color: s.status === 'active' ? '#ff5500' : s.status === 'done' ? '#52525b' : '#a1a1aa',
                        }}
                      >
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-base font-normal tracking-tight" style={{ color: '#18181b' }}>
                    خط معالجة متكامل من 4 خطوات
                  </h3>
                  <p className="mt-1 text-xs font-light leading-relaxed" style={{ color: '#71717a' }}>
                    الوصف النصي ← الهيكل الشبكي ← الخامات ← التصدير، كل ذلك خلال أقل من 30 ثانية.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
