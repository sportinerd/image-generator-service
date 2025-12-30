import puppeteer, { Browser, Page } from 'puppeteer';
import { Logger } from '../utils/logger';
import { ImageRequest } from '../types';
import { getGoalHtmlTemplate } from '../templates/goalTemplate';

// Module-level state
let availableBrowsers: Browser[] = [];
let poolSize: number = parseInt(process.env.BROWSER_POOL_SIZE || '3', 10);
let isInitialized = false;

// Helper: Launch a single browser instance
async function launchBrowser(): Promise<Browser> {
    return await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // Memory issue mitigation
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
        ],
    });
}

async function initialize(size?: number): Promise<void> {
    if (isInitialized) return;

    if (typeof size === 'number' && size > 0) {
        poolSize = size;
    }

    Logger.info('Initializing browser pool', { poolSize });

    try {
        const launchPromises = Array.from({ length: poolSize }, () => launchBrowser());
        availableBrowsers = await Promise.all(launchPromises);

        isInitialized = true;
        Logger.info('Browser pool initialized successfully');
    } catch (error) {
        Logger.error('Failed to initialize browser pool', { error });
        throw error;
    }
}

async function getBrowser(): Promise<Browser> {
    // Wait for a browser to be available
    while (availableBrowsers.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    const browser = availableBrowsers.pop()!;

    // Self-healing: Check connection
    if (!browser.isConnected()) {
        Logger.warn('Derived browser is disconnected. Launching replacement...');
        try {
            return await launchBrowser();
        } catch (error) {
            Logger.error('Failed to relaunch browser', { error });
            // Put the dead one back? No, just throw or retry. 
            // Better to fail this request than hang.
            throw error;
        }
    }

    return browser;
}

async function releaseBrowser(browser: Browser): Promise<void> {
    if (browser.isConnected()) {
        availableBrowsers.push(browser);
    } else {
        Logger.warn('Releasing disconnected browser. Replacing...');
        try {
            const newBrowser = await launchBrowser();
            availableBrowsers.push(newBrowser);
        } catch (error) {
            Logger.error('Failed to replace dead browser during release', { error });
            // We reduced the pool size effectively. 
            // In a real system, we might want a background healer.
        }
    }
}

async function generateImage(
    data: ImageRequest,
    width: number = 900,
    height: number = 900
): Promise<Buffer> {
    if (!isInitialized) {
        await initialize();
    }

    const MAX_RETRIES = 2;
    let attempt = 0;
    let lastError: any;

    while (attempt < MAX_RETRIES) {
        let browser: Browser | null = null;
        let page: Page | null = null;

        try {
            browser = await getBrowser();

            Logger.debug(`Generating image (attempt ${attempt + 1})`, { type: data.type, id: data.id });

            const html = getGoalHtmlTemplate(data);

            page = await browser.newPage();
            await page.setViewport({ width, height, deviceScaleFactor: 2 });

            // Set content with aggressive timeouts for stability
            await page.setContent(html, {
                waitUntil: ['networkidle0'], // Stricter wait
                timeout: 30000
            });

            // Brief settlement
            // await new Promise(resolve => setTimeout(resolve, 100));

            const screenshot = await page.screenshot({
                type: 'png',
                fullPage: true,
                omitBackground: true
            });

            // Success! Return browser and result
            await releaseBrowser(browser);
            return screenshot as Buffer;

        } catch (error: any) {
            lastError = error;
            Logger.error(`Image generation failed (attempt ${attempt + 1})`, { error: error.message });

            // If we have a browser, it might be tainted.
            if (browser) {
                // Determine if we should recycle or kill it. 
                // Using releaseBrowser handles the connectivity check.
                // However, if the page crashed, we might strictly want to kill it.
                // For simplicity, releaseBrowser's isConnected check is usually enough for "Protocol error".
                await releaseBrowser(browser);
            }
        } finally {
            if (page) {
                try { await page.close(); } catch { }
            }
        }

        attempt++;
    }

    throw lastError || new Error('Image generation failed after retries');
}

async function cleanup(): Promise<void> {
    Logger.info('Cleaning up browser pool');
    const closePromises = availableBrowsers.map(b => b.close().catch(err => Logger.error('Error closing browser', err)));
    await Promise.all(closePromises);
    availableBrowsers = [];
    isInitialized = false;
    Logger.info('Browser pool cleaned up');
}

export const imageGenerator = {
    initialize,
    generateImage,
    cleanup,
};
