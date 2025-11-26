import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';
import { ImageRequest } from '../types';

// Module-level state (functional style)
let browserPool: Browser[] = [];
let availableBrowsers: Browser[] = [];
let poolSize: number = parseInt(process.env.BROWSER_POOL_SIZE || '3', 10);
let isInitialized = false;
const templateCache: Map<string, string> = new Map();

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

function loadTemplate(templateName: string): string {
    if (templateCache.has(templateName)) {
        return templateCache.get(templateName)!;
    }

    const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.html`);
    const template = fs.readFileSync(templatePath, 'utf-8');
    templateCache.set(templateName, template);
    return template;
}

function injectData(template: string, data: ImageRequest): string {
    return template.replace('{{DATA_PLACEHOLDER}}', JSON.stringify(data));
}

async function generateImage(
    data: ImageRequest,
    width: number = 1200,
    height: number = 630
): Promise<Buffer> {
    if (!isInitialized) {
        await initialize();
    }

    const browser = await getBrowser();
    let page: Page | null = null;

    try {
        Logger.debug('Generating image', { type: data.type, id: data.id });

        const template = loadTemplate('goal');
        const html = injectData(template, data);

        page = await browser.newPage();
        await page.setViewport({ width, height });

        await page.setContent(html, {
            waitUntil: ['networkidle0', 'load'],
        });

        // Allow fonts/images to settle
        await new Promise(resolve => setTimeout(resolve, 500));

        const screenshot = await page.screenshot({ type: 'png', fullPage: false });

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
    templateCache.clear();

    Logger.info('Browser pool cleaned up');
}

export const imageGenerator = {
    initialize,
    generateImage,
    cleanup,
};
