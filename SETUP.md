# セットアップガイド

## 1. 環境変数の設定

`.env.example` を `.env.local` としてコピーします。

```bash
cp .env.example .env.local
```

`.env.local` を開いて以下の2つの値を設定してください。

---

### DATABASE_URL（Neon）

1. [console.neon.tech](https://console.neon.tech) にアクセスしてサインアップ/ログイン
2. 「New Project」をクリックしてプロジェクトを作成
3. ダッシュボードの「Connection Details」から **Connection string** をコピー
   - 形式: `postgresql://username:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
4. `.env.local` の `DATABASE_URL` に貼り付け

---

### ANTHROPIC_API_KEY（Claude API）

1. [console.anthropic.com](https://console.anthropic.com) にアクセスしてサインアップ/ログイン
2. **Settings → API Keys** → 「Create Key」
3. 生成されたキー（`sk-ant-api03-...`）を `.env.local` の `ANTHROPIC_API_KEY` に貼り付け

---

## 2. データベースのマイグレーション

環境変数を設定したら、テーブルを作成します。

```bash
npx prisma migrate dev --name init
```

> **注意**: `prisma.config.ts` に `import "dotenv/config"` が含まれているため、
> `.env.local` ではなく **`.env`** に DATABASE_URL を設定する必要があります（Prisma CLIはdotenvで `.env` を読み込む）。
> Vercel本番環境では環境変数パネルから設定します。

**Prisma CLI 用に `.env` へもコピー:**
```bash
# .env.local の内容を .env にもコピー（Prisma CLI用）
cp .env.local .env
```

---

## 3. ローカル開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

---

## 4. Vercel へのデプロイ

### 方法 A: Vercel CLI

```bash
npm i -g vercel
vercel
```

### 方法 B: GitHub 連携

1. このリポジトリを GitHub にプッシュ
2. [vercel.com/new](https://vercel.com/new) でリポジトリをインポート
3. **Environment Variables** に以下を追加:
   - `DATABASE_URL` ← Neon の接続文字列
   - `ANTHROPIC_API_KEY` ← Anthropic API キー
4. 「Deploy」をクリック

### デプロイ後のマイグレーション

Vercel の「Deployments」タブ → 最新デプロイの「Functions」→ ターミナル で実行するか、
または Neon のダッシュボードから直接 SQL を実行してテーブルを作成することもできます。

**推奨**: Vercel 環境では以下の SQL を Neon コンソールで直接実行：

```sql
CREATE TABLE "Guide" (
  "id"          TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "inputType"   TEXT NOT NULL,
  "inputValue"  TEXT NOT NULL,
  "summary"     TEXT NOT NULL,
  "prerequisites" JSONB NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Guide_pkey" PRIMARY KEY ("id")
);
```

または `vercel env pull` で環境変数をローカルに取得して `prisma migrate deploy` を実行する方法もあります。

---

## 5. トラブルシューティング

| エラー | 原因 | 解決策 |
|--------|------|--------|
| `ANTHROPIC_API_KEY が設定されていません` | 環境変数未設定 | `.env.local` を確認 |
| `Can't reach database server` | DATABASE_URL が正しくない | Neon コンソールで接続文字列を再確認 |
| `Table Guide does not exist` | マイグレーション未実行 | `npx prisma migrate dev` を実行 |
| 生成が途中でタイムアウト | Vercel Hobby プランの制限 | Pro プランにアップグレード（60秒まで） |
