"use client";

import { useRef, useState } from "react";
import styles from "./farm-video-swiper.module.css";

const videos = [1, 2, 3, 4, 5] as const;

export default function FarmVideoSwiper() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  function moveTo(index: number) {
    const next = Math.min(Math.max(index, 0), videos.length - 1);
    const viewport = viewportRef.current;
    const slide = viewport?.children.item(next) as HTMLElement | null;
    slide?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    setCurrent(next);
  }

  function updateCurrent() {
    const viewport = viewportRef.current;
    if (!viewport || viewport.clientWidth === 0) return;
    setCurrent(Math.round(viewport.scrollLeft / viewport.clientWidth));
  }

  return (
    <div className={styles.swiper} aria-roledescription="carousel" aria-label="산내 농장 현장 영상">
      <button className={styles.arrow} type="button" onClick={() => moveTo(current - 1)} disabled={current === 0} aria-label="이전 농장 영상">←</button>
      <div className={styles.viewport} ref={viewportRef} onScroll={updateCurrent}>
        {videos.map((number, index) => (
          <article className={styles.slide} key={number} aria-label={`${videos.length}개 중 ${index + 1}번째 영상`}>
            <video controls playsInline preload={index === 0 ? "metadata" : "none"} aria-label={`경주 산내 고구마 재배 현장 영상 ${number}`}>
              <source src={`/videos/sannae-field-0${number}.mp4`} type="video/mp4" />
              이 브라우저에서는 영상을 재생할 수 없습니다.
            </video>
            <div className={styles.caption}><span>산내에서 전합니다</span><strong>농장 현장 {number}</strong></div>
          </article>
        ))}
      </div>
      <button className={styles.arrow} type="button" onClick={() => moveTo(current + 1)} disabled={current === videos.length - 1} aria-label="다음 농장 영상">→</button>
      <div className={styles.pagination} aria-live="polite">
        <strong>{current + 1}</strong><span>/ {videos.length}</span>
      </div>
    </div>
  );
}
