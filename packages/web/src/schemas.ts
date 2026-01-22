/**
 * Zod schemas for runtime validation
 * Parse inputs (API responses, config, local storage, URL params) with a schema
 * After parsing, the type is safe - obj.color cannot be undefined unless schema allows it
 */

import { z } from 'zod';

// Task type schema
export const TaskTypeSchema = z.enum(['task', 'bug', 'feature', 'refactor', 'docs', 'chore']);

// Priority schema - handles null from database and converts to undefined
export const PrioritySchema = z.union([z.literal(0), z.literal(1), z.literal(2)])
  .nullish()
  .transform(val => val ?? undefined);

// Task status schema
export const TaskStatusSchema = z.enum(['planning', 'todo', 'in_progress', 'done']);

// Comment schema
export const TaskCommentSchema = z.object({
  id: z.string(),
  body: z.string(),
  author: z.enum(['user', 'mcp']),
  created_at: z.string(),
});

// Guardrail schema
export const GuardrailSchema = z.object({
  id: z.string(),
  number: z.number().int().positive(),
  text: z.string(),
});

// Task schema
export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: TaskStatusSchema,
  depends_on: z.array(z.string()),
  comments: z.array(TaskCommentSchema).nullish().transform(v => v ?? undefined),
  epic_id: z.string().nullish().transform(v => v ?? undefined),
  project_id: z.string(),
  agent: z.string().nullish().transform(v => v ?? undefined),
  archived: z.boolean().nullish().transform(v => v ?? undefined),
  priority: PrioritySchema.optional(),
  type: TaskTypeSchema.optional().default('task'), // CRITICAL: Default to 'task' if missing
  blocked_reason: z.string().nullish().transform(v => v ?? undefined),
  acceptance_criteria: z.array(z.string()).nullish().transform(v => v ?? undefined),
  guardrails: z.array(GuardrailSchema).nullish().transform(v => v ?? undefined),
  created_at: z.string().nullish().transform(v => v ?? undefined),
  updated_at: z.string().nullish().transform(v => v ?? undefined),
});

// Epic schema
export const EpicSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: TaskStatusSchema,
  depends_on: z.array(z.string()),
  notes: z.string().nullish().transform(v => v ?? ''),
  auto: z.boolean(),
  project_id: z.string(),
});

// Project schema
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish().transform(v => v ?? undefined),
});

// Store schema (full data structure)
export const StoreSchema = z.object({
  projects: z.array(ProjectSchema),
  epics: z.array(EpicSchema),
  tasks: z.array(TaskSchema),
});

// Type exports (inferred from schemas)
export type Task = z.infer<typeof TaskSchema>;
export type Epic = z.infer<typeof EpicSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Store = z.infer<typeof StoreSchema>;
export type TaskType = z.infer<typeof TaskTypeSchema>;
export type Priority = z.infer<typeof PrioritySchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

/**
 * Parse and validate data from API
 * Throws if validation fails, ensuring type safety
 */
export function parseTask(data: unknown): Task {
  return TaskSchema.parse(data);
}

export function parseTasks(data: unknown): Task[] {
  return z.array(TaskSchema).parse(data);
}

export function parseEpic(data: unknown): Epic {
  return EpicSchema.parse(data);
}

export function parseProject(data: unknown): Project {
  return ProjectSchema.parse(data);
}

export function parseStore(data: unknown): Store {
  return StoreSchema.parse(data);
}

/**
 * Safe parse (returns { success: true, data } or { success: false, error })
 * Use when you want to handle validation errors gracefully
 */
export function safeParseTask(data: unknown) {
  return TaskSchema.safeParse(data);
}

export function safeParseTasks(data: unknown) {
  return z.array(TaskSchema).safeParse(data);
}
