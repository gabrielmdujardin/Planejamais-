declare module "react-big-calendar" {
  import type { ComponentType, CSSProperties, ReactNode } from "react"

  export type View = "month" | "week" | "work_week" | "day" | "agenda"

  export const Views: {
    MONTH: "month"
    WEEK: "week"
    WORK_WEEK: "work_week"
    DAY: "day"
    AGENDA: "agenda"
  }

  export function dateFnsLocalizer(config: Record<string, any>): any

  export interface CalendarProps<TEvent = any> {
    localizer: any
    events?: TEvent[]
    startAccessor?: keyof TEvent | ((event: TEvent) => Date)
    endAccessor?: keyof TEvent | ((event: TEvent) => Date)
    style?: CSSProperties
    messages?: Record<string, any>
    culture?: string
    view?: View
    onView?: (view: View) => void
    date?: Date
    onNavigate?: (date: Date, view?: View, action?: string) => void
    onSelectEvent?: (event: TEvent) => void
    eventPropGetter?: (
      event: TEvent,
      start: Date,
      end: Date,
      isSelected: boolean
    ) => { className?: string; style?: CSSProperties }
    components?: {
      event?: ComponentType<{ event: TEvent; title?: string }>
      [key: string]: ComponentType<any> | undefined
    }
    views?: View[] | Record<string, boolean | ComponentType<any>>
    step?: number
    showMultiDayTimes?: boolean
    popup?: boolean
    popupOffset?: number | { x: number; y: number }
    formats?: {
      monthHeaderFormat?: string | ((date: Date, culture?: string, localizer?: any) => string)
      dayHeaderFormat?: string | ((date: Date, culture?: string, localizer?: any) => string)
      dayRangeHeaderFormat?: (range: { start: Date; end: Date }, culture?: string, localizer?: any) => string
      agendaDateFormat?: string | ((date: Date, culture?: string, localizer?: any) => string)
      agendaTimeFormat?: string | ((date: Date, culture?: string, localizer?: any) => string)
      agendaTimeRangeFormat?: (range: { start: Date; end: Date }, culture?: string, localizer?: any) => string
      [key: string]: any
    }
    children?: ReactNode
  }

  export const Calendar: ComponentType<CalendarProps<any>>
}
