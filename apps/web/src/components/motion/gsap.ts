'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger, Flip);

gsap.defaults({ ease: 'power3.out', duration: 0.9 });

/** Condições do gsap.matchMedia: animações só para quem não pediu movimento reduzido. */
export const MOTION = {
  ok: '(prefers-reduced-motion: no-preference)',
  reduce: '(prefers-reduced-motion: reduce)',
} as const;

export { Flip, gsap, ScrollTrigger, useGSAP };
