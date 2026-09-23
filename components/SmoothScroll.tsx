"use client";

import { useEffect } from "react";
import Lenis from "lenis";

// Inertial wheel scrolling for the whole page, so scroll-driven animation (the hero's
// sword cut) glides instead of stepping per wheel notch. Touch keeps native scrolling;
// Lenis turns itself off under prefers-reduced-motion.
const SmoothScroll = () => {
  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true, anchors: true });
    return () => lenis.destroy();
  }, []);

  return null;
};

export default SmoothScroll;
