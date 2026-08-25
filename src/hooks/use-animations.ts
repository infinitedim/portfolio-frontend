/**
 * @fileoverview Custom animation hooks and web animation utilities for terminal UI effects.
 * @module hooks/use-animations
 */

import { useRef, useCallback, useEffect, useState, useMemo } from "react";
import { useAccessibility } from "@/components/organisms/accessibility/accessibility-provider";
import { useMountRef, generateId, withErrorHandling } from "./hooks-utils";

/**
 * Configuration options for web animations and CSS keyframes.
 *
 * @interface AnimationConfig
 * @property {number} duration - Duration of the animation in milliseconds.
 * @property {string} easing - CSS easing function string (e.g. "ease-in-out", "cubic-bezier(...)").
 * @property {number} [delay] - Optional start delay in milliseconds.
 * @property {"none" | "forwards" | "backwards" | "both"} [fillMode] - CSS animation fill mode.
 */
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  fillMode?: "none" | "forwards" | "backwards" | "both";
}

/**
 * Configuration options for typewriter text rendering animations.
 *
 * @interface TypewriterConfig
 * @property {number} speed - Typing delay between characters in milliseconds.
 * @property {boolean} cursor - Whether to render a flashing typing cursor.
 * @property {string} cursorChar - Character glyph to display as cursor (e.g. "▋", "_", "|").
 * @property {number} [deleteSpeed] - Delay between deleted characters during backspace animations.
 */
export interface TypewriterConfig {
  speed: number;
  cursor: boolean;
  cursorChar: string;
  deleteSpeed?: number;
}

/**
 * Default configuration parameters applied to generic animations.
 */
const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  duration: 300,
  easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  delay: 0,
  fillMode: "forwards",
};

/**
 * Default configuration parameters applied to typewriter animations.
 */
const DEFAULT_TYPEWRITER_CONFIG: TypewriterConfig = {
  speed: 50,
  cursor: true,
  cursorChar: "▋",
  deleteSpeed: 30,
};

/**
 * React hook providing core Web Animations API effects, glitch effects, matrix rain, and motion accessibility support.
 *
 * @returns {object} Animation generator utilities and control methods.
 */
export function useAnimations() {
  const { isReducedMotion } = useAccessibility();
  const isMountedRef = useMountRef();
  const animationRefs = useRef<Map<string, Animation>>(new Map());

  /**
   * Cancels and unregisters an active Web Animation instance by ID.
   *
   * @param {string} id - Unique identifier of the animation to cancel.
   */
  const cleanupAnimation = useCallback((id: string) => {
    const animation = animationRefs.current.get(id);
    if (animation) {
      try {
        animation.cancel();
      } catch (error) {
        console.warn("Error canceling animation:", error);
      }
      animationRefs.current.delete(id);
    }
  }, []);

  useEffect(() => {
    if (isReducedMotion) {
      animationRefs.current.forEach((animation, id) => {
        cleanupAnimation(id);
      });
    }
  }, [isReducedMotion, cleanupAnimation]);

  useEffect(() => {
    const animations = animationRefs.current;
    return () => {
      animations.forEach((animation) => {
        try {
          animation.cancel();
        } catch (error) {
          console.warn("Error canceling animation on unmount:", error);
        }
      });
      animations.clear();
    };
  }, []);

  /**
   * Creates a progressive typewriter typing effect on a DOM element.
   *
   * @param {HTMLElement} element - Target HTML element whose textContent will be animated.
   * @param {string} text - Full text string to type out.
   * @param {Partial<TypewriterConfig>} [config={}] - Optional typewriter speed and cursor settings.
   * @returns {Promise<void>} Resolves when the typewriter effect completes or unmounts.
   */
  const createTypewriterEffect = useCallback(
    async (
      element: HTMLElement,
      text: string,
      config: Partial<TypewriterConfig> = {},
    ): Promise<void> => {
      if (isReducedMotion) {
        element.textContent = text;
        return;
      }

      const fullConfig = { ...DEFAULT_TYPEWRITER_CONFIG, ...config };
      element.textContent = "";

      if (fullConfig.cursor) {
        element.classList.add("typing-cursor");
      }

      return new Promise((resolve) => {
        let i = 0;
        let _timerId: NodeJS.Timeout;

        /**
         * Recursively types each character up to the total text length.
         */
        const typeNextChar = () => {
          if (!isMountedRef.current) {
            if (fullConfig.cursor) {
              element.classList.remove("typing-cursor");
            }
            resolve();
            return;
          }

          if (i < text.length) {
            element.textContent = text.slice(0, i + 1);
            i++;
            _timerId = setTimeout(typeNextChar, fullConfig.speed);
          } else {
            if (fullConfig.cursor) {
              element.classList.remove("typing-cursor");
            }
            resolve();
          }
        };

        _timerId = setTimeout(typeNextChar, fullConfig.speed);
      });
    },
    [isReducedMotion, isMountedRef],
  );

  /**
   * Triggers a momentary RGB-split and displacement glitch animation on an element.
   *
   * @param {HTMLElement} element - Target HTML element to apply glitch keyframes.
   * @param {number} [duration=200] - Duration of glitch animation in milliseconds.
   * @returns {Animation | null} Active Animation instance or null if reduced motion is enabled.
   */
  const createGlitchEffect = useCallback(
    (element: HTMLElement, duration: number = 200): Animation | null => {
      if (isReducedMotion || !isMountedRef.current) return null;

      return withErrorHandling(() => {
        const keyframes = [
          { transform: "translate(0)", filter: "none", offset: 0 },
          {
            transform: "translate(-2px, 2px)",
            filter: "hue-rotate(90deg) saturate(1.5)",
            offset: 0.2,
          },
          {
            transform: "translate(-1px, -1px)",
            filter: "hue-rotate(180deg) saturate(2)",
            offset: 0.4,
          },
          {
            transform: "translate(1px, 1px)",
            filter: "hue-rotate(270deg) saturate(1.5)",
            offset: 0.6,
          },
          {
            transform: "translate(0.5px, -0.5px)",
            filter: "hue-rotate(45deg) saturate(1.2)",
            offset: 0.8,
          },
          { transform: "translate(0)", filter: "none", offset: 1 },
        ];

        const animation = element.animate(keyframes, {
          duration,
          easing: "steps(4, end)",
          iterations: 1,
        });

        const id = generateId("glitch");
        animationRefs.current.set(id, animation);

        animation.addEventListener("finish", () => {
          if (isMountedRef.current) {
            cleanupAnimation(id);
          }
        });

        return animation;
      }, null)();
    },
    [isReducedMotion, isMountedRef, cleanupAnimation],
  );

  /**
   * Spawns falling Matrix-style digital rain character streams inside a container element.
   *
   * @param {HTMLElement} container - DOM container element that will host the matrix drops.
   * @param {object} [options={}] - Configuration options for character set, count, speed, and color.
   * @param {string} [options.characters] - Custom character glyph pool.
   * @param {number} [options.drops] - Number of concurrent falling rain columns.
   * @param {number} [options.speed] - Character alternation frequency in milliseconds.
   * @param {string} [options.color] - CSS text color for matrix rain drops.
   * @returns {() => void} Cleanup function that removes drops and stops intervals.
   */
  const createMatrixRain = useCallback(
    (
      container: HTMLElement,
      options: {
        characters?: string;
        drops?: number;
        speed?: number;
        color?: string;
      } = {},
    ): (() => void) => {
      if (isReducedMotion) return () => {};

      const {
        characters = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789",
        drops = 20,
        speed = 100,
        color = "#00ff00",
      } = options;

      const dropElements: HTMLElement[] = [];
      const dropIntervals: NodeJS.Timeout[] = [];

      for (let i = 0; i < drops; i++) {
        const drop = document.createElement("div");
        drop.className = "matrix-drop";
        drop.style.cssText = `
          position: absolute;
          left: ${Math.random() * 100}%;
          top: -20px;
          color: ${color};
          font-family: monospace;
          font-size: 14px;
          animation: matrixFall ${2 + Math.random() * 3}s linear infinite;
          animation-delay: ${Math.random() * 2}s;
          opacity: ${0.7 + Math.random() * 0.3};
          pointer-events: none;
          z-index: -1;
        `;

        drop.textContent =
          characters[Math.floor(Math.random() * characters.length)];
        container.appendChild(drop);
        dropElements.push(drop);

        const changeChar = setInterval(
          () => {
            drop.textContent =
              characters[Math.floor(Math.random() * characters.length)];
          },
          speed + Math.random() * 200,
        );

        dropIntervals.push(changeChar);

        drop.addEventListener("animationiteration", () => {
          drop.style.left = Math.random() * 100 + "%";
        });
      }

      return () => {
        dropIntervals.forEach((interval) => {
          clearInterval(interval);
        });

        dropElements.forEach((drop) => {
          if (drop.parentNode) {
            drop.parentNode.removeChild(drop);
          }
        });
      };
    },
    [isReducedMotion],
  );

  /**
   * Creates an infinite gentle pulse scale animation on an element.
   *
   * @param {HTMLElement} element - Target HTML element.
   * @param {Partial<AnimationConfig>} [config={}] - Optional animation configuration overrides.
   * @returns {Animation | null} Active Animation instance or null if reduced motion is enabled.
   */
  const createPulseAnimation = useCallback(
    (
      element: HTMLElement,
      config: Partial<AnimationConfig> = {},
    ): Animation | null => {
      if (isReducedMotion) return null;

      const fullConfig = { ...DEFAULT_ANIMATION_CONFIG, ...config };
      const keyframes = [
        { transform: "scale(1)", opacity: 1 },
        { transform: "scale(1.05)", opacity: 0.8 },
        { transform: "scale(1)", opacity: 1 },
      ];

      const animation = element.animate(keyframes, {
        duration: fullConfig.duration,
        easing: fullConfig.easing,
        iterations: Infinity,
      });

      const id = `pulse-${Date.now()}`;
      animationRefs.current.set(id, animation);

      return animation;
    },
    [isReducedMotion],
  );

  /**
   * Animates an element sliding into position from a specified direction.
   *
   * @param {HTMLElement} element - Target HTML element to slide in.
   * @param {"left" | "right" | "up" | "down"} [direction="up"] - Direction from which the element slides into place.
   * @param {Partial<AnimationConfig>} [config={}] - Optional duration, easing, delay, and fillMode overrides.
   * @returns {Animation | null} Active Animation instance or null if reduced motion is enabled.
   */
  const createSlideIn = useCallback(
    (
      element: HTMLElement,
      direction: "left" | "right" | "up" | "down" = "up",
      config: Partial<AnimationConfig> = {},
    ): Animation | null => {
      if (isReducedMotion) {
        element.style.opacity = "1";
        element.style.transform = "none";
        return null;
      }

      const fullConfig = { ...DEFAULT_ANIMATION_CONFIG, ...config };
      const transforms = {
        left: ["translateX(-100%)", "translateX(0)"],
        right: ["translateX(100%)", "translateX(0)"],
        up: ["translateY(50px)", "translateY(0)"],
        down: ["translateY(-50px)", "translateY(0)"],
      };

      const keyframes = [
        {
          transform: transforms[direction][0],
          opacity: 0,
          offset: 0,
        },
        {
          transform: transforms[direction][1],
          opacity: 1,
          offset: 1,
        },
      ];

      const animation = element.animate(keyframes, {
        duration: fullConfig.duration,
        easing: fullConfig.easing,
        delay: fullConfig.delay,
        fill: fullConfig.fillMode,
      });

      const id = `slide-${direction}-${Date.now()}`;
      animationRefs.current.set(id, animation);
      animation.addEventListener("finish", () => {
        animationRefs.current.delete(id);
      });

      return animation;
    },
    [isReducedMotion],
  );

  /**
   * Creates an elastic bounce animation on an element.
   *
   * @param {HTMLElement} element - Target HTML element to bounce.
   * @param {Partial<AnimationConfig>} [config={}] - Optional animation configuration overrides.
   * @returns {Animation | null} Active Animation instance or null if reduced motion is enabled.
   */
  const createBounceAnimation = useCallback(
    (
      element: HTMLElement,
      config: Partial<AnimationConfig> = {},
    ): Animation | null => {
      if (isReducedMotion) return null;

      const fullConfig = { ...DEFAULT_ANIMATION_CONFIG, ...config };
      const keyframes = [
        { transform: "scale(1)", offset: 0 },
        { transform: "scale(1.1)", offset: 0.5 },
        { transform: "scale(1)", offset: 1 },
      ];

      const animation = element.animate(keyframes, {
        duration: fullConfig.duration,
        easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        delay: fullConfig.delay,
      });

      const id = `bounce-${Date.now()}`;
      animationRefs.current.set(id, animation);
      animation.addEventListener("finish", () => {
        animationRefs.current.delete(id);
      });

      return animation;
    },
    [isReducedMotion],
  );

  /**
   * Renders animated flashing loading dots inside a container element.
   *
   * @param {HTMLElement} container - Target container element.
   * @param {number} [dotCount=3] - Number of dot glyphs to animate.
   * @returns {() => void} Cleanup function that removes loading dots.
   */
  const createLoadingDots = useCallback(
    (container: HTMLElement, dotCount: number = 3): (() => void) => {
      if (isReducedMotion) {
        container.textContent = "...";
        return () => {};
      }

      container.innerHTML = "";
      const dots: HTMLElement[] = [];

      for (let i = 0; i < dotCount; i++) {
        const dot = document.createElement("span");
        dot.textContent = "●";
        dot.style.cssText = `
          display: inline-block;
          margin: 0 2px;
          animation: loadingDot 1.4s ease-in-out infinite both;
          animation-delay: ${i * 0.16}s;
        `;
        container.appendChild(dot);
        dots.push(dot);
      }

      return () => {
        container.innerHTML = "";
      };
    },
    [isReducedMotion],
  );

  /**
   * Cancels and clears all currently running Web Animations tracked by this hook.
   */
  const stopAllAnimations = useCallback(() => {
    animationRefs.current.forEach((animation, id) => {
      cleanupAnimation(id);
    });
  }, [cleanupAnimation]);

  /**
   * Cancels a specific active animation by ID.
   *
   * @param {string} animationId - Unique identifier of the animation.
   */
  const stopAnimation = useCallback(
    (animationId: string) => {
      cleanupAnimation(animationId);
    },
    [cleanupAnimation],
  );

  return useMemo(
    () => ({
      createTypewriterEffect,
      createGlitchEffect,
      createMatrixRain,
      createPulseAnimation,
      createSlideIn,
      createBounceAnimation,
      createLoadingDots,
      stopAllAnimations,
      stopAnimation,
      isReducedMotion,
    }),
    [
      createTypewriterEffect,
      createGlitchEffect,
      createMatrixRain,
      createPulseAnimation,
      createSlideIn,
      createBounceAnimation,
      createLoadingDots,
      stopAllAnimations,
      stopAnimation,
      isReducedMotion,
    ],
  );
}

/**
 * Specialized animation hook tailored for terminal command output streams, scanline wipes, errors, and theme transitions.
 *
 * @returns {object} Terminal-specific animation methods and typing status flags.
 */
export function useTerminalAnimations() {
  const animations = useAnimations();
  const [isTyping, setIsTyping] = useState(false);
  const { isReducedMotion } = animations;

  /**
   * Dynamically renders terminal command output with frame-budgeted streaming typewriter animation and auto-scrolling.
   *
   * @param {HTMLElement} element - Target HTML element displaying output.
   * @param {string} content - Full text or ANSI output string.
   * @param {React.MutableRefObject<boolean>} [skipRef] - Optional ref to immediately skip animation and reveal entire content.
   * @returns {Promise<void>} Resolves when the stream animation finishes.
   */
  const animateCommandOutput = useCallback(
    async (
      element: HTMLElement,
      content: string,
      skipRef?: React.MutableRefObject<boolean>,
    ) => {
      if (isReducedMotion) {
        element.textContent = content;
        return;
      }

      setIsTyping(true);

      const MAX_DURATION_MS = 3000;
      const frameDelay = 16;
      const totalFrames = MAX_DURATION_MS / frameDelay;
      const charsPerFrame = Math.max(
        1,
        Math.ceil(content.length / totalFrames),
      );

      return new Promise<void>((resolve) => {
        element.textContent = "";
        element.classList.add("typing-cursor");

        let i = 0;
        let _timerId: NodeJS.Timeout | null = null;
        let userScrolledUp = false;

        /**
         * Tracks whether user has manually scrolled up to prevent disruptive auto-scroll behavior.
         */
        const handleScroll = () => {
          if (typeof window === "undefined") return;
          const threshold = 120;
          const position = window.innerHeight + window.scrollY;
          const height = document.documentElement.scrollHeight;
          if (height - position > threshold) {
            userScrolledUp = true;
          } else {
            userScrolledUp = false;
          }
        };

        if (typeof window !== "undefined") {
          window.addEventListener("scroll", handleScroll, { passive: true });
        }

        /**
         * Scrolls the newest output lines into view if the user hasn't scrolled up.
         */
        const autoScroll = () => {
          if (!userScrolledUp && element && typeof element.scrollIntoView === "function") {
            element.scrollIntoView({ block: "nearest", behavior: "auto" });
          }
        };

        /**
         * Cleans up typing classes, listeners, and resolves the promise.
         */
        const cleanup = () => {
          if (typeof window !== "undefined") {
            window.removeEventListener("scroll", handleScroll);
          }
          if (_timerId) clearTimeout(_timerId);
          element.classList.remove("typing-cursor");
          setIsTyping(false);
          resolve();
        };

        /**
         * Advances the typed output by a chunk of characters per frame.
         */
        const typeNextChar = () => {
          if (skipRef?.current) {
            element.textContent = content;
            autoScroll();
            cleanup();
            return;
          }

          if (i < content.length) {
            i = Math.min(content.length, i + charsPerFrame);
            element.textContent = content.slice(0, i);
            autoScroll();
            _timerId = setTimeout(typeNextChar, frameDelay);
          } else {
            autoScroll();
            cleanup();
          }
        };

        _timerId = setTimeout(typeNextChar, frameDelay);
      });
    },
    [isReducedMotion],
  );

  /**
   * Applies a CRT scanline swipe wipe animation during terminal clearing.
   *
   * @param {HTMLElement} containerElement - Terminal container element.
   * @param {() => void} onComplete - Callback triggered when scanline clear effect finishes.
   */
  const animateScanlineClear = useCallback(
    (containerElement: HTMLElement, onComplete: () => void) => {
      if (animations.isReducedMotion) {
        onComplete();
        return;
      }

      containerElement.classList.add("animate-scanline-clear");
      setTimeout(() => {
        containerElement.classList.remove("animate-scanline-clear");
        onComplete();
      }, 150);
    },
    [animations],
  );

  /**
   * Animates a glitch shake and turns text red upon command execution errors.
   *
   * @param {HTMLElement} element - Error text container element.
   */
  const animateCommandError = useCallback(
    (element: HTMLElement) => {
      animations.createGlitchEffect(element, 300);
      element.style.color = "#ff0000";
    },
    [animations],
  );

  /**
   * Animates a slide-and-bounce transition on an element when the terminal theme changes.
   *
   * @param {HTMLElement} element - Target container element to animate.
   */
  const animateThemeChange = useCallback(
    (element: HTMLElement) => {
      const animation = animations.createSlideIn(element, "up", {
        duration: 500,
      });
      if (animation) {
        animation.addEventListener("finish", () => {
          animations.createBounceAnimation(element, { duration: 200 });
        });
      }
    },
    [animations],
  );

  return {
    ...animations,
    animateCommandOutput,
    animateScanlineClear,
    animateCommandError,
    animateThemeChange,
    isTyping,
  };
}
