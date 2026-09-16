# コントリビューション

[English](CONTRIBUTING.md) | **日本語**

Workrate へのコントリビューションを歓迎します。

## ローカル開発

```bash
npm install
npm run dev:app
```

Pull Request を作成する前に、以下を実行してください。

```bash
npm run check
```

Workrate は意図的に機能を絞っています。プロジェクト管理、従業員監視、タスク管理、生産性分析など、シンプルな時間・収益トラッキングの範囲を大きく超える機能は、現在のスコープ外です。

## コード構成の方針

- 永続化されるタイマー状態に影響する状態遷移は Rust 側の model に置く
- 表示専用の計算は `src/lib/` に置く
- タイムスタンプから導出できる値のために不要なバックグラウンド polling を追加しない
- `App.tsx` に責務を増やすより、小さく役割の明確なコンポーネントへ分ける

## リリース

`v0.1.0` のようなバージョンタグを push すると、GitHub Actions の release workflow が macOS 用 DMG をビルドし、GitHub Releases に公開します。
