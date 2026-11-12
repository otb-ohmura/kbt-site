// macOS 標準の JavaScript (JXA) で i18n.js を読み込み、翻訳を JSON で出力する
// 使い方: osascript -l JavaScript tools/extract_i18n.jxa.js /path/to/i18n.js
function run(argv) {
  ObjC.import('Foundation');
  var src = $.NSString.stringWithContentsOfFileEncodingError(argv[0], $.NSUTF8StringEncoding, null).js;
  var window = {};
  (new Function('window', src))(window);
  return JSON.stringify(window.KBT_I18N);
}
