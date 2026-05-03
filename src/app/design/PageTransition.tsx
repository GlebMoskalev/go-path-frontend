import { motion } from 'motion/react';
import { useLocation } from 'react-router';
import { pageVariants } from './motion';

/** Wrap an outlet in this to get smooth, calm page transitions. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <motion.div
      key={location.pathname}
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
