import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const pageVariants = {
  initial: {
    opacity: 0,
    y: 30,
    filter: "blur(12px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    filter: "blur(8px)",
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
};

const PageTransition = ({ children }: { children: ReactNode }) => {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      data-page-transition
      variants={pageVariants}
      initial={reduceMotion ? "animate" : "initial"}
      animate="animate"
      exit={reduceMotion ? "animate" : "exit"}
      className="w-full"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
