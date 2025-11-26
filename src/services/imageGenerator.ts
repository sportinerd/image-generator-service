import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';
import { ImageRequest } from '../types';

class ImageGeneratorService {
    private browserPool: Browser[] = [];
    private availableBrowsers: Browser[] = [];
    private poolSize: number;
    private isInitialized: boolean = false;
    private templateCache: Map<string, string> = new Map();

    constructor(poolSize: number = 3) {
        this.poolSize = poolSize;
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        Logger.info('Initializing browser pool', { poolSize: this.poolSize });

        try {
            for (let i = 0; i < this.poolSize; i++) {
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
                this.browserPool.push(browser);
                this.availableBrowsers.push(browser);
                Logger.debug(`Browser ${i + 1} launched`);
            }

            this.isInitialized = true;
            Logger.info('Browser pool initialized successfully');
        } catch (error) {
            Logger.error('Failed to initialize browser pool', { error });
            throw error;
        }
    }

    private async getBrowser(): Promise<Browser> {
        // Wait for an available browser
        while (this.availableBrowsers.length === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const browser = this.availableBrowsers.pop()!;
        return browser;
    }

    private releaseBrowser(browser: Browser): void {
        this.availableBrowsers.push(browser);
    }

    private loadTemplate(templateName: string): string {
        if (this.templateCache.has(templateName)) {
            return this.templateCache.get(templateName)!;
        }

        const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.html`);
        const template = fs.readFileSync(templatePath, 'utf-8');
        this.templateCache.set(templateName, template);
        return template;
    }

    private injectData(template: string, data: ImageRequest): string {
        // Replace the placeholder with actual JSON data
        return template.replace('{{DATA_PLACEHOLDER}}', JSON.stringify(data));
    }

    async generateImage(
        data: ImageRequest,
        width: number = 1200,
        height: number = 630
    ): Promise<Buffer> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const browser = await this.getBrowser();
        let page: Page | null = null;

        try {
            Logger.debug('Generating image', { type: data.type, id: data.id });

            // Load and inject data into template
            const template = this.loadTemplate('goal');
            const html = this.injectData(template, data);

            // Create new page
            page = await browser.newPage();
            await page.setViewport({ width, height });

            // Set content and wait for images to load
            await page.setContent(html, {
                waitUntil: ['networkidle0', 'load'],
            });

            // Wait a bit for fonts to load
            await new Promise(resolve => setTimeout(resolve, 500));

            // Take screenshot
            const screenshot = await page.screenshot({
                type: 'png',
                fullPage: false,
            });

            Logger.info('Image generated successfully', { type: data.type, id: data.id });

            return screenshot as Buffer;
        } catch (error) {
            Logger.error('Failed to generate image', { error, type: data.type, id: data.id });
            throw error;
        } finally {
            if (page) {
                await page.close();
            }
            this.releaseBrowser(browser);
        }
    }

    async cleanup(): Promise<void> {
        Logger.info('Cleaning up browser pool');

        for (const browser of this.browserPool) {
            try {
                await browser.close();
            } catch (error) {
                Logger.error('Error closing browser', { error });
            }
        }

        this.browserPool = [];
        this.availableBrowsers = [];
        this.isInitialized = false;
        this.templateCache.clear();

        Logger.info('Browser pool cleaned up');
    }
}

export const imageGenerator = new ImageGeneratorService(
    parseInt(process.env.BROWSER_POOL_SIZE || '3', 10)
);
