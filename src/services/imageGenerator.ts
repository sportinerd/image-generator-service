import puppeteer, { Browser, Page } from 'puppeteer';
import { Logger } from '../utils/logger';
import { ImageRequest } from '../types';
import { getGoalHtmlTemplate } from '../templates/goalTemplate';

// Module-level state (functional style)
let browserPool: Browser[] = [];
let availableBrowsers: Browser[] = [];
let poolSize: number = parseInt(process.env.BROWSER_POOL_SIZE || '3', 10);
let isInitialized = false;

async function initialize(size?: number): Promise<void> {
    if (isInitialized) return;

    if (typeof size === 'number' && size > 0) {
        poolSize = size;
    }

    Logger.info('Initializing browser pool', { poolSize });

    try {
        for (let i = 0; i < poolSize; i++) {
            const browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                ],
            });
            browserPool.push(browser);
            availableBrowsers.push(browser);
            Logger.debug(`Browser ${i + 1} launched`);
        }

        isInitialized = true;
        Logger.info('Browser pool initialized successfully');
    } catch (error) {
        Logger.error('Failed to initialize browser pool', { error });
        throw error;
    }
}

async function getBrowser(): Promise<Browser> {
    while (availableBrowsers.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return availableBrowsers.pop()!;
}

function releaseBrowser(browser: Browser): void {
    availableBrowsers.push(browser);
}



async function generateImage(
    data: ImageRequest,
    width: number = 900,
    height: number = 900
): Promise<Buffer> {
    if (!isInitialized) {
        await initialize();
    }

    const browser = await getBrowser();
    let page: Page | null = null;

    try {
        Logger.debug('Generating image', { type: data.type, id: data.id });

        // Generate HTML content using the function-based template
        const html = getGoalHtmlTemplate(data);

        page = await browser.newPage();
        // Set deviceScaleFactor for higher resolution screenshots
        await page.setViewport({ width, height, deviceScaleFactor: 2 });

        await page.setContent(html, {
            waitUntil: ['networkidle2', 'domcontentloaded'],
            timeout: 60000
        });

        // Allow fonts/images to settle
        await new Promise(resolve => setTimeout(resolve, 500));

        const screenshot = await page.screenshot({
            type: 'png',
            fullPage: true, // Capture the full styled body
            omitBackground: true
        });

        Logger.info('Image generated successfully', { type: data.type, id: data.id });
        return screenshot as Buffer;
    } catch (error) {
        Logger.error('Failed to generate image', { error, type: data.type, id: data.id });
        throw error;
    } finally {
        if (page) await page.close();
        releaseBrowser(browser);
    }
}

async function cleanup(): Promise<void> {
    Logger.info('Cleaning up browser pool');

    for (const browser of browserPool) {
        try {
            await browser.close();
        } catch (error) {
            Logger.error('Error closing browser', { error });
        }
    }

    browserPool = [];
    availableBrowsers = [];
    isInitialized = false;


    Logger.info('Browser pool cleaned up');
}

export const imageGenerator = {
    initialize,
    generateImage,
    cleanup,
};
