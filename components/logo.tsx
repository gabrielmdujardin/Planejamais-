"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  animated?: boolean
}

export function Logo({ size = "md", animated = true }: LogoProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Evitar hidratação incorreta
  useEffect(() => {
    setMounted(true)
  }, [])

  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  }

  const iconVariants = {
    hidden: { scale: 0.8, opacity: 0, rotate: -10 },
    visible: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.1,
      },
    },
  }

  const textVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
        delay: 0.2,
      },
    },
  }

  const plusVariants = {
    hidden: { scale: 0, opacity: 0, rotate: -45 },
    visible: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.3,
      },
    },
    hover: {
      scale: 1.2,
      rotate: 90,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
  }

  if (!mounted) {
    return <span className={`font-bold ${sizeClasses[size]}`}>Planeja+</span>
  }

  if (!animated) {
    return (
      <Link href="/" className="flex items-center">
        <span className={`font-bold ${sizeClasses[size]} text-emerald-600 dark:text-emerald-400`}>Planeja+</span>
      </Link>
    )
  }

  return (
    <Link href="/" className="flex items-center group">
      <div className="flex items-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={iconVariants}
          whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 dark:bg-emerald-500 mr-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
        <motion.span
          initial="hidden"
          animate="visible"
          variants={textVariants}
          className={`font-bold ${sizeClasses[size]} text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors`}
        >
          Planeja
        </motion.span>
        <motion.span
          initial="hidden"
          animate="visible"
          whileHover="hover"
          variants={plusVariants}
          className={`font-bold ${sizeClasses[size]} text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors`}
        >
          +
        </motion.span>
      </div>
    </Link>
  )
}
