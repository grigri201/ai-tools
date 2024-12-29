import { scrapeUrls } from './index';

async function test() {
    try {
        const results = await scrapeUrls([
            'https://example.com',
            'https://example.org'
        ], {
            maxConcurrent: 2,
            timeout: 30000
        });
        
        results.forEach(result => {
            console.log(`\n=== Content from ${result.url} ===`);
            if (result.error) {
                console.error(`Error: ${result.error}`);
            } else {
                console.log(result.content);
            }
            console.log("=".repeat(80));
        });
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

test();
