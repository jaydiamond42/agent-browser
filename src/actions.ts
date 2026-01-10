import type { Page } from 'playwright';
import type { BrowserManager } from './browser.js';
import type {
  Command,
  Response,
  NavigateCommand,
  ClickCommand,
  TypeCommand,
  PressCommand,
  ScreenshotCommand,
  EvaluateCommand,
  WaitCommand,
  ScrollCommand,
  SelectCommand,
  HoverCommand,
  ContentCommand,
  NavigateData,
  ScreenshotData,
  EvaluateData,
  ContentData,
} from './types.js';
import { successResponse, errorResponse } from './protocol.js';

// Snapshot response type
interface SnapshotData {
  snapshot: string;
}

/**
 * Execute a command and return a response
 */
export async function executeCommand(
  command: Command,
  browser: BrowserManager
): Promise<Response> {
  try {
    switch (command.action) {
      case 'launch':
        return await handleLaunch(command, browser);
      case 'navigate':
        return await handleNavigate(command, browser);
      case 'click':
        return await handleClick(command, browser);
      case 'type':
        return await handleType(command, browser);
      case 'press':
        return await handlePress(command, browser);
      case 'screenshot':
        return await handleScreenshot(command, browser);
      case 'snapshot':
        return await handleSnapshot(command, browser);
      case 'evaluate':
        return await handleEvaluate(command, browser);
      case 'wait':
        return await handleWait(command, browser);
      case 'scroll':
        return await handleScroll(command, browser);
      case 'select':
        return await handleSelect(command, browser);
      case 'hover':
        return await handleHover(command, browser);
      case 'content':
        return await handleContent(command, browser);
      case 'close':
        return await handleClose(command, browser);
      default: {
        // TypeScript narrows to never here, but we handle it for safety
        const unknownCommand = command as { id: string; action: string };
        return errorResponse(unknownCommand.id, `Unknown action: ${unknownCommand.action}`);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResponse(command.id, message);
  }
}

async function handleLaunch(
  command: Command & { action: 'launch' },
  browser: BrowserManager
): Promise<Response> {
  await browser.launch(command);
  return successResponse(command.id, { launched: true });
}

async function handleNavigate(
  command: NavigateCommand,
  browser: BrowserManager
): Promise<Response<NavigateData>> {
  const page = browser.getPage();
  await page.goto(command.url, {
    waitUntil: command.waitUntil ?? 'load',
  });
  
  return successResponse(command.id, {
    url: page.url(),
    title: await page.title(),
  });
}

async function handleClick(
  command: ClickCommand,
  browser: BrowserManager
): Promise<Response> {
  const page = browser.getPage();
  await page.click(command.selector, {
    button: command.button,
    clickCount: command.clickCount,
    delay: command.delay,
  });
  
  return successResponse(command.id, { clicked: true });
}

async function handleType(
  command: TypeCommand,
  browser: BrowserManager
): Promise<Response> {
  const page = browser.getPage();
  
  if (command.clear) {
    await page.fill(command.selector, '');
  }
  
  await page.type(command.selector, command.text, {
    delay: command.delay,
  });
  
  return successResponse(command.id, { typed: true });
}

async function handlePress(
  command: PressCommand,
  browser: BrowserManager
): Promise<Response> {
  const page = browser.getPage();
  
  if (command.selector) {
    await page.press(command.selector, command.key);
  } else {
    await page.keyboard.press(command.key);
  }
  
  return successResponse(command.id, { pressed: true });
}

async function handleScreenshot(
  command: ScreenshotCommand,
  browser: BrowserManager
): Promise<Response<ScreenshotData>> {
  const page = browser.getPage();
  
  const options: Parameters<Page['screenshot']>[0] = {
    fullPage: command.fullPage,
    type: command.format ?? 'png',
  };
  
  if (command.format === 'jpeg' && command.quality !== undefined) {
    options.quality = command.quality;
  }
  
  let target: Page | ReturnType<Page['locator']> = page;
  if (command.selector) {
    target = page.locator(command.selector);
  }
  
  if (command.path) {
    await target.screenshot({ ...options, path: command.path });
    return successResponse(command.id, { path: command.path });
  } else {
    const buffer = await target.screenshot(options);
    return successResponse(command.id, { base64: buffer.toString('base64') });
  }
}

async function handleSnapshot(
  command: Command & { action: 'snapshot' },
  browser: BrowserManager
): Promise<Response<SnapshotData>> {
  const page = browser.getPage();
  // Use ariaSnapshot which returns a string representation of the accessibility tree
  const snapshot = await page.locator(':root').ariaSnapshot();
  
  return successResponse(command.id, {
    snapshot: snapshot ?? 'Empty page',
  });
}

async function handleEvaluate(
  command: EvaluateCommand,
  browser: BrowserManager
): Promise<Response<EvaluateData>> {
  const page = browser.getPage();
  
  // Evaluate the script directly as a string expression
  const result = await page.evaluate(command.script);
  
  return successResponse(command.id, { result });
}

async function handleWait(
  command: WaitCommand,
  browser: BrowserManager
): Promise<Response> {
  const page = browser.getPage();
  
  if (command.selector) {
    await page.waitForSelector(command.selector, {
      state: command.state ?? 'visible',
      timeout: command.timeout,
    });
  } else if (command.timeout) {
    await page.waitForTimeout(command.timeout);
  } else {
    // Default: wait for load state
    await page.waitForLoadState('load');
  }
  
  return successResponse(command.id, { waited: true });
}

async function handleScroll(
  command: ScrollCommand,
  browser: BrowserManager
): Promise<Response> {
  const page = browser.getPage();
  
  if (command.selector) {
    const element = page.locator(command.selector);
    await element.scrollIntoViewIfNeeded();
    
    if (command.x !== undefined || command.y !== undefined) {
      await element.evaluate((el, { x, y }) => {
        el.scrollBy(x ?? 0, y ?? 0);
      }, { x: command.x, y: command.y });
    }
  } else {
    // Scroll the page
    let deltaX = command.x ?? 0;
    let deltaY = command.y ?? 0;
    
    if (command.direction) {
      const amount = command.amount ?? 100;
      switch (command.direction) {
        case 'up':
          deltaY = -amount;
          break;
        case 'down':
          deltaY = amount;
          break;
        case 'left':
          deltaX = -amount;
          break;
        case 'right':
          deltaX = amount;
          break;
      }
    }
    
    await page.evaluate(`window.scrollBy(${deltaX}, ${deltaY})`);
  }
  
  return successResponse(command.id, { scrolled: true });
}

async function handleSelect(
  command: SelectCommand,
  browser: BrowserManager
): Promise<Response> {
  const page = browser.getPage();
  const values = Array.isArray(command.values) ? command.values : [command.values];
  
  await page.selectOption(command.selector, values);
  
  return successResponse(command.id, { selected: values });
}

async function handleHover(
  command: HoverCommand,
  browser: BrowserManager
): Promise<Response> {
  const page = browser.getPage();
  await page.hover(command.selector);
  
  return successResponse(command.id, { hovered: true });
}

async function handleContent(
  command: ContentCommand,
  browser: BrowserManager
): Promise<Response<ContentData>> {
  const page = browser.getPage();
  
  let html: string;
  if (command.selector) {
    html = await page.locator(command.selector).innerHTML();
  } else {
    html = await page.content();
  }
  
  return successResponse(command.id, { html });
}

async function handleClose(
  command: Command & { action: 'close' },
  browser: BrowserManager
): Promise<Response> {
  await browser.close();
  return successResponse(command.id, { closed: true });
}
