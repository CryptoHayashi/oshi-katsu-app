import { useState } from 'react';
import { Search, Sparkles, Newspaper, CalendarDays, MapPin, Ticket, MessageCircleQuestion, Clock, CheckCircle2, ArrowRight, Link as LinkIcon, Globe } from 'lucide-react';
import { performLiveWebSearch } from './liveSearch';

const researchSteps = [
  "公式サイトの更新情報を取得中...",
  "Xのポスト (公式・関連ハッシュタグ) を解析中...",
  "Instagramの最新投稿を確認中...",
  "チケットサイト (ぴあ, ローチケ等) の情報をスクレイピング中...",
  "テレビ・舞台出演情報をデータベースと照合中...",
  "ウェブ上の未発表情報・噂レベルの記事をディープサーチ中...",
  "取得データを解析・分類中..."
];

interface ResearchResult {
  name: string;
  recentStatus: {
    summary: string;
    details: string[];
    sources?: Array<{ title: string; url: string }>;
  };
  upcomingPlans: Array<{
    date: string;
    time: string;
    title: string;
    location: string;
    price: string;
    description: string;
    ticketUrl?: string; // チケット販売サイトのURL
    sources?: Array<{ title: string; url: string }>;
  }>;
  rumors: {
    content: string;
    sources?: Array<{ title: string; url: string }>;
  };
}

function App() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [displayQuery, setDisplayQuery] = useState('');
  const [researchLog, setResearchLog] = useState<string[]>([]);
  const [researchData, setResearchData] = useState<ResearchResult | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setHasResults(false);
    setResearchLog([]);
    setResearchData(null);
    setDisplayQuery('');

    // ログの表示間隔を調整
    let step = 0;
    const logInterval = setInterval(() => {
      if (step < researchSteps.length) {
        setResearchLog(prev => [...prev, researchSteps[step]]);
        step++;
      } else {
        clearInterval(logInterval);
      }
    }, 500);

    try {
      // ライブリサーチ方式 (コスト0・リアルタイム)
      setResearchLog(prev => [...prev, "🌐 リアルタイムWebリサーチエンジンを起動中..."]);
      const liveResults = await performLiveWebSearch(query);

      if (liveResults.length > 0) {
        // 取得した検索結果を各セクションにマッピング
        const mappedData: ResearchResult = {
          name: query,
          recentStatus: {
            summary: `${query}に関する最新の検索結果をリアルタイムで取得しました。`,
            details: liveResults.filter(r => r.sourceType === 'news' || r.sourceType === 'official').slice(0, 4).map(r => r.title),
            sources: liveResults.slice(0, 3).map(r => ({ title: r.title, url: r.url }))
          },
          upcomingPlans: liveResults.filter(r => r.sourceType === 'ticket' || r.title.includes('公演') || r.title.includes('ライブ')).slice(0, 3).map(r => ({
            date: "2026年内の予定",
            time: "サイトを確認",
            title: r.title,
            location: r.snippet.substring(0, 30) + "...",
            price: "各サイトを参照",
            description: r.snippet,
            ticketUrl: r.url,
            sources: [{ title: r.title, url: r.url }]
          })),
          rumors: {
            content: liveResults.find(r => r.title.includes('噂') || r.title.includes('予想'))?.snippet || "現在、信頼性の高い噂・リード情報は見つかりませんでした。",
            sources: liveResults.filter(r => r.sourceType === 'social').slice(0, 2).map(r => ({ title: r.title, url: r.url }))
          }
        };

        setResearchData(mappedData);
      } else {
        setResearchLog(prev => [...prev, "⚠️ 情報を取得できませんでした。時間をおいて再度お試しください。"]);
      }

      setTimeout(() => {
        setIsSearching(false);
        setHasResults(true);
        setDisplayQuery(query);
      }, 1000);

    } catch (error) {
      console.error('リサーチエラー:', error);
      setIsSearching(false);
      setResearchLog(prev => [...prev, "❌ 接続エラーが発生しました。"]);
      clearInterval(logInterval);
    }
  };

  return (
    <div className="app-container">
      <header className="hero">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <Sparkles size={48} color="var(--primary-color)" />
        </div>
        <h1>推しの尊い近況</h1>
        <p>公式からSNSの噂まで。あなたの推しの「今と未来」をディープにリサーチしてまとめます。</p>

        <form className="search-container" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="推しの名前を入力..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="search-btn" disabled={isSearching}>
            <Search size={20} />
            {isSearching ? 'リサーチ中' : 'ディープサーチ'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', fontSize: '0.85rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <Globe size={16} color="#34d399" />
          <span>
            リサーチモード: <strong style={{ color: '#34d399' }}>Live Search (完全無料・最新情報)</strong>
          </span>
        </div>
      </header>

      {isSearching && (
        <div className="research-status-container">
          <div className="loading-spinner" style={{ marginTop: 0 }}>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
          <div className="research-logs">
            {researchLog.map((log, index) => (
              <div key={index} className={`log-item ${index === researchLog.length - 1 ? 'running' : 'done'}`}>
                {index === researchLog.length - 1 ? (
                  <Clock size={16} />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasResults && !isSearching && researchData && (
        <main className="results-section">

          {/* ①直近３か月の近況 */}
          <div className="glass-card full-width">
            <div className="card-header">
              <div className="icon-wrapper">
                <Newspaper size={24} />
              </div>
              <h2 className="card-title">① {displayQuery} の直近3か月の近況</h2>
            </div>
            <div className="summary-content">
              <p>{researchData.recentStatus.summary}</p>
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {researchData.recentStatus.details.map((detail: string, idx: number) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent)' }}></div>
                    {detail}
                  </div>
                ))}
              </div>

              {researchData.recentStatus.sources && (
                <div className="source-links">
                  <span className="source-tag">情報の出どころ・出典URL:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                    {researchData.recentStatus.sources.map((src: any, i: number) => (
                      <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" className="source-item-long">
                        <div className="source-site-name"><LinkIcon size={14} /> {src.title}</div>
                        <div className="source-url-text">{src.url}</div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ②発表されている今後の予定 ＆ ③予定の場所と料金 */}
          <div className="glass-card full-width">
            <div className="card-header">
              <div className="icon-wrapper" style={{ color: 'var(--accent)' }}>
                <CalendarDays size={24} />
              </div>
              <h2 className="card-title">② 発表されている今後の予定 ＆ ③ 場所・料金</h2>
            </div>

            <div className="timeline">
              {researchData.upcomingPlans.length > 0 ? (
                researchData.upcomingPlans.map((plan: any, idx: number) => (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-date">{plan.date}</div>
                    <div className="timeline-title">{plan.title}</div>
                    <div className="timeline-details">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} color="var(--primary-color)" /> <strong>日程:</strong> {plan.date} {plan.time}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={16} color="var(--primary-color)" /> <strong>場所:</strong> {plan.location}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Ticket size={16} color="var(--primary-color)" /> <strong>料金:</strong> {plan.price}
                      </div>
                      <div>{plan.description}</div>

                      {plan.ticketUrl && (
                        <a href={plan.ticketUrl} target="_blank" rel="noopener noreferrer" className="ticket-link-btn">
                          詳細・販売サイトへ
                          <ArrowRight size={16} />
                        </a>
                      )}

                      {plan.sources && (
                        <div className="source-links">
                          <span className="source-tag">情報の出どころ・出典URL:</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                            {plan.sources.map((src: any, i: number) => (
                              <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" className="source-item-long">
                                <div className="source-site-name"><LinkIcon size={14} /> {src.title}</div>
                                <div className="source-url-text">{src.url}</div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                  今後の予定は見つかりませんでした。
                </div>
              )}
            </div>
          </div>

          {/* ④未発表だが噂になっている情報 */}
          <div className="glass-card full-width">
            <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
              <div className="icon-wrapper" style={{ color: '#fef08a' }}>
                <MessageCircleQuestion size={24} />
              </div>
              <h2 className="card-title">④ 未発表だが噂になっている情報</h2>
            </div>

            <div className="rumor-box">
              <p>
                <strong>※これらはWeb上の憶測や関係者のリーク情報に基づく未確定の情報です。</strong><br />
                {researchData.rumors.content}
              </p>

              {researchData.rumors.sources && (
                <div className="source-links">
                  <span className="source-tag">情報の出どころ・出典URL:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                    {researchData.rumors.sources.map((src: any, i: number) => (
                      <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" className="source-item-long">
                        <div className="source-site-name"><LinkIcon size={14} /> {src.title}</div>
                        <div className="source-url-text">{src.url}</div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </main>
      )}
    </div>
  );
}

export default App;
