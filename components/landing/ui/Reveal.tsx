"use client"

import { motion, useInView, useAnimation } from "framer-motion"
import { useEffect, useRef } from "react"

interface Props {
  children: React.ReactNode
  width?: "fit-content" | "100%"
  className?: string
  delay?: number
}

export const Reveal = ({ children, width = "100%", className, delay = 0 }: Props) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const mainControls = useAnimation()

  useEffect(() => {
    if (isInView) {
      mainControls.start("visible")
    }
  }, [isInView, mainControls])

  return (
    <div ref={ref} style={{ position: "relative", width, overflow: "hidden" }} className={className}>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 40 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        animate={mainControls}
        transition={{ 
            duration: 0.8, 
            delay: delay, 
            ease: [0.23, 1, 0.32, 1] 
        }}
        className="force-gpu"
      >
        {children}
      </motion.div>
    </div>
  )
}
