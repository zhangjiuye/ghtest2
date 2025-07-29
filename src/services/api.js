// src/services/api.js
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

/**
 * Sends a chat message to the DeepSeek API and returns the response
 * @param {string} message - The user's message to send
 * @param {string} apiKey - The DeepSeek API key
 * @returns {Promise<string>} The AI's response message
 */
export async function sendChatMessage(message, apiKey) {
  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error sending message to DeepSeek API:", error);
    throw error;
  }
}
