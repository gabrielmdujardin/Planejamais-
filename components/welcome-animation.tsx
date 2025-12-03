"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Logo } from "@/components/logo"
import { useAuth } from "@/context/auth-context"

export function WelcomeAnimation() {
  const [showAnimation, setShowAnimation] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    // Verificar se a animação já foi mostrada nesta sessão
    const hasSeenAnimation = sessionStorage.getItem("hasSeenWelcomeAnimation")

    if (hasSeenAnimation) {
      setShowAnimation(false)
      return
    }

    // Esconder a animação após 2.5 segundos
    const timer = setTimeout(() => {
      setShowAnimation(false)
      sessionStorage.setItem("hasSeenWelcomeAnimation", "true")
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  // Variantes para a animação
  const containerVariants = {
    hidden: { opacity: 1 },
    visible: { opacity: 1 },
    exit: {
      opacity: 0,
      transition: { duration: 0.5 },
    },
  }

  const welcomeTextVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 1.2,
        duration: 0.8,
      },
    },
  }

  if (!showAnimation) return null

  return (
    <AnimatePresence>
      {showAnimation && (
        <motion.div
          className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 z-50"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="text-center">
            <Logo size="lg" animated={true} />

            <motion.p
              variants={welcomeTextVariants}
              initial="hidden"
              animate="visible"
              className="mt-4 text-xl text-gray-600 dark:text-gray-300"
            >
              {user ? `Bem-vindo de volta, ${user.name}!` : "Organize seus eventos com facilidade"}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
