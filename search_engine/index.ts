// Search engine module using DuckDuckGo
import { parse } from 'node-html-parser';

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
        const root = parse(html);
        const results: SearchResult[] = [];

        // Find all result blocks
        const resultBlocks = root.querySelectorAll('.result__body');

        for (let i = 0; i < Math.min(maxResults, resultBlocks.length); i++) {
            const block = resultBlocks[i];
            
            // Find elements by class names
            const linkElement = block.querySelector('.result__a');
            const snippetElement = block.querySelector('.result__snippet');

            if (linkElement && snippetElement) {
                const url = linkElement.getAttribute('href') || '';
                const title = linkElement.text.trim();
                const snippet = snippetElement.text.trim();

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
