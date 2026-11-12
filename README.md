# KBT Inc. Corporate Site

KBT株式会社（KBT Inc.）の公式コーポレートサイト。
静的構成（HTML5 + Tailwind CSS CDN + GSAP/ScrollTrigger + Lenis + Canvas）で、すべて相対パスのため GitHub Pages のルート／サブディレクトリどちらでも動作します。

## ローカル確認

```bash
python3 -m http.server 8123
```

ブラウザで http://127.0.0.1:8123/ を開きます。

## 構成

```
index.html
assets/css/style.css
assets/js/main.js
assets/img/favicon.svg
.nojekyll
```

## お問い合わせフォーム

デフォルトでは送信演出のみ（データはどこにも送信されません）。
実際に受信するには Formspree 等のエンドポイントを `<form id="contactForm" data-endpoint="https://formspree.io/f/XXXX">` のように指定してください。
