# AI Tools

A collection of AI-powered tools built with Bun.sh, including:

- LLM API Integration with OpenAI
- DuckDuckGo Search Engine Integration
- Web Scraping Functionality

## Requirements

- Bun.sh
- OpenAI API Key

## Installation

```bash
bun install
```

## Configuration

Create a `.env` file in the root directory with your OpenAI API key:

```env
OPENAI_API_KEY=your_api_key_here
```

## Usage

Development mode with hot reload:
```bash
bun dev
```

Production mode:
```bash
bun start
```

## Project Structure

- `src/llm_api/` - OpenAI API integration
- `src/search_engine/` - DuckDuckGo search functionality
- `src/web_scraper/` - Web scraping utilities
