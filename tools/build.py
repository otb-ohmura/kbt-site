#!/usr/bin/env python3
"""
KBT Inc. — 言語別ページの生成スクリプト

  元原稿 : src/template.html（日本語）  +  i18n.js（各言語の翻訳）
  出力   : index.html（日本語） / en/ / zh-hans/ / zh-hant/ / ko/ / th/ / vi/ / es/ / fr/ / ar/
           sitemap.xml / robots.txt

使い方（サイトのフォルダで）:
    python3 tools/build.py

ドメインを変えるときは BASE_URL を書き換えて再実行してください。
文言を直すときは src/template.html（日本語）か i18n.js（他言語）を編集して再実行します。
生成された index.html や en/index.html は直接編集しないでください（次回の生成で上書きされます）。
"""
import html
import json
import re
import shutil
import subprocess
import sys
from datetime import date
from pathlib import Path

BASE_URL = 'https://otb-ohmura.github.io/kbt-site/'   # 末尾は / で終える

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / 'src' / 'template.html'
I18N_JS = ROOT / 'i18n.js'

LANGS = ['ja', 'en', 'zh-Hans', 'zh-Hant', 'ko', 'th', 'vi', 'es', 'fr', 'ar']
LABELS = {
    'ja': ('JA', '日本語'), 'en': ('EN', 'English'), 'zh-Hans': ('简', '简体中文'), 'zh-Hant': ('繁', '繁體中文'),
    'ko': ('KO', '한국어'), 'th': ('TH', 'ไทย'), 'vi': ('VI', 'Tiếng Việt'), 'es': ('ES', 'Español'),
    'fr': ('FR', 'Français'), 'ar': ('AR', 'العربية'),
}
OG_LOCALE = {
    'ja': 'ja_JP', 'en': 'en_US', 'zh-Hans': 'zh_CN', 'zh-Hant': 'zh_TW', 'ko': 'ko_KR',
    'th': 'th_TH', 'vi': 'vi_VN', 'es': 'es_ES', 'fr': 'fr_FR', 'ar': 'ar_AR',
}
ARABIC_FONT = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;700&display=swap'


def slug(code):
    return '' if code == 'ja' else code.lower() + '/'


def load_translations():
    """i18n.js を JavaScript として評価して辞書を得る（Node があれば Node、無ければ macOS 標準の JXA）"""
    if shutil.which('node'):
        js = ("global.window={}; require(%s); process.stdout.write(JSON.stringify(window.KBT_I18N));"
              % json.dumps(str(I18N_JS)))
        out = subprocess.run(['node', '-e', js], capture_output=True, text=True, check=True).stdout
    elif shutil.which('osascript'):
        out = subprocess.run(['osascript', '-l', 'JavaScript', str(ROOT / 'tools' / 'extract_i18n.jxa.js'), str(I18N_JS)],
                             capture_output=True, text=True, check=True).stdout
    else:
        sys.exit('Node.js か macOS の osascript が必要です。')
    return json.loads(out)


def replace_inner(doc, key, value):
    """data-i18n="key" が付いた要素の中身を value に差し替える"""
    m = re.search(r'data-i18n="%s"' % re.escape(key), doc)
    if not m:
        raise KeyError(key)
    tag_start = doc.rfind('<', 0, m.start())
    tag_name = re.match(r'<([a-zA-Z0-9]+)', doc[tag_start:]).group(1)
    open_end = doc.index('>', m.end()) + 1
    depth = 1
    for t in re.finditer(r'<(/?)%s\b[^>]*?(/?)>' % tag_name, doc[open_end:]):
        if t.group(1):
            depth -= 1
        elif not t.group(2):
            depth += 1
        if depth == 0:
            close_start = open_end + t.start()
            return doc[:open_end] + value + doc[close_start:]
    raise ValueError('closing tag not found for ' + key)


def replace_placeholder(doc, key, value):
    def sub(m):
        tag = m.group(0)
        return re.sub(r'placeholder="[^"]*"', 'placeholder="%s"' % html.escape(value, quote=True), tag)
    doc, n = re.subn(r'<[^>]*data-i18n-ph="%s"[^>]*>' % re.escape(key), sub, doc)
    assert n == 1, key
    return doc


def set_attr_content(doc, selector_regex, value):
    doc, n = re.subn(selector_regex, lambda m: m.group(1) + html.escape(value, quote=True) + m.group(2), doc, count=1)
    assert n == 1, selector_regex
    return doc


def build_page(template, code, tr):
    doc = template
    d = tr.get(code, {})

    # 1) 本文の翻訳
    if code != 'ja':
        for key in re.findall(r'data-i18n="([^"]+)"', template):
            if key in d:
                doc = replace_inner(doc, key, d[key])
            else:
                print('  ! missing %s: %s' % (code, key))
        for key in re.findall(r'data-i18n-ph="([^"]+)"', template):
            if key in d:
                doc = replace_placeholder(doc, key, d[key])

    # 2) html の lang / dir
    dir_attr = ' dir="rtl"' if code == 'ar' else ''
    doc = doc.replace('<html lang="ja">', '<html lang="%s"%s>' % (code, dir_attr), 1)

    # 3) タイトル・説明・OGP
    title = re.search(r'<title>(.*?)</title>', template, re.S).group(1)
    desc = re.search(r'<meta name="description" content="([^"]*)"', template).group(1)
    og_title = re.search(r'<meta property="og:title" content="([^"]*)"', template).group(1)
    if code != 'ja':
        title = html.escape(d.get('meta.title', title))
        desc = html.escape(d.get('meta.desc', desc), quote=True)
        og_title = title
        doc = re.sub(r'<title>.*?</title>', '<title>%s</title>' % title, doc, count=1, flags=re.S)
        doc = re.sub(r'(<meta name="description" content=")[^"]*(")', lambda m: m.group(1) + desc + m.group(2), doc, count=1)
        doc = re.sub(r'(<meta property="og:title" content=")[^"]*(")', lambda m: m.group(1) + og_title + m.group(2), doc, count=1)

    url = BASE_URL + slug(code)
    head = ['  <link rel="canonical" href="%s" />' % url]
    for c in LANGS:
        head.append('  <link rel="alternate" hreflang="%s" href="%s" />' % (c, BASE_URL + slug(c)))
    head.append('  <link rel="alternate" hreflang="x-default" href="%s" />' % (BASE_URL + slug('en')))
    head += [
        '  <meta property="og:url" content="%s" />' % url,
        '  <meta property="og:description" content="%s" />' % desc,
        '  <meta property="og:site_name" content="KBT Inc." />',
        '  <meta property="og:locale" content="%s" />' % OG_LOCALE[code],
    ] + ['  <meta property="og:locale:alternate" content="%s" />' % OG_LOCALE[c] for c in LANGS if c != code] + [
        '  <meta name="twitter:card" content="summary" />',
    ]
    if code == 'ar':
        head.append('  <link rel="stylesheet" href="%s">' % ARABIC_FONT)
    doc = doc.replace('</head>', '\n'.join(head) + '\n</head>', 1)

    # 4) 言語メニューの表示
    doc = doc.replace('<span id="lang-code" class="sm:hidden">JA</span>',
                      '<span id="lang-code" class="sm:hidden">%s</span>' % LABELS[code][0], 1)
    doc = doc.replace('<span id="lang-current" class="hidden sm:inline">日本語</span>',
                      '<span id="lang-current" class="hidden sm:inline">%s</span>' % LABELS[code][1], 1)
    doc = doc.replace('data-lang="%s" lang="%s"' % (code, code),
                      'data-lang="%s" lang="%s" aria-checked="true"' % (code, code), 1)
    doc = re.sub(r'(role="menuitemradio" data-lang="[^"]+" lang="[^"]+")(?! aria-checked)', r'\1 aria-checked="false"', doc)
    doc = doc.replace('<input type="hidden" name="language" value="ja">',
                      '<input type="hidden" name="language" value="%s">' % LABELS[code][1], 1)

    # 5) 相対パス
    doc = doc.replace('{{ROOT}}', './' if code == 'ja' else '../')
    assert '{{' not in doc, 'unresolved placeholder in ' + code
    return doc


def main():
    template = TEMPLATE.read_text(encoding='utf-8')
    tr = load_translations()
    banner = '<!-- このファイルは tools/build.py が src/template.html と i18n.js から自動生成しています。直接編集しないでください。 -->\n'
    for code in LANGS:
        out = ROOT / slug(code) / 'index.html'
        out.parent.mkdir(parents=True, exist_ok=True)
        page = build_page(template, code, tr)
        page = page.replace('<!DOCTYPE html>\n', '<!DOCTYPE html>\n' + banner, 1)
        out.write_text(page, encoding='utf-8')
        print('  wrote', out.relative_to(ROOT))

    today = date.today().isoformat()
    urls = []
    for code in LANGS:
        alts = '\n'.join('    <xhtml:link rel="alternate" hreflang="%s" href="%s"/>' % (c, BASE_URL + slug(c)) for c in LANGS)
        alts += '\n    <xhtml:link rel="alternate" hreflang="x-default" href="%s"/>' % (BASE_URL + slug('en'))
        urls.append('  <url>\n    <loc>%s</loc>\n    <lastmod>%s</lastmod>\n%s\n  </url>' % (BASE_URL + slug(code), today, alts))
    sitemap = ('<?xml version="1.0" encoding="UTF-8"?>\n'
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
               + '\n'.join(urls) + '\n</urlset>\n')
    (ROOT / 'sitemap.xml').write_text(sitemap, encoding='utf-8')
    (ROOT / 'robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: %ssitemap.xml\n' % BASE_URL, encoding='utf-8')
    print('  wrote sitemap.xml, robots.txt')


if __name__ == '__main__':
    main()
