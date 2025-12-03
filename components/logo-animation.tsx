"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

export function LogoAnimation() {
  const [showAnimation, setShowAnimation] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Verificar se a animação já foi mostrada nesta sessão
    const hasSeenAnimation = sessionStorage.getItem("hasSeenLogoAnimation")

    if (hasSeenAnimation) {
      setShowAnimation(false)
    } else {
      // Bloquear scroll durante a animação
      document.body.style.overflow = "hidden"

      // Após a animação, liberar o scroll e salvar na sessão
      const timer = setTimeout(() => {
        document.body.style.overflow = ""
        sessionStorage.setItem("hasSeenLogoAnimation", "true")
        setShowAnimation(false)
      }, 5000) // Duração total da animação

      return () => {
        clearTimeout(timer)
        document.body.style.overflow = ""
      }
    }
  }, [])

  // Se não deve mostrar a animação, não renderiza nada
  if (!showAnimation) return null

  return (
    <AnimatePresence>
      {showAnimation && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, delay: 4.5 }}
        >
          <div className="relative flex flex-col items-center justify-center">
            {/* Animação das letras de "Planeja" */}
            <div className="flex items-center justify-center mb-4">
              {["P", "l", "a", "n", "e", "j", "a"].map((letter, index) => (
                <motion.div
                  key={index}
                  className="text-6xl font-bold text-emerald-600 dark:text-emerald-400"
                  initial={{
                    y: -100,
                    opacity: 0,
                    rotateY: 90,
                    scale: 0.5,
                  }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    rotateY: 0,
                    scale: 1,
                  }}
                  transition={{
                    duration: 0.5,
                    delay: 0.1 * index,
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                  }}
                >
                  {letter}
                </motion.div>
              ))}
            </div>

            {/* Animação especial do símbolo "+" */}
            <div className="relative h-40 w-40 mt-4">
              {/* Linhas horizontais que se formam para criar o "+" */}
              <motion.div
                className="absolute top-1/2 left-1/2 h-12 w-0 bg-emerald-600 dark:bg-emerald-400 -translate-y-1/2"
                initial={{ width: 0, left: "50%" }}
                animate={{ width: "100%", left: "0%" }}
                transition={{
                  duration: 0.6,
                  delay: 1.2,
                  ease: "easeOut",
                }}
              />

              {/* Linha vertical que desce para completar o "+" */}
              <motion.div
                className="absolute top-0 left-1/2 h-0 w-12 bg-emerald-600 dark:bg-emerald-400 -translate-x-1/2"
                initial={{ height: 0, top: "50%" }}
                animate={{ height: "100%", top: "0%" }}
                transition={{
                  duration: 0.6,
                  delay: 1.8,
                  ease: "easeOut",
                }}
              />

              {/* Efeito de rotação e escala do "+" completo */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.4, duration: 0.3 }}
              >
                <motion.div
                  className="text-8xl font-bold text-emerald-600 dark:text-emerald-400"
                  initial={{ scale: 1, rotate: 0 }}
                  animate={[
                    { scale: 1.5, rotate: 90, transition: { delay: 2.5, duration: 0.4 } },
                    { scale: 1, rotate: 0, transition: { delay: 3.0, duration: 0.5 } },
                  ]}
                >
                  +
                </motion.div>
              </motion.div>
            </div>

            {/* Animação final com o logo completo */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 3.6, duration: 0.5 }}
            >
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-600 dark:bg-emerald-500 mr-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="text-5xl font-bold text-emerald-600 dark:text-emerald-400">Planeja</span>
                <span className="text-5xl font-bold text-emerald-600 dark:text-emerald-400">+</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
