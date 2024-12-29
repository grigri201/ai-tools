#!/usr/bin/env bun

import { Command } from 'commander';
import { scrapeUrls } from './web_scraper/index';
import { search } from './search_engine/index';
import { queryLLM } from './llm_api/index';

const program = new Command();

program
  .name('ai-tools')
  .description('AI-powered tools for web scraping, searching, and LLM interactions')
  .version('1.0.0');

// Scrape command
program
  .command('scrape')
  .description('Scrape content from specified URLs')
  .argument('<urls...>', 'URLs to scrape (space-separated)')
  .option('-c, --concurrent <number>', 'Maximum concurrent scraping operations', '5')
  .action(async (urls: string[], options) => {
    try {
      const results = await scrapeUrls(urls, {
        maxConcurrent: parseInt(options.concurrent)
      });
      console.log(JSON.stringify(results, null, 2));
    } catch (error) {
      console.error('Error during scraping:', error);
      process.exit(1);
    }
  });

// Search command
program
  .command('search')
  .description('Search using DuckDuckGo')
  .argument('<query>', 'Search query')
  .option('-m, --max-results <number>', 'Maximum number of results', '10')
  .option('-t, --timeout <number>', 'Timeout in milliseconds', '10000')
  .action(async (query: string, options) => {
    try {
      const results = await search(query, {
        maxResults: parseInt(options.maxResults),
        timeout: parseInt(options.timeout)
      });
      console.log(JSON.stringify(results, null, 2));
    } catch (error) {
      console.error('Error during search:', error);
      process.exit(1);
    }
  });

// LLM command
program
  .command('ask')
  .description('Query the LLM API')
  .argument('<prompt>', 'The prompt to send to the LLM')
  .option('-m, --model <string>', 'Model to use', 'o1')
  .action(async (prompt: string, options) => {
    try {
      const response = await queryLLM(prompt, options.model);
      if (response.error) {
        throw new Error(response.error);
      }
      console.log(response.content);
    } catch (error) {
      console.error('Error querying LLM:', error);
      process.exit(1);
    }
  });

program.parse();
