// Task represents a single work item.
export type Task = {
  id: string;
  title: string;
  status: string; // e.g. "todo" | "in_progress" | "done"
  depends_on: string[];
  notes: string;
  epic_id?: string;
  project_id: string;
};

// Epic represents a grouped set of tasks.
export type Epic = {
  id: string;
  title: string;
  status: string;
  depends_on: string[];
  notes: string;
  project_id: string;
};

// Project represents a Kanban project.
export type Project = {
  id: string;
  name: string;
  description?: string;
};

// Store is the JSON document root.
export type Store = {
  projects: Project[];
  epics: Epic[];
  tasks: Task[];
};

// Status columns for the Kanban board
export type Status = 'todo' | 'in_progress' | 'done';

export const STATUSES: Status[] = ['todo', 'in_progress', 'done'];

// Status display names and colors
export const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  todo: { label: 'To Do', color: '#6b7280' },
  in_progress: { label: 'In Progress', color: '#3b82f6' },
  done: { label: 'Done', color: '#22c55e' },
};

// Epic colors palette
export const EPIC_COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // orange/amber
  '#8b5cf6', // purple
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
];
