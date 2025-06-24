# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイドラインを提供します。

## プロジェクト概要

LinkatはBlueskyアカウントを使用してリンク集を整理・共有できるWebアプリケーションです。ATProtocol/Blueskyエコシステムと深く統合されており、データはローカルとユーザーのPersonal Data Server (PDS)の両方に保存されます。

## 開発コマンド

```bash
# ビルド
pnpm build            # プロダクションビルド

# テスト
pnpm test             # ユニットテスト実行
pnpm test -- app/models/board.spec.ts  # 特定のテストファイル実行

# コード品質
pnpm lint             # ESLintとPrettierチェック
pnpm format           # ESLint修正とPrettierフォーマット
pnpm typecheck        # TypeScript型チェック
pnpm all              # typecheck、format、testを全て実行
```

## アーキテクチャ

### 技術スタック

- **フレームワーク**: React Router v7 (旧Remix)
- **言語**: TypeScript
- **データベース**: PostgreSQL (Prisma経由)
- **認証**: ATProtocol OAuth 2.0
- **状態管理**: Jotai (トースト通知などのクライアント状態)
- **スタイリング**: Tailwind CSS
- **テスト**: Vitest (ユニット)、Playwright (E2E)

### 主要ディレクトリ

- `app/routes/`: ページコンポーネントとAPIルート
- `app/server/`: サーバーサイドロジックとサービス
- `app/features/`: 機能別コンポーネント
- `app/models/`: データ検証用Zodスキーマ
- `prisma/`: データベーススキーマとマイグレーション

### データフロー

1. ユーザーデータは楽観的にローカルのPostgreSQLに保存
2. 変更はATProtoレコードとしてユーザーのBluesky PDSに同期
3. JetstreamがPDSの更新を監視してローカルDBに同期
4. ボードデータは`blue.linkat.board`レキシコンスキーマに従う

### ATProto統合

- レコードは`blue.linkat.board`コレクションに保存
- OAuthクライアント認証情報はDBに保存
- bsky.socialとセルフホストPDSインスタンスの両方をサポート
- Bluesky firehoseからのリアルタイム更新にJetstreamを使用

## 開発ガイドライン

### テスト

- モデルとサービスのユニットテストはVitestで記述
- テストではPrismaモッククライアントを使用（自動設定済み）
- E2EテストはPlaywrightで複数ブラウザをサポート
- テストファイルはソースファイルと同じ場所に`*.spec.ts`として配置

### データベース変更

```bash
# prisma/schema.prismaを変更した後
pnpm prisma migrate dev --name 変更内容の説明
pnpm prisma generate
```

### 環境変数

必要な変数は`.env.example`に定義されています。主なもの：

- `DATABASE_URL`: PostgreSQL接続文字列
- `PRIVATE_JETSTREAM_URL`: JetstreamサービスURL
- `ORIGIN`: アプリケーションURL (開発環境: http://linkat.localhost:3000)

### エラーハンドリング

- 一貫したエラーハンドリングには`tryCatch`ユーティリティを使用
- サービスは見つからない場合`null`を返す
- バリデーションエラーはZodスキーマで処理
