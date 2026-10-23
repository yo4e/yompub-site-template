# yompub-site-template
A minimal bookshelf and vertical reading site template powered by YomPUB.

小さな書棚から本を選び、表紙をひらいて縦書きで読む、静的サイトのテンプレートです。タイトルと著者名だけの表紙、本文、前後移動、書棚に戻る操作を備えています。CMS・認証・管理画面・アクセス解析・外部フォントはありません。

三篇のサンプル「椅子をひとつ」「雨のとどけ先」「最後の切符」は、この試作のために書き下ろした架空の短篇です。「余白文庫」はテンプレートの仮の文庫名・作者表示です。自分の作品へ差し替えて使ってください。実験段階のテンプレートです。将来の書式/API互換性はまだ約束していません。

[書棚をひらく](https://yo4e.github.io/yompub-site-template/)

## ひらく

```sh
git clone https://github.com/yo4e/yompub-site-template.git
cd yompub-site-template
npm run dev
```

Node.js 22以上が必要です。npm installは不要。**http://127.0.0.1:4180/** を開いてください。終了はCtrl+C。使用中なら `PORT=4181 npm run dev`。サーバーは127.0.0.1だけで待ち受け、ネットワークへ公開しません。ファイルを編集したらブラウザを再読込してください。

このリポジトリだけで動きます。readerとWorkerは `vendor/yompub/` に同梱され、元のYomPUBリポジトリやnode_modulesへの参照はありません。

## 自分の書棚へ変える

| ファイル | 変えるもの |
| --- | --- |
| `library.json` の `name` / `description` | 文庫名と書棚の短い紹介文 |
| `library.json` の `books` | 棚に並べる順序、本のid・題名・作者・色。toneは `linen` / `sage` / `rose` |
| `books/<id>/book.md` | 本の書誌と本文。棚のtitle/authorとヘッダのtitle/authorを同じ値にする |
| `site.css` | 紙・背景の色、余白、書棚の見た目 |
| `index.html` | 共通フッター・description・JavaScript無効時の原稿リンク |

新しい本は、既存の `books/chair/` を新しいidのフォルダへコピーし、book.mdを書き換え、library.jsonのbooksに一件追加します。idは英小文字で始まる英小文字・数字・ハイフンで、重複不可。三冊固定ではありません。不要な本はbooks配列から外します。

```json
{ "id": "my-story", "title": "新しい物語", "author": "あなたの名前", "tone": "linen", "assets": [] }
```

book.mdはUTF-8で保存します。ヘッダの `yompub`、`lang`、`direction`、`writing-mode` は、まずサンプルのまま使ってください。これは縦書き `vertical-rl` 向けのホストです。

```md
---
yompub: 0.1-draft.1
title: 新しい物語
author: あなたの名前
lang: ja
direction: ltr
writing-mode: vertical-rl
---

# 新しい物語

｜港《みなと》には、まだ灯りがあった。
```

段落は空行で分けます。ルビは `｜本文《読み》`。任意のHTML/CSS/JSは書けません。画像を使う場合は本のフォルダ内にPNG/JPEG/WebPを置き、原稿の `![説明](assets/image.png)` と、library.jsonのその本の `assets: ["assets/image.png"]` の両方に指定します。私的なメモや未使用画像をサイトへ置かないでください。

ブラウザが本を開く際に原稿と画像を検証します。静的サーバーにビルド・編集機能はありません。書誌や本文の変更後は、書棚・表紙・本文を開いて確認してください。

## 操作と構成

書棚の本 → 表紙の「ひらく」→ 本文。左右のスワイプ・スクロール、「次へ」「前へ」、左右の矢印キーで進めます。「表紙」で最初に戻り、「書棚へ」またはEscで本を閉じます。書棚に戻るとWorkerや本文DOMを破棄します。読込中の移動や連続切替でも、古い本の結果は新しい画面を上書きしません。

本文は `vendor/yompub/reader.mjs` の `createReader` を使用し、Core parserと画像処理は隣のWorkerで行います。`chrome:'none'` により、管理・解析用の操作部を出さず、ホストの小さな操作だけで読みます。ホストはreaderの内部DOMを書き換えません。文字サイズは `site.mjs` のcreateReaderの `fontSize` で指定できます。

`vendor/yompub/` は検証済みreaderのスナップショットです。実体のSHA-256と元のローカルコミットを [ORIGIN.json](vendor/yompub/ORIGIN.json) に記録しています。上流へ未pushの変更を含むため、公開中のYomPUB mainから同じファイルを再生成できるとは限りません。出典・更新時の注意は [vendor README](vendor/yompub/README.md)、検証範囲は [VALIDATION.md](VALIDATION.md) を参照してください。npm配布済みの安定APIではありません。

## 現在の制限

- 「次へ」は本文領域を少し重ねてスクロールする操作です。版面をページに分割する組版・固定ページ番号・しおり保存ではありません。進捗の%はスクロール位置です。
- フォントとルビ・禁則処理はブラウザと端末に依存します。日本語フォントは同梱しません。スマホ幅のヘッドレス検証は、実機Safari/Android・支援技術の評価の代わりにはなりません。
- 同一オリジンのHTTP(S)が必要です。`file://` 非対応。CSPは同一オリジンのmodule/worker、Blob画像、readerのstyleを許可します。
- 本ごとのURL・履歴・SEO用の静的本文生成は未実装。JavaScriptを無効にした場合は原稿リンクから読めます。
- プレビュー用サーバーは開発用です。外部公開・リポジトリ作成・配信設定はこのテンプレートを生成するだけでは行いません。

原稿・サイトの元コードはMIT（LICENSE）。readerの第三者表示は `vendor/yompub/THIRD_PARTY_NOTICES.md` と `licenses/` を保持してください。

## GitHub Pagesで配信する

このリポジトリの公開先は上の「書棚をひらく」です。ビルド不要の静的ファイルを、Pagesの「Deploy from a branch」、`main`、`/ (root)` から配信します。`.nojekyll` はそのまま残してください。スクリプト・Worker・原稿は相対URLで読み込むため、リポジトリ名を含むサブパスでも動きます。

複製したリポジトリではPages設定を自分で有効にし、このREADMEの公開リンクを変更してください。リポジトリ作成や配信設定を自動実行するスクリプトはありません。配信するファイルはすべて公開されるため、原稿・画像・設定に公開したくない情報を含めないでください。
