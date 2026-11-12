# KBT Inc. Corporate Site

KBT株式会社（KBT Inc.）の公式コーポレートサイト。
`index.html` 1ファイルの静的サイト（HTML + Tailwind CSS CDN + Vanilla JS）。GitHub Pages のルート／サブディレクトリどちらでも動作します。

## ローカル確認

```bash
python3 -m http.server 8123
```

ブラウザで http://127.0.0.1:8123/ を開きます。

## お問い合わせフォーム

[Web3Forms](https://web3forms.com) 経由で info@kbt-inc.jp に届きます。

### 設定手順
1. https://web3forms.com で `info@kbt-inc.jp` を入力し、Access Key を発行（同アドレスにキーが届く）
2. `index.html` の `<input type="hidden" name="access_key" value="YOUR_WEB3FORMS_ACCESS_KEY">` をそのキーに置き換える（キーは公開前提の値なので HTML に書いてよい）
3. Web3Forms のダッシュボードでスパム対策に hCaptcha を有効化（有効化しないとサーバー側で検証されない）

キー未設定のままだと「準備中」と表示され、送信は行われません。

### スパム・営業対策
- hCaptcha（人間確認）
- ハニーポット欄 `botcheck`（bot が埋めたら送信したふりをして破棄）
- ページ表示から4秒未満の送信を拒否 / 同一ブラウザから60秒以内の連続送信を拒否
- 本文10文字以上・URL 2件まで、各欄に文字数上限
- 「営業目的ではありません」チェック必須、営業・AIエージェントお断りの明記
- 件名は `【KBT お問い合わせ】種別 - お名前様` 形式（メールの振り分けに利用可）
