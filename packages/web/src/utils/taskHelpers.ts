import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'
import { TASK_TYPE_CONFIG, PRIORITY_CONFIG, type TaskType, type Priority } from '@flux/shared'

// Icon component type
type IconComponent = typeof CheckCircleIcon

// Icon mapping for task types
const TASK_TYPE_ICONS: Record<string, IconComponent> = {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
}

/**
 * Get icon component for a task type
 * @param type - Task type
 * @returns Icon component from Heroicons
 */
export const getTaskTypeIcon = (type: TaskType): IconComponent => {
  const config = TASK_TYPE_CONFIG[type]
  return TASK_TYPE_ICONS[config.icon] ?? CheckCircleIcon
}

/**
 * Get CSS class for task type badge (for TaskCard.css)
 * @param color - Color name from TASK_TYPE_CONFIG
 * @returns CSS class name for badge styling
 */
export const getTaskTypeBadgeClass = (color: string): string => {
  const classMap: Record<string, string> = {
    gray: 'task-card-type-badge-gray',
    red: 'task-card-type-badge-red',
    purple: 'task-card-type-badge-purple',
    blue: 'task-card-type-badge-blue',
    green: 'task-card-type-badge-green',
    amber: 'task-card-type-badge-amber',
  }
  return classMap[color] ?? 'task-card-type-badge-gray'
}

/**
 * Get Tailwind classes for task type color (for inline usage)
 * @param color - Color name from TASK_TYPE_CONFIG
 * @returns Tailwind class string for text and background colors
 */
export const getTaskTypeColor = (color: string): string => {
  const colorMap: Record<string, string> = {
    gray: 'text-gray-600 bg-gray-100',
    red: 'text-red-600 bg-red-100',
    purple: 'text-purple-600 bg-purple-100',
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    amber: 'text-amber-600 bg-amber-100',
  }
  return colorMap[color] ?? 'text-gray-600 bg-gray-100'
}

/**
 * Get priority configuration for badge styling
 * @param priority - Priority level (0 = P0, 1 = P1, 2 = P2)
 * @returns Priority config with label and color
 */
export const getPriorityConfig = (priority: Priority) => {
  return PRIORITY_CONFIG[priority]
}
