"use client";

import { motion } from "framer-motion";
import IdentityScan from "@/components/ui/IdentityScan";

export default function LanyardCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="relative z-0 flex w-full items-center justify-center px-4 pt-24 sm:px-6 lg:justify-start lg:pl-10 lg:pr-0 lg:pt-0"
    >
      <IdentityScan />
    </motion.div>
  );
}
