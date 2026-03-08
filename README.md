# 推しの尊い近況 - 推し活ディープリサーチツール

推しの名前を入力するだけで、Web上の公式サイト、ニュース、SNS、チケットサイトから最新情報をリアルタイムで取得し、「近況」「今後の予定」「噂」としてまとめるアプリです。

## 🌟 特徴

- **完全無料**: AI APIキーなどは不要です。ブラウザ上で直接検索・解析を行います。
- **リアルタイム**: その瞬間のWebの状況を反映します。
- **ディープサーチ**: チケットサイトやSNSの噂レベルの情報まで幅広くカバーします。

## 🚀 使い方

1. 検索窓に推しの名前（芸能人、アニメキャラ等）を入力します。
2. 「ディープサーチ」ボタンを押すと、バックグラウンドでリサーチが始まります。
3. 数秒後、整理された最新情報が表示されます。

## 🛠️ 技術スタック

- **Frontend**: React + TypeScript + Vite
- **UI Components**: Lucide React (Icons)
- **Styling**: Vanilla CSS (Glassmorphism design)
- **Search Engine**: DuckDuckGo (via AllOrigins CORS Proxy)

## 📦 インストールと実行（開発者向け）

```bash
# 依存関係のインストール
npm install

# ローカルサーバーの起動
npm run dev
```

## 🌐 GitHub Pagesへの公開方法

1. GitHubで新しいリポジトリを作成します。
2. 以下のコマンドでビルドとデプロイを行います（`gh-pages`パッケージなどを使用する場合）。

```bash
npm run build
# 生成された dist フォルダの内容をリポジトリの main または gh-pages ブランチにアップロード
```

---
*Created for the ultimate Oshi-Katsu experience.*
