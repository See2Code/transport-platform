declare module 'framer-motion' {
  import { ComponentType, ReactNode } from 'react';

  export interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    variants?: any;
    whileHover?: any;
    whileTap?: any;
    whileDrag?: any;
    drag?: boolean;
    dragConstraints?: any;
    dragElastic?: number;
    dragMomentum?: boolean;
    onDragStart?: () => void;
    onDragEnd?: () => void;
    onHoverStart?: () => void;
    onHoverEnd?: () => void;
    onTapStart?: () => void;
    onTapEnd?: () => void;
    layout?: boolean;
    layoutId?: string;
    layoutPosition?: boolean;
    layoutScroll?: boolean;
    layoutSize?: boolean;
    layoutTransition?: any;
    custom?: any;
  }

  export interface AnimatePresenceProps {
    children?: ReactNode;
    mode?: 'sync' | 'wait' | 'popLayout';
    initial?: boolean;
    onExitComplete?: () => void;
    presenceAffectsLayout?: boolean;
  }

  export const motion: {
    div: ComponentType<MotionProps & React.HTMLAttributes<HTMLDivElement>>;
    tr: ComponentType<MotionProps & React.HTMLAttributes<HTMLTableRowElement>>;
    [key: string]: ComponentType<MotionProps & React.HTMLAttributes<HTMLElement>>;
  };

  export const AnimatePresence: ComponentType<AnimatePresenceProps>;
} 