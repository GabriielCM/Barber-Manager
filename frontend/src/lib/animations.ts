import { Variants, Transition } from 'framer-motion';

// ============================================
// DURATION TOKENS
// ============================================
export const durations = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
} as const;

// ============================================
// EASING TOKENS
// ============================================
export const easings = {
  easeOut: [0.16, 1, 0.3, 1],
  easeInOut: [0.87, 0, 0.13, 1],
  easeOutExpo: [0.19, 1, 0.22, 1],
} as const;

// ============================================
// SPRING CONFIGS
// ============================================
export const springs = {
  default: { type: 'spring', stiffness: 400, damping: 30 } as Transition,
  bounce: { type: 'spring', stiffness: 500, damping: 25 } as Transition,
  gentle: { type: 'spring', stiffness: 300, damping: 35 } as Transition,
  stiff: { type: 'spring', stiffness: 600, damping: 40 } as Transition,
} as const;

// ============================================
// FADE VARIANTS
// ============================================
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: durations.normal }
  },
  exit: {
    opacity: 0,
    transition: { duration: durations.fast }
  },
};

// ============================================
// FADE UP VARIANTS
// ============================================
export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: durations.fast }
  },
};

// ============================================
// FADE DOWN VARIANTS
// ============================================
export const fadeDownVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut
    }
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: { duration: durations.fast }
  },
};

// ============================================
// FADE LEFT VARIANTS
// ============================================
export const fadeLeftVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut
    }
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: { duration: durations.fast }
  },
};

// ============================================
// FADE RIGHT VARIANTS
// ============================================
export const fadeRightVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut
    }
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: { duration: durations.fast }
  },
};

// ============================================
// SCALE VARIANTS
// ============================================
export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: durations.fast }
  },
};

// ============================================
// STAGGER CONTAINER VARIANTS
// ============================================
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

// ============================================
// STAGGER ITEM VARIANTS
// ============================================
export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut
    },
  },
};

// ============================================
// SLIDE VARIANTS
// ============================================
export const slideVariants = {
  left: {
    hidden: { x: '-100%', opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: durations.normal,
        ease: easings.easeOut
      }
    },
    exit: {
      x: '-100%',
      opacity: 0,
      transition: { duration: durations.fast }
    },
  } as Variants,
  right: {
    hidden: { x: '100%', opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: durations.normal,
        ease: easings.easeOut
      }
    },
    exit: {
      x: '100%',
      opacity: 0,
      transition: { duration: durations.fast }
    },
  } as Variants,
  up: {
    hidden: { y: '100%', opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: durations.normal,
        ease: easings.easeOut
      }
    },
    exit: {
      y: '100%',
      opacity: 0,
      transition: { duration: durations.fast }
    },
  } as Variants,
  down: {
    hidden: { y: '-100%', opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: durations.normal,
        ease: easings.easeOut
      }
    },
    exit: {
      y: '-100%',
      opacity: 0,
      transition: { duration: durations.fast }
    },
  } as Variants,
};

// ============================================
// PAGE TRANSITION VARIANTS
// ============================================
export const pageTransitionVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: durations.fast },
  },
};

// ============================================
// MODAL/OVERLAY VARIANTS
// ============================================
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: durations.fast }
  },
  exit: {
    opacity: 0,
    transition: { duration: durations.fast }
  },
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springs.default,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: durations.fast },
  },
};

// ============================================
// BUTTON INTERACTION VARIANTS
// ============================================
export const buttonVariants = {
  tap: { scale: 0.98 },
  hover: { scale: 1.02 },
};

// ============================================
// CARD HOVER VARIANTS
// ============================================
export const cardHoverVariants: Variants = {
  rest: {
    y: 0,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
    transition: springs.default,
  },
  hover: {
    y: -4,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
    transition: springs.default,
  },
};

// ============================================
// LIST ITEM VARIANTS (for table rows, list items)
// ============================================
export const listItemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut
    },
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: { duration: durations.fast },
  },
};

// ============================================
// NOTIFICATION/TOAST VARIANTS
// ============================================
export const notificationVariants: Variants = {
  hidden: { opacity: 0, y: -50, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.bounce,
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.9,
    transition: { duration: durations.fast },
  },
};

// ============================================
// SKELETON SHIMMER (CSS-based, for reference)
// ============================================
export const shimmerAnimation = {
  initial: { x: '-100%' },
  animate: {
    x: '100%',
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'linear',
    },
  },
};

// ============================================
// UTILITY: Create stagger variants with custom delay
// ============================================
export function createStaggerVariants(staggerDelay = 0.05, delayChildren = 0.1): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren,
      },
    },
  };
}

// ============================================
// UTILITY: Create fade variants with custom direction and distance
// ============================================
export function createFadeVariants(
  direction: 'up' | 'down' | 'left' | 'right' | 'none' = 'up',
  distance = 20
): Variants {
  const axis = direction === 'up' || direction === 'down' ? 'y' : 'x';
  const value = direction === 'up' || direction === 'left' ? distance : -distance;

  if (direction === 'none') {
    return fadeVariants;
  }

  const hidden = { opacity: 0 } as Record<string, unknown>;
  const visible = {
    opacity: 1,
    transition: {
      duration: durations.normal,
      ease: easings.easeOut
    },
  } as Record<string, unknown>;
  const exit = {
    opacity: 0,
    transition: { duration: durations.fast },
  } as Record<string, unknown>;

  hidden[axis] = value;
  visible[axis] = 0;
  exit[axis] = -value / 2;

  return { hidden, visible, exit } as Variants;
}
