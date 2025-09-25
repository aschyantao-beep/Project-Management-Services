import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export function formatDate(date: string | Date, format = 'YYYY-MM-DD'): string {
  return dayjs(date).format(format)
}

export function formatDateTime(date: string | Date): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

export function formatRelativeTime(date: string | Date): string {
  return dayjs(date).fromNow()
}

export function isPast(date: string | Date): boolean {
  return dayjs(date).isBefore(dayjs(), 'day')
}

export function isToday(date: string | Date): boolean {
  return dayjs(date).isSame(dayjs(), 'day')
}

export function isFuture(date: string | Date): boolean {
  return dayjs(date).isAfter(dayjs(), 'day')
}