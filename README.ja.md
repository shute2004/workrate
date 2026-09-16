# Workrate

[English](README.md) | **日本語**

Workrate は、時給制の作業時間と現在までの収益を管理するための、macOS 向け軽量タイマーアプリです。

複数のタイマーを独立して同時に動かすことができ、経過時間、USD 建ての収益、現在の USD/JPY 為替レートに基づく円換算額を1画面で確認できます。

アカウント登録、クラウド同期、プロジェクト管理、スクリーンショット、操作監視、生産性スコアなどは持たず、個人用のシンプルなタイムトラッカーとして使うことを目的としています。

## 主な機能

- 複数タイマーを同時に実行
- タイマーごとに開始・停止・再開・リセット
- タイマー名と USD 建て時給を設定
- `HH:MM:SS` 形式で経過時間をリアルタイム表示
- 現在までの USD 収益をリアルタイム計算
- USD/JPY 為替レートを使った円換算
- 起動時および1時間ごとの為替レート更新
- アプリや Mac を再起動しても状態を保持
- 実行中のままアプリを閉じても、次回起動時に実時間から経過時間を復元
- macOS のメニューバーからウィンドウを再表示
- タイマーデータは Mac 内に保存
- バックグラウンド負荷を抑えるため、タイマーごとの常時 tick 処理を持たない設計

UI は日本語を標準としています。

## インストール

1. [GitHub Releases](https://github.com/shute2004/workrate/releases) を開きます。
2. 最新版の `.dmg` をダウンロードします。
3. DMG を開き、**Workrate** を **Applications** フォルダへドラッグします。
4. Applications から Workrate を起動します。

### macOS の Gatekeeper について

現在の OSS ビルドは Apple の notarization を行っていません。macOS に起動を止められた場合は、**システム設定 → プライバシーとセキュリティ** から Workrate の起動を許可してください。

## 仕組み

実行中のタイマーは、1秒ごとに値を書き換えているわけではありません。

各タイマーには主に、

- それまでの累積秒数
- 現在の計測を開始した時刻

だけを保存し、必要なときに現在時刻との差から経過時間を算出します。

そのため、Workrate をバックグラウンドに置いている間に、Rust 側で各タイマーを1秒ごとに更新する処理は動きません。ウィンドウが表示・フォーカスされている間だけ、フロントエンドが1秒ごとに表示を更新します。

状態はタイマーの開始・停止・編集など、実際に変更が起きたときにローカルへ保存します。

為替レートは [ExchangeRate-API](https://www.exchangerate-api.com/) の USD 基準レートから JPY を取得します。取得に失敗した場合は、最後に正常取得したレートをそのまま使います。

## 開発

### 必要な環境

- macOS 12 以降
- Node.js
- Rust toolchain
- Tauri 2 のビルドに必要な環境

### 開発版を起動

```bash
npm install
npm run dev:app
```

### チェック

```bash
npm run check
```

フロントエンドの lint / build、Rust の format check / test を実行します。

### DMG をビルド

```bash
npm run build:app
```

生成された DMG は `src-tauri/target/release/bundle/dmg/` 以下に出力されます。

## プロジェクト構成

```text
src/
  components/      React UI コンポーネント
  hooks/           UI ライフサイクル関連の hooks
  lib/             タイマー計算・表示用ユーティリティ
  backend.ts       Tauri bridge + ブラウザ開発用モック

src-tauri/src/
  commands.rs      Tauri commands
  exchange.rs      USD/JPY の取得と定期更新
  model.rs         アプリ状態・タイマー状態遷移
  storage.rs       ローカル JSON 永続化
  tray.rs          macOS メニューバー連携
  lib.rs           アプリ全体の組み立て
```

実装方針の詳細は [`docs/architecture.ja.md`](docs/architecture.ja.md) を参照してください。

## コントリビューション

開発への参加方法は [`CONTRIBUTING.ja.md`](CONTRIBUTING.ja.md) を参照してください。

## プライバシー

Workrate にはログイン機能がなく、タイマー名、時給、経過時間、収益などを Workrate のサーバーへ送信することもありません。

ネットワーク通信は USD/JPY 為替レートの取得にのみ使用します。

## ライセンス

MIT
