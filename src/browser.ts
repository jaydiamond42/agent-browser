import { chromium, firefox, webkit, type Browser, type BrowserContext, type Page } from 'playwright';
import type { BrowserState, LaunchCommand } from './types.js';

/**
 * Manages the Playwright browser lifecycle
 */
export class BrowserManager {
  private state: BrowserState = {
    browser: null,
    context: null,
    page: null,
  };

  /**
   * Check if browser is launched
   */
  isLaunched(): boolean {
    return this.state.browser !== null;
  }

  /**
   * Get the current page, throws if not launched
   */
  getPage(): Page {
    if (!this.state.page) {
      throw new Error('Browser not launched. Call launch first.');
    }
    return this.state.page;
  }

  /**
   * Get the current browser instance
   */
  getBrowser(): Browser | null {
    return this.state.browser;
  }

  /**
   * Get the current context
   */
  getContext(): BrowserContext | null {
    return this.state.context;
  }

  /**
   * Launch the browser with the specified options
   */
  async launch(options: LaunchCommand): Promise<void> {
    // Close existing browser if any
    if (this.state.browser) {
      await this.close();
    }

    // Select browser type
    const browserType = options.browser ?? 'chromium';
    const launcher = browserType === 'firefox' 
      ? firefox 
      : browserType === 'webkit' 
        ? webkit 
        : chromium;

    // Launch browser
    this.state.browser = await launcher.launch({
      headless: options.headless ?? true,
    });

    // Create context with viewport
    this.state.context = await this.state.browser.newContext({
      viewport: options.viewport ?? { width: 1280, height: 720 },
    });

    // Create initial page
    this.state.page = await this.state.context.newPage();
  }

  /**
   * Close the browser and clean up
   */
  async close(): Promise<void> {
    if (this.state.page) {
      await this.state.page.close().catch(() => {});
      this.state.page = null;
    }

    if (this.state.context) {
      await this.state.context.close().catch(() => {});
      this.state.context = null;
    }

    if (this.state.browser) {
      await this.state.browser.close().catch(() => {});
      this.state.browser = null;
    }
  }
}
