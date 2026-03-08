/**
 * Client-side Research Engine (Option 2)
 * Runs entirely in the user's browser to avoid server-side API costs.
 */

const CORS_PROXY = "https://api.allorigins.win/get?url=";

/**
 * Scraping a search engine (DuckDuckGo or Google) via Proxy
 */
async function searchWeb(query: string) {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    try {
        const response = await fetch(`${CORS_PROXY}${encodeURIComponent(searchUrl)}`);
        const data = await response.json();
        const html = data.contents;

        // Parse HTML to find links (Simplified regex for demonstration)
        const links: { title: string; url: string }[] = [];
        const urlRegex = /href="\/url\?q=(https?:\/\/[^"&]+)/g;
        let match;
        while ((match = urlRegex.exec(html)) !== null && links.length < 5) {
            const url = decodeURIComponent(match[1]);
            if (!url.includes("google.com")) {
                links.push({ title: "検索結果から取得", url });
            }
        }
        return links;
    } catch (error) {
        console.error("Search failed:", error);
        return [];
    }
}

/**
 * Fetch and extract text from a URL via Proxy
 */
async function fetchPage(url: string) {
    try {
        const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
        const data = await response.json();
        const html = data.contents;

        // Simple HTML to Text
        const doc = new DOMParser().parseFromString(html, "text/html");
        // Remove scripts and styles
        doc.querySelectorAll("script, style, nav, footer, header").forEach(el => el.remove());
        return doc.body.innerText.replace(/\s+/g, " ").trim().substring(0, 3000);
    } catch (error) {
        console.error(`Fetch failed for ${url}:`, error);
        return "";
    }
}

/**
 * Summarize using Browser Built-in AI (Window AI / Gemini Nano)
 */
async function summarizeWithWindowAI(oshiName: string, content: string) {
    // @ts-ignore: window.ai is experimental
    if (typeof window.ai === "undefined" || !window.ai.canCreateTextSession) {
        console.warn("Window AI (Gemini Nano) is not available.");
        return null;
    }

    try {
        // @ts-ignore
        const session = await window.ai.createTextSession();
        const prompt = `
      以下のテキストを読み取り、${oshiName}さんの最新情報をJSON形式で要約してください。
      
      フォーマット:
      {
        "recentStatus": { "summary": "...", "details": ["..."] },
        "upcomingPlans": [{ "date": "...", "title": "...", "location": "...", "price": "...", "description": "...", "ticketUrl": "..." }],
        "rumors": { "content": "..." }
      }
      
      内容:
      ${content}
    `;
        const result = await session.prompt(prompt);
        session.destroy();

        // JSONを抽出
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (error) {
        console.error("AI Summarization failed:", error);
        return null;
    }
}

/**
 * Main Deep Research Logic (Client-side)
 */
export async function performClientSideResearch(oshiName: string) {
    const query = `${oshiName} 最新情報 2026 ライブ 近況 舞台 噂 チケット`;

    // 1. Search
    const results = await searchWeb(query);
    if (results.length === 0) return null;

    // 2. Fetch snippets from top results
    let combinedText = "";
    for (const res of results.slice(0, 2)) {
        const text = await fetchPage(res.url);
        combinedText += `\nSource: ${res.url}\n${text}\n`;
    }

    // 3. AI Summarization (If available)
    const aiResult = await summarizeWithWindowAI(oshiName, combinedText);
    if (aiResult) {
        // Add sources
        aiResult.recentStatus.sources = results.slice(0, 3).map(r => ({ title: "Web検索結果", url: r.url }));
        return aiResult;
    }

    // AIが使えない場合のフォールバック（簡易要約）
    return {
        recentStatus: {
            summary: "ブラウザ内蔵AIが未有効のため、検索結果の抜粋を表示します。Chromeの試験運用機能で 'Prompt API' を有効にするとAI要約が動作します。",
            details: results.map(r => `情報元を確認: ${r.url.substring(0, 50)}...`),
            sources: results.map(r => ({ title: "Webサイト", url: r.url }))
        },
        upcomingPlans: [],
        rumors: { content: "リサーチ結果の詳細を確認するにはAI機能の有効化が必要です。" }
    };
}
