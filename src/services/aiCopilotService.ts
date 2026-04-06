import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AICopilotMessage } from '../types/ai.types';
import { aiContextService } from './aiContextService';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const MODEL_NAME = 'gemini-2.5-flash';

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

const buildSystemInstruction = (compiledContextJson: string) =>
  [
    'You are an elite institutional data analyst for the EduMerge CRM.',
    'STRICT SCOPE ENFORCEMENT:',
    '1. Answer ONLY questions relating to the provided EduMerge institutional telemetry.',
    '2. If a user asks a question outside this scope, POLITELY refuse by stating: "I am designed to provide actionable synthesis for your EduMerge parameters. My expertise is strictly focused on your institutional telemetry."',
    '3. At the end of every analysis, suggest ONE highly relevant institutional follow-up question (e.g., "Would you like an aging analysis for the outstanding fees?" or "Shall we check the seat vacancy for specific departments?").',
    '',
    'DATA INTEGRITY:',
    '- Use ONLY the provided live JSON state.',
    '- Do not invent metrics or facts.',
    '- Use professional, concise, and institutional language.',
    '',
    `LIVE CRM STATE: ${compiledContextJson}`,
  ].join('\n');

export const aiCopilotService = {
  async streamChatResponse(
    userPrompt: string, 
    chatHistory: AICopilotMessage[],
    onChunk: (text: string) => void
  ) {
    const prompt = userPrompt.trim();

    if (!prompt) {
      throw new Error('Ask a question before starting the copilot.');
    }

    if (!genAI) {
      throw new Error('AI Copilot is unavailable because the Gemini API key is missing.');
    }

    try {
      const { contextJson } = await aiContextService.compileSystemContext();
      const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        systemInstruction: buildSystemInstruction(contextJson),
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
        },
      });

      // Transform history for Gemini API
      // Exclude the current user message and the system greeting if necessary
      const history = chatHistory
        .filter(m => m.id !== 'ai-copilot-welcome')
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        }));

      const chat = model.startChat({
        history: history,
      });

      const streamResult = await chat.sendMessageStream(prompt);
      let finalText = '';

      for await (const chunk of streamResult.stream) {
        const text = chunk.text();
        if (!text) continue;

        finalText += text;
        onChunk(text);
      }

      return finalText.trim();
    } catch (error) {
      console.error('AI Copilot streaming failed', error);
      throw new Error('AI Copilot could not stream a response right now.');
    }
  },
};
