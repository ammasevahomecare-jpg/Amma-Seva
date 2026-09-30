import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  formatCommas?: boolean;
  className?: string;
}

export function AnimatedCounter({
  target,
  prefix = "",
  suffix = "",
  duration = 1600,
  formatCommas = true,
  className = "",
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isIntersectingRef = useRef(false);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Started scrolling into view (from above or below)
            isIntersectingRef.current = true;
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
            }

            const startTime = performance.now();
            const startVal = 0;

            const animate = (currentTime: number) => {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              
              // Smooth ease-out cubic curve
              const easeOutProgress = 1 - Math.pow(1 - progress, 3);
              const currentCount = Math.floor(startVal + (target - startVal) * easeOutProgress);
              
              setCount(currentCount);

              if (progress < 1 && isIntersectingRef.current) {
                animationFrameRef.current = requestAnimationFrame(animate);
              } else {
                setCount(target);
              }
            };

            animationFrameRef.current = requestAnimationFrame(animate);
          } else {
            // Reset count when scrolled out of view so it auto-increments again when scrolled back
            isIntersectingRef.current = false;
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
            }
            setCount(0);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [target, duration]);

  const formattedNumber = formatCommas
    ? count.toLocaleString("en-IN")
    : count.toString();

  return (
    <span ref={elementRef} className={`inline-block tabular-nums transition-all ${className}`}>
      {prefix}
      {formattedNumber}
      {suffix}
    </span>
  );
}
