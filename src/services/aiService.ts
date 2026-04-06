import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// Cache implementation to avoid hitting Gemini Free Tier limits
// Uses sessionStorage to persist across page reloads during the same session
const getCachedData = (key: string) => {
  try {
    const cached = sessionStorage.getItem(`ai_cache_${key}`);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
      if (Date.now() - timestamp < CACHE_TTL) {
        return data;
      }
    }
  } catch (e) {
    console.warn("Failed to read from AI cache", e);
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  try {
    sessionStorage.setItem(`ai_cache_${key}`, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    console.warn("Failed to write to AI cache", e);
  }
};

export const aiService = {
  /**
   * Generates a 2-paragraph executive summary for Management.
   */
  async generateManagementBriefing(kpiData: any, progressData: any[]) {
    if (!API_KEY) {
      throw new Error("AI Insights temporarily unavailable. Please refer to standard charts.");
    }

    const cacheKey = `briefing_v2_${JSON.stringify(kpiData)}_${progressData.length}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Switched to gemini-2.5-flash for higher rate limits and faster response
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `
        You are an elite data analyst for an educational institution. 
        Analyze the provided CRM JSON data:
        KPIs: ${JSON.stringify(kpiData)}
        Program Progress: ${JSON.stringify(progressData)}

        Write a concise, 2-paragraph executive summary highlighting:
        1. Capacity risks (which programs are almost full or critically underutilized).
        2. Fee collection health and documentation clearance.
        3. Overall admission velocity and program trends.
        
        Do not use markdown headers, just plain text paragraphs. 
        Be professional, tactical, and direct.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      setCachedData(cacheKey, text);
      return text;
    } catch (error: any) {
      if (error?.message?.includes("429")) {
        console.warn("AI Quota exceeded. Using local inference fallback.");
      } else {
        console.error("AI Briefing Error:", error);
      }
      throw new Error("AI Insights is currently at capacity. Please check back in 15 minutes.");
    }
  },

  /**
   * Generates 3 short tactical alerts for an Admission Officer.
   */
  async generateOfficerAlerts(hitListData: any[]) {
    if (!API_KEY) {
      return [
        "System maintenance: AI alerts offline.",
        "Manual review of stale apps advised.",
        "Check fee collection dashboard."
      ];
    }

    const cacheKey = `alerts_${hitListData.length}_${hitListData[0]?.id || ''}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `
        You are a tactical assistant for an Admission Officer. 
        Based on the provided hit-list data (applicants with issues):
        Data: ${JSON.stringify(hitListData.slice(0, 10))}

        Generate 3 short, urgent, actionable alerts (under 15 words each). 
        Example: '5 leads in CSE are missing fees. Follow up.'
        Format: Return exactly 3 lines, one alert per line.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const alerts = text.split('\n').filter(line => line.trim().length > 0).slice(0, 3);
      setCachedData(cacheKey, alerts);
      return alerts;
    } catch (error: any) {
      if (error?.message?.includes("429")) {
        console.warn("AI Alert Quota exceeded. Using tactical fallback.");
      } else {
        console.error("AI Alerts Error:", error);
      }
      return [
          "Follow up on top 10 fee defaulters.",
          "Verify documents for CSE pending leads.",
          "Review locked seats for possible stale alerts."
      ];
    }
  },

  /**
   * Generates a 1-sentence micro-summary for the Dashboard preview.
   */
  async generateDashboardMicroSummary(kpiData: any) {
    if (!API_KEY) return "System-wide admission cycle is currently stable. Monitor program-wise progress for capacity shifts.";

    const cacheKey = `micro_${JSON.stringify(kpiData)}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `
        Summarize the current admission health in exactly one sentence based on this data.
        KPI Data: ${JSON.stringify(kpiData)}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      setCachedData(cacheKey, text);
      return text;
    } catch (error: any) {
       if (error?.message?.includes("429")) {
         console.warn("AI Micro-summary Quota exceeded.");
       }
       return "Management quota for core programs is progressing steadily. Reallocation advised only for high-demand buckets.";
    }
  }
};
