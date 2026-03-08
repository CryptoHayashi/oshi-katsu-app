import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

// Serper API (Search Engine)
const SERPER_API_KEY = process.env.SERPER_API_KEY;
// Gemini API Key
const LLM_API_KEY = process.env.LLM_API_KEY;

/**
 * Perform a web search using Serper
 */
async function performWebSearch(query) {
    if (!SERPER_API_KEY) {
        console.warn("SERPER_API_KEY is missing. Add it to .env to enable real search.");
        return [];
    }

    try {
        const response = await axios.post('https://google.serper.dev/search', {
            q: query,
            gl: 'jp',
            hl: 'ja'
        }, {
            headers: {
                'X-API-KEY': SERPER_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        return response.data.organic || [];
    } catch (error) {
        console.error("Search error:", error.message);
        return [];
    }
}

/**
 * Fetch and extract text from a URL
 */
async function fetchPageContent(url) {
    try {
        const { data } = await axios.get(url, {
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);
        $('script, style, nav, footer, header').remove();

        return $('body').text()
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 5000);
    } catch (error) {
        console.warn(`Could not fetch ${url}:`, error.message);
        return "";
    }
}

/**
 * Use Gemini to summarize and verify the gathered information
 */
async function summarizeWithAI(oshiName, combinedContent) {
    if (!LLM_API_KEY) {
        console.warn("LLM_API_KEY is missing. Add it to .env to enable AI-powered deep research.");
        return null;
    }

    try {
        const genAI = new GoogleGenerativeAI(LLM_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            あなたは推し活を爆速化させる「AIリサーチエージェント」です。
            以下の検索結果（生のテキストデータ）を詳細に分析し、${oshiName} さんの最新情報を正確に抽出してください。

            ### 重要な指示:
            1. 複数のサイト情報を比較し、最新の情報（2026年時点）を優先してください。
            2. 嘘や古い情報が混じっている可能性があるため、信憑性を照合して要約してください。
            3. 以下のJSONフォーマットで出力してください。

            ### 要件:
            - recentStatus: 直近3ヶ月の活動。具体的な内容と箇条書き。
            - upcomingPlans: 2026年以降の予定。日付、時間、タイトル、場所、料金、チケット販売URL。
            - rumors: 噂や未確定情報。必ず理由を添える。
            - 全ての項目に、情報の出所（サイト名とURL）を sources 配列として含めること。

            ### 出力形式 (JSONのみ):
            {
              "recentStatus": { 
                "summary": "...", 
                "details": ["...", "..."], 
                "sources": [{ "title": "...", "url": "..." }] 
              },
              "upcomingPlans": [
                { 
                  "date": "...", 
                  "time": "...", 
                  "title": "...", 
                  "location": "...", 
                  "price": "...", 
                  "description": "...", 
                  "ticketUrl": "...",
                  "sources": [{ "title": "...", "url": "..." }] 
                }
              ],
              "rumors": { 
                "content": "...", 
                "sources": [{ "title": "...", "url": "..." }] 
              }
            }

            検索結果データ:
            ${combinedContent.substring(0, 20000)}
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // JSONを抽出
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found in AI response");

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error("AI Summarization error:", error);
        return null;
    }
}

/**
 * The main deep research function
 */
export async function deepResearch(oshiName) {
    console.log(`Deep Researching for: ${oshiName}...`);

    // 1. ウェブ検索 (Serper)
    const searchQuery = `${oshiName} 最新情報 2026 ライブ 近況 舞台 噂 チケット`;
    const searchResults = await performWebSearch(searchQuery);

    if (searchResults.length === 0 && !LLM_API_KEY) return null;

    // 2. 上位サイトの情報を取得
    let combinedContent = "";
    for (const res of searchResults.slice(0, 5)) {
        const text = await fetchPageContent(res.link);
        if (text) {
            combinedContent += `\n\n--- Source: ${res.title} (URL: ${res.link}) ---\n${text}`;
        }
    }

    // 3. AIによる精査・要約
    const aiResult = await summarizeWithAI(oshiName, combinedContent);

    if (aiResult) {
        return { ...aiResult, name: oshiName };
    }

    return null; // キーがない場合は index.js のモックへ
}
