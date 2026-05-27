<p align="center">
  <a href="https://github.com/wangrongding/wallpaper-box" target="_blank">
    <img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301021532343.svg" width="300" alt="wallpaper-box logo"/>
  </a>
</p>

[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md) | [Español](./README.es.md)

🏞️ `wallpaper-box` は単なる壁紙ダウンローダーではありません。デスクトップを本当に生き生きとさせるクライアントです：静的壁紙、動画壁紙、ウェブ壁紙、AI生成壁紙、そしてCPU使用率に連動して走るRunCatスタイルのトレイアニメーションまで、すべて1つのアプリで実現します。

## 機能概要

- [x] AIテキストから画像を生成して壁紙に
- [x] オンライン壁紙の閲覧・検索
- [x] 壁紙のローカルダウンロード
- [x] 静的壁紙の設定
- [x] 動画壁紙の設定（macOSではフルスクリーンですが画面全体を完全に覆うわけではありません。改善PR歓迎！）
- [x] `yt-dlp` でYouTube / Bilibili動画をダウンロードしてそのまま動画壁紙に設定
- [x] ウェブ壁紙の設定
- [x] テキストプロンプトからAI壁紙を生成
- [x] オンラインURLとローカルHTMLファイルの両方をウェブ壁紙としてサポート
- [x] CPU使用率に応じて速度が変わるRunCat風トレイアニメーション
- [x] ログイン時起動
- [x] HTTPプロキシ対応

## プラットフォームについて

- パッケージングスクリプトは主にmacOS向けです。
- デフォルトビルドは `universal`（Apple SiliconとIntel Macの両対応）。
- `x64` / `arm64` 個別ビルドコマンドも用意しています。
- 対応最低macOSバージョンは `10.13` です。
- アプリはApple Developer署名されていません。初回起動時は手動で許可が必要です。

## 使い方

### 壁紙一覧

壁紙は wallhaven.cc から取得しています。

- 検索・フィルター・プレビュー・ダウンロード・直接設定が可能です。
- ダウンロードした静的壁紙はデフォルトで `~/wallpaper-box` に保存されます。

<table>
  <tr>
     <td width="50%" align="center"><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301021543565.png"/></td>
     <td width="50%" align="center"><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301021752830.gif"/></td>
  </tr>
</table>

### ライブ（動画）壁紙

ローカルの動画ファイルをデスクトップのダイナミック壁紙として設定できます。YouTube / Bilibiliのリンクを貼るだけでダウンロードしてそのまま使えます。

- クリック選択またはドラッグ＆ドロップ対応。
- `YouTube / Bilibili` リンクを貼って動画をダウンロード。
- `MP4`、`MOV`、`WebM` などの一般的な形式に対応。
- macOSでは動画壁紙ウィンドウが画面全体を完全に覆わない場合があります。改善PR歓迎です。

<img width="1441" height="900" alt="image" src="https://github.com/user-attachments/assets/ad7e851d-6c14-4780-87d4-bf0c4d1651da" />

注意事項：

- ダウンロードした動画は `~/wallpaper-box/videos` に保存されます。
- ダウンロード完了後に自動で壁紙に設定されます。
- リリース版には `yt-dlp` と `Deno` が同梱されており、手動インストールは不要です。
- 音声と映像が分離された動画の場合、`ffmpeg` と `ffprobe` も `resources/bin/` に入れる必要があります。
- 公式 `yt-dlp_macos` を使う場合、実質的な最低システム要件は macOS 10.15 以上に近づきます。

<table>
  <tr>
      <td width="50%" align="center"><b>Windows:</b></td>
      <td width="50%" align="center"><b>macOS:</b></td>
  </tr>
  <tr>
     <td><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/images202204250101273.gif"/></td>
     <td><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/Kapture%202025-07-09%20at%2000.53.05.gif"/></td>
  </tr>
</table>

### ウェブ壁紙

任意のウェブページをデスクトップ壁紙にできます。オンラインURLとローカルHTMLファイルの両方に対応。

- **オンラインURL**：アドレスを入力するだけ。
  - 例：`https://wangrongding.github.io/jellyfish/`
  - `google.com` や `localhost:3000` は自動でプロトコルを補完します。
- **ローカルファイル**：`HTML/HTM/SVG` ファイルをドラッグ＆ドロップまたは選択。
  - macOS/Linux例：`/Users/your-name/Coding/jellyfish/index.html`
  - Windows例：`C:\Users\your-name\Coding\jellyfish\index.html`

### AI壁紙

テキストプロンプトから直接壁紙を生成できます。

- AI設定は **AI壁紙** ページ内にあり、グローバル設定にはありません。
- 生成された画像は自動的に `~/wallpaper-box` に保存されます。
- 生成後すぐに壁紙に設定したり、保存場所を開いたりできます。

<img width="1441" height="900" alt="image" src="https://github.com/user-attachments/assets/cf239b2a-e9c7-4a59-9ec0-9c36689af1a6" />

現在対応している主な接続先：

- OpenAI Images API 互換エンドポイント
- Zhipu `glm-image`

おすすめ設定例：

- OpenAI
  - `API Base URL`: `https://api.openai.com/v1`
  - `Model`: `gpt-image-1`
- Zhipu BigModel
  - `API Base URL`: `https://open.bigmodel.cn/api/paas/v4`
  - `Model`: `glm-image`

注意：

- Zhipuの完全URL `https://open.bigmodel.cn/api/paas/v4/images/generations` も対応しています。
- `glm-image` はカスタム幅・高さをサポート。
- カスタムサイズ制限：`512-2048`、かつ幅と高さは32の倍数であること。

プロンプトのコツ：

- おすすめ構成：`主題 + スタイル・質感 + 光線・時間 + 構図 + 壁紙要件`
- 例：`未来の海岸線都市、黄昏の逆光、シネマティックな広角構図、クリーンな余白、ワイドスクリーン壁紙に適したもの、人なし、文字なし、透かしなし`

### トレイアニメーションアイコン

トレイアイコンはリアルタイムのCPU使用率に応じてアニメーション速度が変わります。トレイメニューまたは専用ページ「アニメーションアイコン」からテーマを切り替えられます。

<table>
  <tr>
     <td width="50%" align="center"><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202212301215445.gif"/></td>
     <td width="50%" align="center"><img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301021550728.png"/></td>
  </tr>
</table>

<img width="1390" alt="image" src="https://github.com/user-attachments/assets/470fcc81-5348-41be-9b1f-d55f0f6d07c5" />

[electron/tray-list.ts](./electron/tray-list.ts) を手動で編集する必要はもうありません。

- ビルトインアイコンは [public/icons](./public/icons) 以下のサブフォルダから自動スキャンされます。
- カスタムアイコンは「アニメーションアイコン」ページからインポート・削除可能、または `~/wallpaper-box/tray-icons/<アイコン名>/` に直接配置するだけです。
- 同じグループのフレームはファイル名順（`001.png`、`002.png` など）で再生されます。

<img src="https://raw.githubusercontent.com/wangrongding/image-house/master/202301030045464.gif" width="600" />

### 設定

グローバル設定ページには主に一般設定が残っています：

- ログイン時起動
- HTTPプロキシ
- プロキシ接続テスト
- 壁紙のデフォルト保存場所（現在は `~/wallpaper-box`）

注意：

- プロキシテストはGoogleへの到達を試みます。
- AI APIの設定はここではなく **AI壁紙** ページ内にあります。
- トレイアイコンのプレビュー・切り替え・カスタムインポートは独立した「アニメーションアイコン」ページに移動しました。

<img width="1000" alt="531b7f4d-270e-4233-8a14-fbc2d4d4c2ff" src="https://github.com/user-attachments/assets/2987e3fa-08f5-4251-bd06-8d0a451d30f7" />

## 開発

### 依存関係のインストール

```sh
pnpm install
```

注意：

- `pnpm install` 実行時に自動で `prepare` が走り、`yt-dlp` / `Deno` / `ffmpeg` / `ffprobe` を `resources/bin/` にダウンロードします。
- すでにバイナリが存在する場合はスキップされます。
- 強制的にバイナリを更新したい場合は `pnpm prepare:video-downloader` を実行してください。

### 動画ダウンロード用バイナリの準備（手動）

```sh
pnpm prepare:video-downloader
```

このスクリプトは以下のバイナリを `resources/bin/` にダウンロードします：

- `yt-dlp_macos`
- `deno-aarch64-apple-darwin`
- `deno-x86_64-apple-darwin`
- `ffmpeg-darwin-arm64`
- `ffprobe-darwin-arm64`
- `ffmpeg-darwin-x64`
- `ffprobe-darwin-x64`

注意：

- これらは `electron-builder.extraResources` によってアプリに同梱されます。
- `yt-dlp` は音声・映像分離ストリームの場合、現在のアーキテクチャに合った `ffmpeg`/`ffprobe` を自動選択します。
- 開発時は環境変数でパスを上書きできます：`WALLPAPER_BOX_YT_DLP_PATH` など。

### ローカル開発

WebとElectronを同時に起動：

```sh
pnpm dev
```

別々のターミナルで起動：

```sh
pnpm dev:web
pnpm dev:electron
```

ローカルビルド済み成果物でElectronを起動：

```sh
pnpm build:web
pnpm build:electron
pnpm electron:start
```

## パッケージング

ビルド成果物は `out/` ディレクトリに出力されます。

アーキテクチャの説明：

- `universal`：Intel (x64) と Apple Silicon (arm64) の両方を1つのパッケージに含む。
- `x64`：古いIntel Mac向け。
- `arm64`：M1/M2/M3/M4 Mac向け。

```sh
# おすすめのデフォルト（universal）
pnpm build

# 明示的にuniversalをビルド
pnpm build:mac:universal

# Intelのみ
pnpm build:mac:x64

# Apple Siliconのみ
pnpm build:mac:arm64

# DMGインストーラー（universal）
pnpm build:dmg

# ZIPポータブル版（universal）
pnpm build:zip
```

## よくある質問

### 1. macOSで「このアプリは開けません」と表示される

アプリはApple Developer署名されていません。ターミナルで以下を実行してください：

```sh
sudo spctl --master-disable
sudo xattr -r -d com.apple.quarantine /Applications/wallpaper-box.app
```

アプリが `/Applications` にない場合は、実際の `.app` パスに置き換えてください（Finderからアプリをターミナルにドラッグ）。

### 2. 「このアプリケーションはこのMacではサポートされていません」と表示される

- macOSバージョンが `10.13` 未満
- 間違ったアーキテクチャのビルドをダウンロードした

デフォルトの `universal` パッケージを優先してください。必要に応じて `x64` または `arm64` を個別にビルドすることも可能です。

### 3. AI生成で `404 not found` になる

Zhipu BigModelを使用している場合、現在のバージョンは以下の両方に対応しています：

- `https://open.bigmodel.cn/api/paas/v4`
- `https://open.bigmodel.cn/api/paas/v4/images/generations`

それでもエラーになる場合は以下を確認してください：

- API Key
- Model が `glm-image` になっているか
- `API Base URL` に明らかな入力ミスがないか

### 4. AIカスタムサイズでエラー

`glm-image` のカスタム幅・高さ制限：

- 範囲：`512-2048`
- 幅と高さは両方とも32の倍数であること

有効な例：

- `2048x1152`
- `2048x1280`
- `1792x1024`

## ディレクトリについて

- 静的壁紙・AI壁紙の保存先：`~/wallpaper-box`
- AI設定：**AI壁紙** ページ右上の **設定** ボタン

## 最後に

このプロジェクトが役に立ったと思ったら、ぜひ ⭐️ をお願いします！

IssueやPRも大歓迎です。
