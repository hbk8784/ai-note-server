import dotenv from "dotenv";

dotenv.config();

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class AIService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable is required");
    }
  }

  async generateNoteSummary(content: string): Promise<string> {
    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "AI Notes",
          },
          body: JSON.stringify({
            model: "deepseek/deepseek-chat-v3-0324:free",
            messages: [
              {
                role: "user",
                content: `Summarize the following content concisely in about 60 words:\n\n${content}`,
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as any;
        throw new Error(
          `API Error: ${errorData.error?.message || response.statusText}`
        );
      }

      const data = (await response.json()) as OpenRouterResponse;
      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error generating summary:", error);
      throw new Error(`Failed to generate summary: ${error}`);
    }
  }
}
