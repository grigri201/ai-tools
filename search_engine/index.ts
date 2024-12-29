// Search engine module using DuckDuckGo
export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
}

export interface SearchEngineOptions {
    maxResults?: number;
    timeout?: number;
}

class SearchError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SearchError';
    }
}

/**
 * Search using DuckDuckGo and return results with URLs and text snippets.
 * Uses a simple fetch-based approach to query DuckDuckGo.
 * 
 * @param query Search query string
 * @param options Search options including maxResults
 * @returns Promise<SearchResult[]> Array of search results
 * @throws SearchError if the search fails
 */
export async function search(
    query: string,
    options: SearchEngineOptions = {}
): Promise<SearchResult[]> {
    const maxResults = options.maxResults || 10;
    const timeout = options.timeout || 10000; // 10 seconds default timeout

    try {
        console.debug(`Searching for query: ${query}`);

        const response = await fetch(
            `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                signal: AbortSignal.timeout(timeout)
            }
        );

        if (!response.ok) {
            throw new SearchError(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        const results: SearchResult[] = [];

        // Use regex to find all result blocks
        const resultBlocks = html.match(/<div class="links_main links_deep result__body">[\s\S]*?<div class="clear"><\/div>/g) || [];

        for (let i = 0; i < Math.min(maxResults, resultBlocks.length); i++) {
            const block = resultBlocks[i];
            
            // Extract URL and title from result__a
            const linkMatch = block.match(/<a[^>]*?class="result__a"[^>]*?href="([^"]*)"[^>]*?>([^<]*)<\/a>/);
            
            // Extract snippet from result__snippet
            const snippetMatch = block.match(/<a[^>]*?class="result__snippet"[^>]*?>([^<]*)<\/a>/);

            if (linkMatch && snippetMatch) {
                const url = linkMatch[1];
                const title = linkMatch[2].trim();
                const snippet = snippetMatch[1].replace(/&lt;[^>]*&gt;/g, '').trim();

                results.push({
                    url,
                    title,
                    snippet
                });
            }
        }

        console.debug(`Found ${results.length} results`);
        return results;

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`Search failed: ${errorMessage}`);
        if (error instanceof Error) {
            console.error(`Error type: ${error.constructor.name}`);
            console.error(error.stack);
        }
        throw new SearchError(`Search failed: ${errorMessage}`);
    }
}

// Example usage:
// async function main() {
//     try {
//         const results = await search("TypeScript programming", { maxResults: 5 });
//         results.forEach((result, index) => {
//             console.log(`\n=== Result ${index + 1} ===`);
//             console.log(`URL: ${result.url}`);
//             console.log(`Title: ${result.title}`);
//             console.log(`Snippet: ${result.snippet}`);
//         });
//     } catch (error) {
//         console.error(error);
//         process.exit(1);
//     }
// }
