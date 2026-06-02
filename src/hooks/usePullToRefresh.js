import { useEffect, useRef, useState } from "react";

const THRESHOLD = 72;

export function usePullToRefresh(onRefresh, disabled = false) {
  const [dist, setDist] = useState(0);
  const startY = useRef(null);
  const triggered = useRef(false);

  useEffect(() => {
    const onTouchStart = (e) => {
      if (window.scrollY > 0 || disabled) return;
      startY.current = e.touches[0].clientY;
      triggered.current = false;
    };

    const onTouchMove = (e) => {
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0 || window.scrollY > 0) { setDist(0); return; }
      setDist(Math.min(dy, THRESHOLD * 1.5));
      triggered.current = dy >= THRESHOLD;
    };

    const onTouchEnd = () => {
      if (triggered.current && !disabled) onRefresh();
      startY.current = null;
      triggered.current = false;
      setDist(0);
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh, disabled]);

  return { dist, ready: dist >= THRESHOLD };
}
