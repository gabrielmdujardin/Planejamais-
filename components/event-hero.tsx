"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Share2, Edit, Calendar, MapPin, Clock, Users } from "lucide-react"
import { getEventTheme, getEventImage } from "@/lib/event-theme"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface EventHeroProps {
  event: {
    id: string
    title: string
    type: string
    category: string
    date: string
    time: string
    location: string
    description: string
    confirmedGuests: number
    totalGuests: number
    bannerImage?: string
  }
  onEdit: () => void
}

export default function EventHero({ event, onEdit }: EventHeroProps) {
  const { toast } = useToast()
  const theme = getEventTheme(event.type)
  const defaultImage = getEventImage(event.type)

  const handleShare = async () => {
    const url = `${window.location.origin}/event/${event.id}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Você está convidado para ${event.title}!`,
          url: url,
        })
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== "AbortError") {
          copyToClipboard(url)
        }
      }
    } else {
      copyToClipboard(url)
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({
      title: "Link copiado!",
      description: "O link do evento foi copiado para a área de transferência.",
    })
  }

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-2xl mb-8">
      {/* Background Image with Overlay */}
      <div className="relative h-[500px] w-full">
        {event.bannerImage ? (
          <>
            <Image
              src={event.bannerImage || "/placeholder.svg"}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent`} />
          </>
        ) : (
          <div className={`absolute inset-0 ${theme.gradient}`} />
        )}
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
        <div className="max-w-4xl">
          {/* Event Type Badge */}
          <Badge className={`mb-4 text-sm px-4 py-1.5 bg-white/90 backdrop-blur-sm text-gray-900 hover:bg-white`}>
            {event.type} • {event.category}
          </Badge>

          {/* Event Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight text-balance">
            {event.title}
          </h1>

          {/* Event Description */}
          <p className="text-lg md:text-xl text-white/90 mb-6 max-w-2xl text-pretty">{event.description}</p>

          {/* Event Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-2 text-white/90">
              <Calendar className="h-5 w-5" />
              <span className="text-sm font-medium">{event.date}</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-medium">{event.time}</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <MapPin className="h-5 w-5" />
              <span className="text-sm font-medium truncate">{event.location}</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium">
                {event.confirmedGuests}/{event.totalGuests}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="bg-white text-gray-900 hover:bg-white/90 shadow-lg" onClick={handleShare}>
              <Share2 className="h-5 w-5 mr-2" />
              Compartilhar Evento
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20"
              onClick={onEdit}
            >
              <Edit className="h-5 w-5 mr-2" />
              Editar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
