"use client";

import { useEffect, useRef, useState } from "react";

type ChapterTheme = "monochrome" | "warm" | "premium";

type StoryChapter = {
  id: string;
  label: string;
  title: string;
  summary: string;
  theme: ChapterTheme;
  start: number;
  end: number;
};

const TOTAL_FRAMES = 150;
const FIRST_PRELOAD_COUNT = 20;
const MAX_PRELOAD_WORKERS = 6;

const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: "who-i-was",
    label: "Chapter 1",
    title: "Who I was",
    summary:
      "A quiet editorial opening shaped by patience, discipline, and a clear point of view.",
    theme: "monochrome",
    start: 0,
    end: 0.34,
  },
  {
    id: "who-i-became",
    label: "Chapter 2",
    title: "Who I became",
    summary:
      "A warmer, more expressive middle chapter where process turns into personality.",
    theme: "warm",
    start: 0.34,
    end: 0.67,
  },
  {
    id: "what-i-build",
    label: "Chapter 3",
    title: "What I build",
    summary:
      "A premium final chapter focused on craft, clarity, and the work I create today.",
    theme: "premium",
    start: 0.67,
    end: 1,
  },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getFrameSrc = (index: number) =>
  `/output_frames_webp/frame_${String(index).padStart(3, "0")}.webp`;

const getFallbackFrameSrc = (index: number) =>
  `/output_frames/frame_${String(index).padStart(3, "0")}.png`;

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
  const targetFrameRef = useRef(1);
  const currentFrameRef = useRef(1);
  const lastDrawnFrameRef = useRef(-1);
  const mountedRef = useRef(false);

  const activeChapter =
    STORY_CHAPTERS[activeChapterIndex] ?? STORY_CHAPTERS[0];

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

    const preloadFrame = (index: number): Promise<void> =>
      new Promise((resolve) => {
        const existing = imagesRef.current[index];
        if (existing) {
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

    const preloadFrames = async () => {
      const initialFrames = Array.from({ length: FIRST_PRELOAD_COUNT }, (_, index) => index + 1);
      await Promise.all(initialFrames.map((frame) => preloadFrame(frame)));
      setIsReady(true);

      const remainingFrames = Array.from(
        { length: TOTAL_FRAMES - FIRST_PRELOAD_COUNT },
        (_, index) => index + FIRST_PRELOAD_COUNT + 1,
      );

      let workerIndex = 0;
      const workers = Array.from({ length: Math.min(MAX_PRELOAD_WORKERS, remainingFrames.length) }, async () => {
        while (workerIndex < remainingFrames.length) {
          const currentIndex = remainingFrames[workerIndex++];
          await preloadFrame(currentIndex);
        }
      });

      await Promise.all(workers);
    };

    const lerp = (start: number, end: number, amount: number) =>
      start + (end - start) * amount;

    const animationLoop = () => {
      if (!mountedRef.current) return;
      if (document.hidden) {
        window.requestAnimationFrame(animationLoop);
        return;
      }

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

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      renderFrame(Math.round(currentFrameRef.current), true);
      updateScrollProgress();
    };

    handleResize();
    updateScrollProgress();
    void preloadFrames();
    window.requestAnimationFrame(animationLoop);

    const handleScroll = () => updateScrollProgress();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    document.addEventListener("visibilitychange", updateScrollProgress);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", updateScrollProgress);
      reducedMotionQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  const chapterProgress =
    (scrollProgress - activeChapter.start) /
    Math.max(activeChapter.end - activeChapter.start, 0.0001);

  return (
    <main className="story-app" data-theme={activeChapter.theme}>
      <div className="top-progress" aria-live="polite">
        <div className="progress-track">
          <span style={{ transform: `scaleX(${scrollProgress})` }} />
        </div>
        <div className="chapter-pill">
          <span className="pillar-dot" />
          {activeChapter.label}
        </div>
      </div>

      <section ref={containerRef} className="hero-shell">
        <div className="hero-stage">
          <canvas ref={canvasRef} className="story-canvas" aria-hidden="true" />
          <div className="story-vignette" />
          <div className="story-noise" />
          <div className="story-grid" />

          <div
            className="hero-copy"
            style={{ opacity: isReady ? 1 : 0.8 }}
            key={activeChapter.id}
          >
            <span className="eyebrow">{activeChapter.label}</span>
            <h1>{activeChapter.title}</h1>
            <div className="divider" />
            <p className="lede">{activeChapter.summary}</p>
          </div>

          <div className="chapter-list" aria-label="Story chapters">
            {STORY_CHAPTERS.map((chapter, chapterIndex) => (
              <div
                key={chapter.id}
                className={
                  chapterIndex === activeChapterIndex ? "chapter-chip active" : "chapter-chip"
                }
              >
                {chapter.label}
              </div>
            ))}
          </div>

          <div
            className="scroll-cue"
            aria-hidden="true"
            style={{ opacity: scrollProgress < 0.05 ? 1 : 0 }}
          >
            <span>Scroll</span>
            <div className="scroll-cue-line">
              <i />
            </div>
          </div>
        </div>
      </section>

      <section className="story-meta">
        <div className="story-meta-card">
          <p className="section-kicker">Narrative</p>
          <h2>Immersion first, interface second.</h2>
          <p>
            The story begins in quiet monochrome, opens into warmth and motion,
            and resolves into a premium, cinematic finish.
          </p>
        </div>
      </section>

      <section className="story-panels">
        {STORY_CHAPTERS.map((chapter, chapterIndex) => (
          <article
            key={chapter.id}
            className={
              chapterIndex === activeChapterIndex ? "story-panel active" : "story-panel"
            }
            data-theme={chapter.theme}
          >
            <span className="panel-index">{chapter.label}</span>
            <h3>{chapter.title}</h3>
            <p>{chapter.summary}</p>
          </article>
        ))}
      </section>

      <section className="story-cta-wrap">
        <div className="story-cta-card">
          <p className="section-kicker">Next</p>
          <h2>Build a story people feel, not just read.</h2>
          <p>
            The frame sequence remains the main visual event. The interface is kept
            restrained so the pacing, motion, and typography carry the narrative.
          </p>
          <div className="story-actions">
            <a href="https://github.com/kararha" target="_blank" rel="noreferrer">
              Portfolio
            </a>
            <a href="mailto:hello@kararha.dev">Contact</a>
          </div>
        </div>
      </section>

      <div className="chapter-progress" aria-hidden="true">
        <span
          className="chapter-progress-fill"
          style={{
            transform: `scaleX(${chapterProgress})`,
            opacity: chapterProgress > 0 ? 1 : 0,
          }}
        />
      </div>
    </main>
  );
}
