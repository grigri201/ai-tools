import OpenAI from 'openai';

interface LLMResponse {
    content: string | null;
    error?: string;
}

export function createLLMClient(): OpenAI {
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
}

export async function queryLLM(
    prompt: string,
    model: string = "o1"
): Promise<LLMResponse> {
    const client = createLLMClient();
    try {
        const response = await client.chat.completions.create({
            model,
            messages: [
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
        });
        
        return {
            content: response.choices[0].message.content
        };
    } catch (error) {
        console.error("Error querying LLM:", error);
        console.log("Note: If you haven't configured a local LLM server, this error is expected and can be ignored.");
        console.log("The LLM functionality is optional and won't affect other features.");
        
        return {
            content: null,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}