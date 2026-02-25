"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, CalendarDays } from "lucide-react"
import EventCard from "@/components/event-card"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { useEventStore } from "@/stores/event-store"
import { motion } from "framer-motion"
import { AnimatedCard } from "@/components/animated-card"

export default function Dashboard() {
  const { user } = useAuth()
  const { events } = useEventStore()
  const [isLoading, setIsLoading] = useState(true)

  // Simular carregamento de eventos do usuário
  useEffect(() => {
    const loadEvents = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setIsLoading(false)
    }

    loadEvents()
  }, [])

  // Variantes para animações
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Gerencie seus eventos</p>
        </div>
        <Link href="/create-event">
          <Button className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600">
            <Plus className="h-4 w-4 mr-2" /> Criar novo evento
          </Button>
        </Link>
      </motion.div>

      <div className="space-y-8">
          {isLoading ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-[280px] animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {events.length > 0
                ? events.map((event, index) => (
                    <AnimatedCard key={event.id} delay={index * 0.1}>
                      <Link href={`/event/${event.id}`}>
                        <EventCard event={event} />
                      </Link>
                    </AnimatedCard>
                  ))
                : null}

              {/* Create Event Card */}
              <AnimatedCard delay={events.length * 0.1}>
                <Link href="/create-event">
                  <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer h-full">
                    <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[280px]">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mb-4">
                        <Plus className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-center">Criar novo evento</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
                        Comece a planejar seu próximo evento com facilidade
                      </p>
                      <Button variant="outline" className="mt-2 bg-transparent">
                        Começar agora
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              </AnimatedCard>
            </motion.div>
          )}

          {!isLoading && events.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-12"
            >
              <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mb-4">
                <CalendarDays className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Nenhum evento criado</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                Você ainda não criou nenhum evento. Comece agora mesmo a organizar seu próximo evento!
              </p>
              <Link href="/create-event">
                <Button className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600">
                  <Plus className="h-4 w-4 mr-2" /> Criar meu primeiro evento
                </Button>
              </Link>
            </motion.div>
          ) : null}

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <h2 className="text-2xl font-bold mb-6">Eventos Recentes</h2>
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Você ainda não tem eventos passados</p>
                  <Button variant="outline">Ver tutoriais</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
      </div>
    </div>
  )
}
