import { z } from 'zod';
import type { Command, Response } from './types.js';

// Base schema for all commands
const baseCommandSchema = z.object({
  id: z.string(),
  action: z.string(),
});

// Individual action schemas
const launchSchema = baseCommandSchema.extend({
  action: z.literal('launch'),
  headless: z.boolean().optional(),
  viewport: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }).optional(),
  browser: z.enum(['chromium', 'firefox', 'webkit']).optional(),
});

const navigateSchema = baseCommandSchema.extend({
  action: z.literal('navigate'),
  url: z.string().min(1),
  waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle']).optional(),
});

const clickSchema = baseCommandSchema.extend({
  action: z.literal('click'),
  selector: z.string().min(1),
  button: z.enum(['left', 'right', 'middle']).optional(),
  clickCount: z.number().positive().optional(),
  delay: z.number().nonnegative().optional(),
});

const typeSchema = baseCommandSchema.extend({
  action: z.literal('type'),
  selector: z.string().min(1),
  text: z.string(),
  delay: z.number().nonnegative().optional(),
  clear: z.boolean().optional(),
});

const pressSchema = baseCommandSchema.extend({
  action: z.literal('press'),
  key: z.string().min(1),
  selector: z.string().min(1).optional(),
});

const screenshotSchema = baseCommandSchema.extend({
  action: z.literal('screenshot'),
  path: z.string().optional(),
  fullPage: z.boolean().optional(),
  selector: z.string().min(1).optional(),
  format: z.enum(['png', 'jpeg']).optional(),
  quality: z.number().min(0).max(100).optional(),
});

const snapshotSchema = baseCommandSchema.extend({
  action: z.literal('snapshot'),
});

const evaluateSchema = baseCommandSchema.extend({
  action: z.literal('evaluate'),
  script: z.string().min(1),
  args: z.array(z.unknown()).optional(),
});

const waitSchema = baseCommandSchema.extend({
  action: z.literal('wait'),
  selector: z.string().min(1).optional(),
  timeout: z.number().positive().optional(),
  state: z.enum(['attached', 'detached', 'visible', 'hidden']).optional(),
});

const scrollSchema = baseCommandSchema.extend({
  action: z.literal('scroll'),
  selector: z.string().min(1).optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  direction: z.enum(['up', 'down', 'left', 'right']).optional(),
  amount: z.number().positive().optional(),
});

const selectSchema = baseCommandSchema.extend({
  action: z.literal('select'),
  selector: z.string().min(1),
  values: z.union([z.string(), z.array(z.string())]),
});

const hoverSchema = baseCommandSchema.extend({
  action: z.literal('hover'),
  selector: z.string().min(1),
});

const contentSchema = baseCommandSchema.extend({
  action: z.literal('content'),
  selector: z.string().min(1).optional(),
});

const closeSchema = baseCommandSchema.extend({
  action: z.literal('close'),
});

// Union schema for all commands
const commandSchema = z.discriminatedUnion('action', [
  launchSchema,
  navigateSchema,
  clickSchema,
  typeSchema,
  pressSchema,
  screenshotSchema,
  snapshotSchema,
  evaluateSchema,
  waitSchema,
  scrollSchema,
  selectSchema,
  hoverSchema,
  contentSchema,
  closeSchema,
]);

// Parse result type
export type ParseResult = 
  | { success: true; command: Command }
  | { success: false; error: string; id?: string };

/**
 * Parse a JSON string into a validated command
 */
export function parseCommand(input: string): ParseResult {
  // First, try to parse JSON
  let json: unknown;
  try {
    json = JSON.parse(input);
  } catch {
    return { success: false, error: 'Invalid JSON' };
  }

  // Extract id for error responses if possible
  const id = typeof json === 'object' && json !== null && 'id' in json 
    ? String((json as { id: unknown }).id) 
    : undefined;

  // Validate against schema
  const result = commandSchema.safeParse(json);
  
  if (!result.success) {
    const errors = result.error.errors
      .map(e => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    return { success: false, error: `Validation error: ${errors}`, id };
  }

  return { success: true, command: result.data as Command };
}

/**
 * Create a success response
 */
export function successResponse<T>(id: string, data: T): Response<T> {
  return { id, success: true, data };
}

/**
 * Create an error response
 */
export function errorResponse(id: string, error: string): Response {
  return { id, success: false, error };
}

/**
 * Serialize a response to JSON string
 */
export function serializeResponse(response: Response): string {
  return JSON.stringify(response);
}
