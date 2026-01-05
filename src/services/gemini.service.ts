
import { Injectable } from '@angular/core';
import { GoogleGenAI } from "@google/genai";

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // Initialize Gemini client with process.env.API_KEY
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async generateResponse(history: {role: string, content: string}[], prompt: string): Promise<string> {
    try {
      // The history passed from the component includes the current prompt as the last message.
      // We need to separate past history from the current new message for the API.
      let pastHistory = history;
      
      // If the last message in history matches the current prompt and is from the user, remove it
      // so we don't duplicate it in the chat history initialization.
      if (history.length > 0) {
        const lastMsg = history[history.length - 1];
        if (lastMsg.role === 'user' && lastMsg.content === prompt) {
          pastHistory = history.slice(0, -1);
        }
      }

      // Map internal history format to Gemini SDK format
      const formattedHistory = pastHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Initialize a chat session with the previous history
      const chat = this.ai.chats.create({
        model: 'gemini-2.5-flash',
        history: formattedHistory,
        config: {
          systemInstruction: "You are a helpful AI assistant in a credit-based chat app. Keep answers concise.",
        }
      });

      // Send the new message to the model
      const response = await chat.sendMessage({
        message: prompt
      });

      return response.text || "I couldn't generate a response.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Sorry, I encountered an error processing your request. Please try again.";
    }
  }
}
