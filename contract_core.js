/* Ядро договора: одинаково работает в браузере и в Google Apps Script. */
var ContractCore = (function () {
  var MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  var ONES_M = ['','один','два','три','четыре','пять','шесть','семь','восемь','девять'];
  var ONES_F = ['','одна','две','три','четыре','пять','шесть','семь','восемь','девять'];
  var TEENS = ['десять','одиннадцать','двенадцать','тринадцать','четырнадцать','пятнадцать','шестнадцать','семнадцать','восемнадцать','девятнадцать'];
  var TENS = ['','','двадцать','тридцать','сорок','пятьдесят','шестьдесят','семьдесят','восемьдесят','девяносто'];
  var HUND = ['','сто','двести','триста','четыреста','пятьсот','шестьсот','семьсот','восемьсот','девятьсот'];

  function triple(n, fem) {
    var s = [], h = Math.floor(n / 100), t = Math.floor(n % 100 / 10), o = n % 10;
    if (h) s.push(HUND[h]);
    if (t === 1) s.push(TEENS[o]);
    else { if (t) s.push(TENS[t]); if (o) s.push((fem ? ONES_F : ONES_M)[o]); }
    return s.join(' ');
  }
  function plural(n, a, b, c) {
    var m = n % 100, d = n % 10;
    if (m >= 11 && m <= 19) return c;
    if (d === 1) return a;
    if (d >= 2 && d <= 4) return b;
    return c;
  }
  function numToWords(n) {
    n = Math.floor(n);
    if (n === 0) return 'ноль';
    var parts = [];
    var mil = Math.floor(n / 1000000), th = Math.floor(n % 1000000 / 1000), rest = n % 1000;
    if (mil) parts.push(triple(mil, false) + ' ' + plural(mil, 'миллион', 'миллиона', 'миллионов'));
    if (th) parts.push(triple(th, true) + ' ' + plural(th, 'тысяча', 'тысячи', 'тысяч'));
    if (rest) parts.push(triple(rest, false));
    var r = parts.join(' ').replace(/\s+/g, ' ').trim();
    return r.charAt(0).toUpperCase() + r.slice(1);
  }
  function fmtMoney(n) { return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  /* дата в Москве (UTC+3) без зависимости от часового пояса машины */
  function msk(date) { return new Date(date.getTime() + 3 * 3600 * 1000); }
  function parts(date) {
    var d = msk(date);
    return { d: d.getUTCDate(), m: d.getUTCMonth(), y: d.getUTCFullYear(), hh: d.getUTCHours(), mm: d.getUTCMinutes(), ss: d.getUTCSeconds() };
  }
  function dateLong(date) { var p = parts(date); return '«' + pad(p.d) + '» ' + MONTHS[p.m] + ' ' + p.y + ' г.'; }
  function dateShort(date) { var p = parts(date); return pad(p.d) + '.' + pad(p.m + 1) + '.' + String(p.y).slice(2); }
  function dateTime(date) { var p = parts(date); return pad(p.d) + '.' + pad(p.m + 1) + '.' + p.y + ' ' + pad(p.hh) + ':' + pad(p.mm) + ':' + pad(p.ss) + ' (МСК)'; }
  function mmyy(date) { var p = parts(date); return pad(p.m + 1) + String(p.y).slice(2); }
  function endDate(date, months) {
    var d = new Date(date.getTime()); d.setUTCFullYear(d.getUTCFullYear() + Math.floor(months / 12));
    d.setUTCDate(d.getUTCDate() - 1); return d;
  }
  function shortName(fio) {
    var w = String(fio).trim().split(/\s+/);
    if (w.length < 2) return fio;
    return w[0] + ' ' + w[1].charAt(0) + '.' + (w[2] ? ' ' + w[2].charAt(0) + '.' : '');
  }

  function fill(text, d) {
    return text.replace('{{price_fmt}}', fmtMoney(d.tariff.price)).replace('{{price_words}}', numToWords(d.tariff.price));
  }

  var CSS = '@page{size:A4;margin:16mm 14mm}tr,.sig{page-break-inside:avoid}h2{page-break-after:avoid}' +
    'body{font-family:"Times New Roman",Times,serif;font-size:11pt;line-height:1.3;color:#000}' +
    'h1{font-size:13pt;text-align:center;margin:0 0 8px}h2{font-size:11pt;text-align:center;margin:12px 0 4px}' +
    'p{margin:0 0 4px;text-align:justify}.c{text-align:center}.r{text-align:right}' +
    'table{border-collapse:collapse;width:100%}td,th{vertical-align:top;padding:4px;font-size:10.5pt}' +
    '.bd td,.bd th{border:1px solid #000}.sig{height:60px}.esign{margin-top:14px;padding:8px;border:1px solid #444;font-size:9.5pt}';

  /* d: number, date (Date), fio, passport, inn, snils, address, email, phone, tariff{name,hours,price,months},
     signature (dataURL|null), signedAt (Date|null), proof (строка о подтверждении) */
  function buildHtml(d, body, cfg) {
    var e = cfg.executor, h = [];
    var dt = d.date;
    h.push('<html><head><meta charset="utf-8"><style>' + CSS + '</style></head><body>');
    h.push('<h1>Договор на оказание услуг по дистанционному обучению №' + esc(d.number) + '</h1>');
    h.push('<table><tr><td>г. Казань</td><td class="r">' + dateLong(dt) + '</td></tr></table>');
    h.push('<p>' + esc(e.intro) + ' с одной стороны, и Гражданка (-ин) РФ ' +
      esc(d.fio) + ', (паспорт ' + esc(d.passport) + '), именуемая(-мый) в дальнейшем «Заказчик», совместно именуемые «Стороны», заключили настоящий Договор (далее — «Договор») о нижеследующем:</p>');
    for (var i = 0; i < body.length; i++) {
      var t = body[i];
      if (t.indexOf('## ') === 0) h.push('<h2>' + esc(t.slice(3)) + '</h2>');
      else h.push('<p>' + esc(fill(t, d)) + '</p>');
    }
    h.push('<h2>12. РЕКВИЗИТЫ И ПОДПИСИ СТОРОН</h2>');
    var stamp = cfg.executorStamp ? '<img src="' + cfg.executorStamp + '" height="90" style="margin-left:-6px">' : '';
    var xsig = cfg.executorSignature ? '<img src="' + cfg.executorSignature + '" height="45">' : '';
    h.push('<table><tr><td width="50%"><b>ИСПОЛНИТЕЛЬ:</b><br>' + e.lines.map(esc).join('<br>') +
      '<div class="sig" style="height:95px">' + xsig + stamp + '</div>Подпись ___________________/' + esc(e.short) + '/<br>М.П.</td>');
    h.push('<td width="50%"><b>ЗАКАЗЧИК:</b><br>Гражданка (-ин) РФ<br>' + esc(d.fio) + '<br>ИНН: ' + esc(d.inn) + '<br>СНИЛС: ' + esc(d.snils) + '<br>Паспорт: ' + esc(d.passport) +
      '<br>Адрес: ' + esc(d.address) + '<br>Электронная почта: ' + esc(d.email) + '<br>Телефон: ' + esc(d.phone) +
      '<div class="sig">' + (d.signature ? '<img src="' + d.signature + '" height="55">' : '') + '</div>Подпись_____________/' + esc(shortName(d.fio)) + '/</td></tr></table>');
    var from = dt, to = endDate(dt, d.tariff.months || 12);
    h.push('<div style="page-break-before:always"></div><p class="r">Приложение №1<br>К Договору №' + esc(d.number) + '<br>От ' + dateLong(dt) + '</p>');
    h.push('<h1>ПЕРЕЧЕНЬ УСЛУГ</h1><table class="bd"><tr><th>№ п/п</th><th>Наименование</th><th>Длительность обучения, ак. час.</th><th>Сроки проведения обучения</th><th>Цена, руб.</th><th>Кол-во</th><th>Сумма, руб.</th></tr>');
    h.push('<tr><td>1</td><td>' + esc(d.tariff.name) + '</td><td>' + esc(d.tariff.hours) + '</td><td>С ' + dateShort(from) + ' г. по ' + dateShort(to) + ' г.</td><td>' + fmtMoney(d.tariff.price) + '</td><td>1</td><td>' + fmtMoney(d.tariff.price) + '</td></tr>');
    h.push('<tr><td colspan="6" class="r"><b>ИТОГО:</b><br>(НДС не облагается)</td><td>' + fmtMoney(d.tariff.price) + '</td></tr></table>');
    h.push('<table style="margin-top:20px"><tr><td width="50%"><b>ОТ ИСПОЛНИТЕЛЯ</b><br>' + (cfg.executorSignature ? '<img src="' + cfg.executorSignature + '" height="45"><br>' : '<br>') + '/' + esc(e.short) + '/</td><td><b>ОТ ЗАКАЗЧИКА</b><br><br>' +
      (d.signature ? '<img src="' + d.signature + '" height="45"><br>' : '') + '_____________/' + esc(shortName(d.fio)) + '/</td></tr></table>');
    if (d.proof) h.push('<div class="esign">' + esc(d.proof) + '</div>');
    h.push('</body></html>');
    return h.join('\n');
  }
  return { buildHtml: buildHtml, numToWords: numToWords, fmtMoney: fmtMoney, dateTime: dateTime, mmyy: mmyy, dateLong: dateLong, shortName: shortName, fill: fill };
})();
if (typeof module !== 'undefined') module.exports = ContractCore;
