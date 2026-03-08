/**
 * Client-side Live Research Engine
 * Fetches real-time search results directly via DuckDuckGo (HTML)
 * to avoid API costs.
 */

const CORS_PROXY = "https://api.allorigins.win/get?url=";

export interface LiveSearchResult {
    title: string;
    url: string;
    snippet: string;
    sourceType: 'official' | 'news' | 'social' | 'ticket' | 'other';
}

/**
 * Perform real-time search and categorize results
 */
export async function performLiveWebSearch(oshiName: string): Promise<LiveSearchResult[]> {
    const query = `${oshiName} 最新情報 2026 ライブ 舞台 チケット SNS`;
    // DuckDuckGoのHTML版（軽量・解析しやすい）を利用
    const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(`${CORS_PROXY}${encodeURIComponent(searchUrl)}`);
        const data = await response.json();
        const html = data.contents;

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const results: LiveSearchResult[] = [];

        const searchItems = doc.querySelectorAll('.result');

        searchItems.forEach((item, index) => {
            if (index >= 12) return; // 上位12件程度

            const titleEl = item.querySelector('.result__title a');
            const snippetEl = item.querySelector('.result__snippet');

            if (titleEl && snippetEl) {
                const title = titleEl.textContent?.trim() || "";
                const url = (titleEl as HTMLAnchorElement).href || "";
                const snippet = snippetEl.textContent?.trim() || "";

                // 簡易的なカテゴリ判定
                let sourceType: LiveSearchResult['sourceType'] = 'other';
                const lowUrl = url.toLowerCase();
                const lowTitle = title.toLowerCase();

                if (lowUrl.includes('twitter.com') || lowUrl.includes('x.com') || lowUrl.includes('instagram.com')) {
                    sourceType = 'social';
                } else if (lowUrl.includes('pia.jp') || lowUrl.includes('l-tike.com') || lowUrl.includes('eplus.jp')) {
                    sourceType = 'ticket';
                } else if (lowUrl.includes('natalie.mu') || lowUrl.includes('oricon.co.jp') || lowUrl.includes('news')) {
                    sourceType = 'news';
                } else if (lowTitle.includes('公式') || lowTitle.includes('official')) {
                    sourceType = 'official';
                }

                results.push({ title, url, snippet, sourceType });
            }
        });

        return results;
    } catch (error) {
        console.error("Live Search failed:", error);
        return [];
    }
}
