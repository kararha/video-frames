"use client";

import { useEffect, useRef, useState } from "react";

const TOTAL_FRAMES = 150;
const FIRST_PRELOAD_COUNT = 20;

type ChapterTheme = "monochrome" | "warm" | "premium";

type StoryChapter = {
  id: string;
  label: string;
  badge: string;
  headline: string;
  summary: string;
  detail: string;
  theme: ChapterTheme;
  start: number;
  end: number;
};

const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: "who-i-was",
    label: "Chapter 01",
    badge: "Who I was",
    headline: "A quiet beginning with a sharp point of view.",
    summary:
      "Editorial, minimal, and rooted in craft. The story starts in monochrome with a single yellow accent and a sense of intention.",
    detail:
      "I began with curiosity, patience, and the instinct to keep refining the work until it felt honest and precise.",
    theme: "monochrome",
    start: 0,
    end: 0.34,
  },
  {
    id: "who-i-became",
    label: "Chapter 02",
    badge: "Who I became",
    headline: "Soft motion, playful energy, and a stronger creative voice.",
    summary:
      "This is the chapter where process becomes personality. Rounded typography, green warmth, and gentle spring motion reflect a more expressive identity.",
    detail:
      "I learned to turn experimentation into systems, and expertise into product experiences that feel human and alive.",
    theme: "warm",
    start: 0.34,
    end: 0.67,
  },
  {
    id: "what-i-build",
    label: "Chapter 03",
    badge: "What I build",
    headline: "Premium products that feel cinematic and intentional.",
    summary:
      "The final chapter brings marble neutrals, gold accents, and a refined visual language for the work I create today.",
    detail:
      "I build digital experiences that balance clarity, emotion, and performance to help ideas feel as strong as they look.",
    theme: "premium",
    start: 0.67,
    end: 1,
  },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const imagesRef = useRef<Array<HTMLImageElement | null>>(
    Array(TOTAL_FRAMES + 1).fill(null),
  );
  const loadedFramesRef = useRef<Set<number>>(new Set());
  const currentFrameRef = useRef(1);
  const targetFrameRef = useRef(1);
  const lastFrameRef = useRef(-1);
  const mountedRef = useRef(false);

  const activeChapter = STORY_CHAPTERS[activeChapterIndex] ?? STORY_CHAPTERS[0];
  const currentTheme = activeChapter.theme;

  const getFrameSrc = (index: number) => {
    const pad = String(index).padStart(3, "0");
    return `/output_frames_webp/frame_${pad}.webp`;
  };

  const getFallbackFrameSrc = (index: number) => {
    const pad = String(index).padStart(3, "0");
    return `/output_frames/frame_${pad}.png`;
  };

  useEffect(() => {
    mountedRef.current = true;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReducedMotion = reducedMotionQuery.matches;

    const handleMotionChange = (event: MediaQueryListEvent) => {
      prefersReducedMotion = event.matches;
    };

    reducedMotionQuery.addEventListener("change", handleMotionChange);

    const drawImageCover = (img: HTMLImageElement) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const imgWidth = img.naturalWidth || 1280;
      const imgHeight = img.naturalHeight || 720;
      const imgRatio = imgWidth / imgHeight;
      const screenRatio = width / height;

      let drawWidth = width;
      let drawHeight = height;
      let drawX = 0;
      let drawY = 0;

      if (screenRatio > imgRatio) {
        drawHeight = height;
        drawWidth = height * imgRatio;
        drawX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / imgRatio;
        drawY = (height - drawHeight) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    };

    const renderFrame = (frameIndex: number, force = false) => {
      const safeIndex = clamp(frameIndex, 1, TOTAL_FRAMES);
      const loadedFrames = loadedFramesRef.current;
      let chosenFrame = safeIndex;

      if (!loadedFrames.has(chosenFrame)) {
        let nearestDistance = Number.POSITIVE_INFINITY;
        for (const loadedIndex of loadedFrames) {
          const distance = Math.abs(loadedIndex - chosenFrame);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            chosenFrame = loadedIndex;
          }
        }
      }

      if (!force && chosenFrame === lastFrameRef.current) return;

      const img = imagesRef.current[chosenFrame];
      if (img && img.complete && img.naturalWidth > 0) {
        drawImageCover(img);
        lastFrameRef.current = chosenFrame;
      }
    };

    const updateScrollProgress = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      const maxScroll = Math.max(containerHeight - viewportHeight, 1);
      const scrolled = -rect.top;
      const progress = clamp(scrolled / maxScroll, 0, 1);

      targetFrameRef.current = 1 + progress * (TOTAL_FRAMES - 1);
      setScrollProgress(progress);

      let nextIndex = 0;
      for (let index = 0; index < STORY_CHAPTERS.length; index += 1) {
        const chapter = STORY_CHAPTERS[index];
        if (progress >= chapter.start && progress <= chapter.end) {
          nextIndex = index;
          break;
        }
      }

      setActiveChapterIndex(nextIndex);
    };

    const preloadImage = (index: number): Promise<void> =>
      new Promise((resolve) => {
        if (imagesRef.current[index]) {
          resolve();
          return;
        }

        const img = new Image();
        img.decoding = "async";
        img.src = getFrameSrc(index);

        img.onload = () => {
          if (!mountedRef.current) return;
          imagesRef.current[index] = img;
          loadedFramesRef.current.add(index);
          resolve();
        };

        img.onerror = () => {
          const fallback = new Image();
          fallback.decoding = "async";
          fallback.src = getFallbackFrameSrc(index);

          fallback.onload = () => {
            if (!mountedRef.current) return;
            imagesRef.current[index] = fallback;
            loadedFramesRef.current.add(index);
            resolve();
          };

          fallback.onerror = () => resolve();
        };
      });

    const preloadInitialFrames = async () => {
      for (let index = 1; index <= FIRST_PRELOAD_COUNT; index += 1) {
        await preloadImage(index);
      }
      setIsReady(true);

      for (let index = FIRST_PRELOAD_COUNT + 1; index <= TOTAL_FRAMES; index += 1) {
        void preloadImage(index);
      }
    };

    const lerp = (start: number, end: number, amount: number) =>
      start + (end - start) * amount;

    const animationLoop = () => {
      if (!mountedRef.current) return;

      const target = targetFrameRef.current;
      const current = currentFrameRef.current;
      const difference = target - current;

      if (prefersReducedMotion) {
        currentFrameRef.current = target;
        renderFrame(Math.round(target));
      } else {
        if (Math.abs(difference) > 0.001) {
          currentFrameRef.current = lerp(current, target, 0.12);
          renderFrame(Math.round(currentFrameRef.current));
        } else if (current !== target) {
          currentFrameRef.current = target;
          renderFrame(Math.round(target));
        }
      }

      window.requestAnimationFrame(animationLoop);
    };

    const resizeCanvas = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      renderFrame(Math.round(currentFrameRef.current), true);
    };

    resizeCanvas();
    updateScrollProgress();
    void preloadInitialFrames();
    window.requestAnimationFrame(animationLoop);

    const handleScroll = () => updateScrollProgress();
    const handleResize = () => {
      resizeCanvas();
      updateScrollProgress();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      mountedRef.current = false;
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      reducedMotionQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  return (
    <main className="story-app" data-theme={currentTheme}>
      <div className="top-progress" aria-live="polite">
        <div className="progress-track">
          <span style={{ transform: `scaleX(${scrollProgress})` }} />
        </div>
        <div className="chapter-pill">
          <span className="pillar-dot" />
          {activeChapter.badge}
        </div>
      </div>

      <section ref={containerRef} className="hero-shell">
        <div className="hero-stage">
          <canvas ref={canvasRef} className="story-canvas" aria-hidden="true" />
          <div className="story-vignette" />
          <div className="story-noise" />

          <div className="hero-copy" style={{ opacity: isReady ? 1 : 0.75 }}>
            <p className="eyebrow">{activeChapter.label}</p>
            <h1>{activeChapter.headline}</h1>
            <div className="divider" />
            <p className="lede">{activeChapter.summary}</p>
          </div>

          <div className="chapter-list" aria-label="Story chapters">
            {STORY_CHAPTERS.map((chapter, chapterIndex) => (
              <div
                key={chapter.id}
                className={chapterIndex === activeChapterIndex ? "chapter-chip active" : "chapter-chip"}
              >
                <span>{chapter.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="story-brief">
        <div className="brief-card">
          <p className="section-kicker">Story arc</p>
          <h2>From quiet beginnings to a recognizable creative voice.</h2>
          <p>
            This narrative moves through three distinct chapter states: a minimal editorial start,
            a playful growth period, and a premium final chapter that presents what I build today.
          </p>
        </div>
      </section>

      <section className="story-panels">
        {STORY_CHAPTERS.map((chapter, chapterIndex) => (
          <article
            key={chapter.id}
            className={chapterIndex === activeChapterIndex ? "story-panel active" : "story-panel"}
            data-theme={chapter.theme}
          >
            <span className="panel-index">{chapter.label}</span>
            <h3>{chapter.badge}</h3>
            <p>{chapter.detail}</p>
          </article>
        ))}
      </section>

      <section className="portfolio-showcase">
        <div className="showcase-intro">
          <p className="section-kicker">Creative direction</p>
          <h2>One story, three moods, one clear visual language.</h2>
        </div>

        <div className="showcase-grid">
          <div className="showcase-card mono">
            <span className="card-label">Editorial</span>
            <h3>Minimal pacing with a strong point of view.</h3>
            <p>
              The first chapter stays disciplined, text-led, and focused on quiet confidence.
            </p>
          </div>

          <div className="showcase-card warm">
            <span className="card-label">Playful</span>
            <h3>Warm color and softer transitions.</h3>
            <p>
              The middle chapter grows into motion, humor, and personality without losing clarity.
            </p>
          </div>

          <div className="showcase-card premium">
            <span className="card-label">Premium</span>
            <h3>Marble, gold, and a final call to action.</h3>
            <p>
              The closing chapter pulls everything together with a confident, cinematic finish.
            </p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-card">
          <p className="section-kicker">Now</p>
          <h2>Design with intent, craft with rhythm, and build with clarity.</h2>
          <p>
            I create thoughtful digital experiences that feel premium from the first frame to the final interaction.
          </p>
          <div className="cta-actions">
            <a href="https://github.com/kararha" target="_blank" rel="noreferrer">
              Portfolio
            </a>
            <a href="mailto:hello@kararha.dev">Contact</a>
          </div>
        </div>
      </section>
    </main>
  );
}
