# KBT Inc. Corporate Site

KBT株式会社（KBT Inc.）の公式コーポレートサイト。静的サイト（HTML + Tailwind CSS CDN + Vanilla JS）で、GitHub Pages で公開しています。

## 構成

```
src/template.html     … 日本語の元原稿（デザイン・文言・スクリプト）← 日本語や見た目はここを編集
i18n.js               … 各言語の翻訳                                ← 他言語の文言はここを編集
tools/build.py        … 言語別ページの生成スクリプト
tools/extract_i18n.jxa.js … （Node が無い Mac 用）翻訳ファイルの読み取り補助

index.html            … 日本語ページ        ┐
en/ zh-hans/ zh-hant/ ko/ th/ vi/ es/ fr/ ar/ │ build.py が自動生成。直接編集しない
sitemap.xml, robots.txt                      ┘
```

## 文言・デザインを変えたら

```bash
python3 tools/build.py
```

を実行すると、10言語のページと sitemap が作り直されます。生成後にコミット・プッシュすれば公開に反映されます。
（Node.js があれば Node、無ければ macOS 標準の JavaScript 実行環境で翻訳ファイルを読み取ります）

## 検索エンジンへの掲載

正式サイトは kbt-inc.jp のため、この github.io 版は `tools/build.py` の `NOINDEX = True` で検索に出ないようにしています（全ページに `noindex, nofollow`、robots.txt からサイトマップの案内を外す）。
このリポジトリを正式な公開先にするときは `NOINDEX = False` にして再生成してください。

## ドメインを変えるとき

1. `tools/build.py` の `BASE_URL` を新しいURL（例 `https://kbt-inc.jp/`）に変更して `python3 tools/build.py`
2. GitHub リポジトリの Settings → Pages → Custom domain に登録し、DNS を設定
   （github.io 側の URL は GitHub が新ドメインへ自動転送します）

## 多言語の仕組み

- 日本語 `/`、英語 `/en/`、簡体字 `/zh-hans/`、繁体字 `/zh-hant/`、韓国語 `/ko/`、タイ語 `/th/`、ベトナム語 `/vi/`、スペイン語 `/es/`、フランス語 `/fr/`、アラビア語 `/ar/`（右から左表示）
- 各ページは翻訳済みのHTMLとして配信され、canonical / hreflang / 言語別の OGP（SNSプレビュー）を備えます。
- ブラウザの言語に合うページがあれば、自動で飛ばさずにヘッダー下に案内バーを表示します。
- 旧URL（`?lang=en` など）でのアクセスは該当ページへ転送します。
- 翻訳対象の要素には `data-i18n="キー"` が付いています。新しい文言を足すときは、テンプレートに `data-i18n` を付け、`i18n.js` の各言語に同じキーを追加してください。

## お問い合わせフォーム

[Web3Forms](https://web3forms.com) 経由で info@kbt-inc.jp に届きます。件名は `【KBT お問い合わせ】種別 - お名前様 [表示言語]` 形式です。

- Access Key は `src/template.html` の `access_key` 欄（公開前提の値なので HTML に書いてよい）
- Web3Forms のダッシュボードで hCaptcha は **オフ**（オンだと全送信が拒否される）

### スパム・営業対策
- Web3Forms 側の標準スパムフィルタ / 無料プランはブラウザ以外からの直接送信を受け付けない
- ハニーポット欄 `botcheck`（bot が埋めたら送信したふりをして破棄）
- ページ表示から4秒未満の送信を拒否 / 同一ブラウザから60秒以内の連続送信を拒否
- 本文10文字以上・URL 2件まで、各欄に文字数上限
- 「営業目的ではありません」チェック必須、営業・AIエージェントお断りの明記
