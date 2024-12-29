// Web scraper module
import { chromium } from 'playwright';
import type { Browser, BrowserContext, Page } from 'playwright';
import { parse } from 'node-html-parser';
import { URL } from 'url';

export interface ScraperOptions {
    selector?: string;
    timeout?: number;
    userAgent?: string;
    maxConcurrent?: number;
}

export interface ScrapedContent {
    url: string;
    title: string;
    content: string;
    error?: string;
}

// Configure logging
const logger = {
    info: (msg: string) => console.log(`[INFO] ${msg}`),
    error: (msg: string) => console.error(`[ERROR] ${msg}`),
    debug: (msg: string) => console.debug(`[DEBUG] ${msg}`)
};

async function fetchPage(url: string, context: BrowserContext): Promise<string | null> {
    const page: Page = await context.newPage();
    try {
        logger.info(`Fetching ${url}`);
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        const content = await page.content();
        logger.info(`Successfully fetched ${url}`);
        return content;
    } catch (error) {
        logger.error(`Error fetching ${url}: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    } finally {
        await page.close();
    }
}

function parseHtml(htmlContent: string | null): string {
    if (!htmlContent) return "";

    try {
        const root = parse(htmlContent);
        const result: string[] = [];
        const seenTexts = new Set<string>();

        const shouldSkipElement = (elem: any): boolean => {
            if (elem.tagName === 'SCRIPT' || elem.tagName === 'STYLE') {
                return true;
            }
            const text = elem.text?.trim();
            return !text;
        };

        const processElement = (elem: any, depth = 0): void => {
            if (shouldSkipElement(elem)) {
                return;
            }

            const text = elem.text?.trim();
            if (text && !seenTexts.has(text)) {
                if (elem.tagName === 'A') {
                    const href = elem.getAttribute('href');
                    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                        const linkText = `[${text}](${href})`;
                        result.push('  '.repeat(depth) + linkText);
                        seenTexts.add(text);
                    }
                } else {
                    result.push('  '.repeat(depth) + text);
                    seenTexts.add(text);
                }
            }

            for (const child of elem.childNodes) {
                processElement(child, depth + 1);
            }
        }

        const body = root.querySelector('body');
        if (body) {
            processElement(body);
        } else {
            processElement(root);
        }

        // Filter out unwanted patterns
        return result
            .filter(line => !(/var |function\(\)|\.js|\.css|google-analytics|disqus|\{|\}/i.test(line)))
            .join('\n');

    } catch (error) {
        logger.error(`Error parsing HTML: ${error instanceof Error ? error.message : String(error)}`);
        return "";
    }
}

function validateUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return Boolean(parsed.protocol && parsed.host);
    } catch {
        return false;
    }
}

export async function scrapeUrls(
    urls: string[],
    options: ScraperOptions = {}
): Promise<ScrapedContent[]> {
    const maxConcurrent = options.maxConcurrent || 5;
    const timeout = options.timeout || 30000;
    const userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124';

    // Validate URLs first
    const validUrls = urls.filter(url => {
        const isValid = validateUrl(url);
        if (!isValid) {
            logger.error(`Invalid URL: ${url}`);
        }
        return isValid;
    });

    if (validUrls.length === 0) {
        throw new Error("No valid URLs provided");
    }

    const browser: Browser = await chromium.launch();
    const results: ScrapedContent[] = [];

    try {
        // Create browser contexts
        const numContexts = Math.min(validUrls.length, maxConcurrent);
        const contexts: BrowserContext[] = await Promise.all(
            Array(numContexts).fill(0).map(() => 
                browser.newContext({ userAgent })
            )
        );

        // Process URLs in batches
        for (let i = 0; i < validUrls.length; i += maxConcurrent) {
            const batch = validUrls.slice(i, i + maxConcurrent);
            const batchPromises = batch.map((url, index) => {
                const context = contexts[index % contexts.length];
                return fetchPage(url, context);
            });

            const htmlContents = await Promise.all(batchPromises);

            // Parse HTML contents
            batch.forEach((url, index) => {
                const content = parseHtml(htmlContents[index]);
                results.push({
                    url,
                    title: url, // You might want to extract the actual title from the HTML
                    content,
                    error: htmlContents[index] === null ? 'Failed to fetch page' : undefined
                });
            });
        }

        // Cleanup contexts
        await Promise.all(contexts.map(context => context.close()));

    } finally {
        await browser.close();
    }

    return results;
}

// Example usage:
// async function main() {
//     try {
//         const urls = [
//             'https://example.com',
//             'https://example.org'
//         ];
//         const results = await scrapeUrls(urls, {
//             maxConcurrent: 5,
//             timeout: 30000
//         });
//         
//         results.forEach(result => {
//             console.log(`\n=== Content from ${result.url} ===`);
//             console.log(result.content);
//             console.log("=".repeat(80));
//         });
//     } catch (error) {
//         console.error('Error:', error);
//         process.exit(1);
//     }
// }
