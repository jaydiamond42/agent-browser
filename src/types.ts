import type { Page, Browser, BrowserContext } from 'playwright';

// Base command structure
export interface BaseCommand {
  id: string;
  action: string;
}

// Action-specific command types
export interface LaunchCommand extends BaseCommand {
  action: 'launch';
  headless?: boolean;
  viewport?: { width: number; height: number };
  browser?: 'chromium' | 'firefox' | 'webkit';
}

export interface NavigateCommand extends BaseCommand {
  action: 'navigate';
  url: string;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
}

export interface ClickCommand extends BaseCommand {
  action: 'click';
  selector: string;
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
  delay?: number;
}

export interface TypeCommand extends BaseCommand {
  action: 'type';
  selector: string;
  text: string;
  delay?: number;
  clear?: boolean;
}

export interface PressCommand extends BaseCommand {
  action: 'press';
  key: string;
  selector?: string;
}

export interface ScreenshotCommand extends BaseCommand {
  action: 'screenshot';
  path?: string;
  fullPage?: boolean;
  selector?: string;
  format?: 'png' | 'jpeg';
  quality?: number;
}

export interface SnapshotCommand extends BaseCommand {
  action: 'snapshot';
}

export interface EvaluateCommand extends BaseCommand {
  action: 'evaluate';
  script: string;
  args?: unknown[];
}

export interface WaitCommand extends BaseCommand {
  action: 'wait';
  selector?: string;
  timeout?: number;
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
}

export interface ScrollCommand extends BaseCommand {
  action: 'scroll';
  selector?: string;
  x?: number;
  y?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  amount?: number;
}

export interface SelectCommand extends BaseCommand {
  action: 'select';
  selector: string;
  values: string | string[];
}

export interface HoverCommand extends BaseCommand {
  action: 'hover';
  selector: string;
}

export interface ContentCommand extends BaseCommand {
  action: 'content';
  selector?: string;
}

export interface CloseCommand extends BaseCommand {
  action: 'close';
}

// Union of all command types
export type Command =
  | LaunchCommand
  | NavigateCommand
  | ClickCommand
  | TypeCommand
  | PressCommand
  | ScreenshotCommand
  | SnapshotCommand
  | EvaluateCommand
  | WaitCommand
  | ScrollCommand
  | SelectCommand
  | HoverCommand
  | ContentCommand
  | CloseCommand;

// Response types
export interface SuccessResponse<T = unknown> {
  id: string;
  success: true;
  data: T;
}

export interface ErrorResponse {
  id: string;
  success: false;
  error: string;
}

export type Response<T = unknown> = SuccessResponse<T> | ErrorResponse;

// Data types for specific responses
export interface NavigateData {
  url: string;
  title: string;
}

export interface ScreenshotData {
  path?: string;
  base64?: string;
}

export interface SnapshotData {
  snapshot: string;
}

export interface EvaluateData {
  result: unknown;
}

export interface ContentData {
  html: string;
}

// Browser state
export interface BrowserState {
  browser: Browser | null;
  context: BrowserContext | null;
  page: Page | null;
}
