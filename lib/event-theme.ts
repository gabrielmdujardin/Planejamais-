export interface EventTheme {
  primary: string
  secondary: string
  accent: string
  gradient: string
  textColor: string
}

export function getEventTheme(eventType: string): EventTheme {
  const themes: Record<string, EventTheme> = {
    Casamento: {
      primary: "from-rose-500 to-pink-600",
      secondary: "bg-rose-50",
      accent: "text-rose-700",
      gradient: "bg-gradient-to-br from-rose-100 via-pink-50 to-amber-50",
      textColor: "text-rose-900",
    },
    Aniversário: {
      primary: "from-purple-500 to-pink-500",
      secondary: "bg-purple-50",
      accent: "text-purple-700",
      gradient: "bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50",
      textColor: "text-purple-900",
    },
    Corporativo: {
      primary: "from-blue-600 to-indigo-700",
      secondary: "bg-blue-50",
      accent: "text-blue-700",
      gradient: "bg-gradient-to-br from-blue-100 via-indigo-50 to-slate-50",
      textColor: "text-blue-900",
    },
    Formatura: {
      primary: "from-emerald-600 to-teal-700",
      secondary: "bg-emerald-50",
      accent: "text-emerald-700",
      gradient: "bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-50",
      textColor: "text-emerald-900",
    },
    "Chá de Bebê": {
      primary: "from-sky-400 to-cyan-500",
      secondary: "bg-sky-50",
      accent: "text-sky-700",
      gradient: "bg-gradient-to-br from-sky-100 via-cyan-50 to-blue-50",
      textColor: "text-sky-900",
    },
    Colaborativo: {
      primary: "from-amber-500 to-orange-600",
      secondary: "bg-amber-50",
      accent: "text-amber-700",
      gradient: "bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-50",
      textColor: "text-amber-900",
    },
  }

  return (
    themes[eventType] || {
      primary: "from-gray-600 to-gray-700",
      secondary: "bg-gray-50",
      accent: "text-gray-700",
      gradient: "bg-gradient-to-br from-gray-100 via-slate-50 to-zinc-50",
      textColor: "text-gray-900",
    }
  )
}

export function getEventImage(eventType: string): string {
  const images: Record<string, string> = {
    Casamento: "/elegant-wedding-celebration-flowers-romantic.jpg",
    Aniversário: "/birthday-party-celebration-balloons-colorful.jpg",
    Corporativo: "/corporate-event-professional-conference-modern.jpg",
    Formatura: "/graduation-ceremony-academic-celebration.jpg",
    "Chá de Bebê": "/baby-shower-celebration-cute-pastel.jpg",
    Colaborativo: "/collaborative-event-community-gathering.jpg",
  }

  return images[eventType] || "/event-celebration.jpg"
}
