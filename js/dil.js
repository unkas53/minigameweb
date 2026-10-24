// Çoklu dil desteği. Site Türkçe yazılır; diğer dillerde Türkçe metinler tarayıcıda diller/<kod>/*.json sözlükleriyle çevrilir.
// Dil seçimi: ?lang=xx > kayıtlı seçim (mo_dil) > tarayıcı dili. Arama motoru botları ve Türkiye saat dilimi Türkçe görür.
// Sözlük: { "Türkçe metin": "çeviri" }. {0}, {1} içeren anahtarlar kalıptır ("{0} oyun": "{0} games").
// "<" içeren anahtarlar, içinde yalnızca biçim etiketleri (a, b, strong, em...) olan bir öğenin innerHTML'idir.
// translate="no" veya data-dil="yok" taşıyan öğeler çevrilmez. Canvas/alert metinleri için: MO_DIL.t('Bölüm {0}', 3).
// Bu betiği tools/build-pages.js her sayfanın <head> kısmına ekler (data-diller, data-sayfa, data-var).
(function () {
  var script = document.currentScript;
  var KOK = script ? script.src.replace(/js\/dil\.js.*$/, '') : '';
  var ONEK = script ? (script.getAttribute('src') || '').replace(/js\/dil\.js.*$/, '') : ''; // sayfanın köke göreli yolu: '', '../', '../../'
  var attr = function (n) { return script ? script.getAttribute(n) || '' : ''; };
  var DILLER = ('tr,' + attr('data-diller')).split(',').filter(function (d, i, a) { return d && a.indexOf(d) === i; });
  var SAYFA = attr('data-sayfa');
  var VAR = attr('data-var').split(',');
  var ANAHTAR = 'mo_dil';
  var TOPLA = !!window.MO_DIL_TOPLA || /[?&]dil-topla\b/.test(location.search);

  function oku() { try { return localStorage.getItem(ANAHTAR); } catch (e) { return null; } }
  function yaz(d) { try { localStorage.setItem(ANAHTAR, d); } catch (e) {} }
  function var_(d) { return DILLER.indexOf(d) !== -1; }

  var urlDil = (location.search.match(/[?&]lang=([a-z]{2})\b/) || [])[1] || null;
  function sec() {
    if (urlDil && var_(urlDil)) { yaz(urlDil); return urlDil; }
    var s = oku();
    if (s && var_(s)) return s;
    if (/bot|crawl|spider|slurp|lighthouse/i.test(navigator.userAgent)) return 'tr';
    try { if (Intl.DateTimeFormat().resolvedOptions().timeZone === 'Europe/Istanbul') return 'tr'; } catch (e) {}
    var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    for (var i = 0; i < list.length; i++) {
      var k = String(list[i]).slice(0, 2).toLowerCase();
      if (k === 'tr' || var_(k)) return k;
    }
    return var_('en') ? 'en' : 'tr';
  }
  var DIL = sec();

  // ---------- Sözlük ----------
  var htmlKalip = []; // "<b>{0}</b> oyun" gibi sayı içeren HTML anahtarları
  var metin = {}, html = {}, kaliplar = [], onbellek = {}, eksik = {}, ceviri = {};
  var norm = function (s) { return String(s).replace(/\s+/g, ' ').trim(); };
  var turkce = function (s) { return /[A-Za-zÇĞİÖŞÜçğıöşü]{2,}/.test(s); };
  var sessiz = 0; // bütün olarak çevrilmesi beklenen öğenin parçaları ayrıca eksik sayılmaz
  function topla(s) { if (TOPLA && !sessiz && turkce(s.replace(/<[^>]*>/g, ' '))) eksik[s] = 1; }

  function yukle(sozluk) {
    for (var k in sozluk) {
      if (!Object.prototype.hasOwnProperty.call(sozluk, k) || typeof sozluk[k] !== 'string') continue;
      var n = norm(k), v = sozluk[k];
      if (n.indexOf('<') !== -1) {
        html[n] = v;
        if (/\{\d\}/.test(n)) htmlKalip.push({ re: new RegExp('^' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{(\d)\\\}/g, '([^<>]+?)') + '$'), cevap: v });
      } else if (/\{\d\}/.test(n)) {
        var re = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{(\d)\\\}/g, '(.+?)');
        kaliplar.push({ re: new RegExp('^' + re + '$'), cevap: v, uzunluk: n.replace(/\{\d\}/g, '').length, anahtar: n });
      }
      metin[n] = v;
    }
    kaliplar.sort(function (a, b) { return b.uzunluk - a.uzunluk; });
    onbellek = {};
  }

  // Baştaki/sondaki emoji, ok ve noktalama ayrı tutulur: "🗺️ Harita" -> "Harita" anahtarıyla çevrilir
  var KENAR;
  try { KENAR = new RegExp('^([^\\p{L}\\p{N}]*)([\\s\\S]*?)([^\\p{L}\\p{N}]*)$', 'u'); }
  catch (e) { KENAR = /^([^A-Za-z0-9ÇĞİÖŞÜçğıöşü]*)([\s\S]*?)([^A-Za-z0-9ÇĞİÖŞÜçğıöşü]*)$/; }
  var var_m = function (n) { return Object.prototype.hasOwnProperty.call(metin, n); };

  // Bir metnin çevirisini döndürür; yoksa null
  function bul(s, derin) {
    var c = ara(s, derin || 0);
    if (c) ceviri[norm(c)] = 1;
    return c;
  }
  // Kalıplarda arar: eşleşme yoksa null, eşleşen kalıbın çevirisi boşsa ''
  function kalip(n, derin) {
    for (var i = 0; i < kaliplar.length; i++) {
      var m = n.match(kaliplar[i].re);
      if (!m) continue;
      if (!kaliplar[i].cevap) return '';
      return kaliplar[i].cevap.replace(/\{(\d)\}/g, function (_, j) {
        var p = m[+j + 1];
        return p === undefined ? '' : (derin < 4 && bul(p, derin + 1)) || p;
      });
    }
    return null;
  }
  function ara(s, derin) {
    var n = norm(s);
    if (!n || !turkce(n) || ceviri[n]) return null;
    if (var_m(n)) return metin[n] || null;
    if (Object.prototype.hasOwnProperty.call(onbellek, n)) return onbellek[n];
    // Sıra: tam metin, kenarları ayrılmış tam metin, kalıp, kenarları ayrılmış kalıp
    var m = n.match(KENAR), kenar = m && (m[1] || m[3]) && turkce(m[2]);
    var sonuc = null, bos = false;
    if (kenar && var_m(m[2])) { if (metin[m[2]]) sonuc = m[1] + metin[m[2]] + m[3]; else bos = true; }
    if (sonuc === null && !bos) {
      var r = kalip(n, derin);
      if (r) sonuc = r;
      else if (r === '') bos = true;
      else if (kenar) {
        var ic = kalip(m[2], derin);
        if (ic) sonuc = m[1] + ic + m[3];
        else if (ic === '') bos = true;
      }
    }
    if (sonuc === null && !bos && !derin) topla(kenar ? m[2] : n);
    onbellek[n] = sonuc;
    return sonuc;
  }

  // Kod içinden çeviri: MO_DIL.t('Bölüm {0}', 3) -> "Level 3"
  function t(s) {
    var args = Array.prototype.slice.call(arguments, 1);
    var doldur = function (x) { return String(x).replace(/\{(\d)\}/g, function (m, j) { return args[+j] !== undefined ? args[+j] : m; }); };
    if (DIL === 'tr') return doldur(s);
    var n = norm(s);
    if (metin[n]) return doldur(metin[n]);
    var dolu = doldur(s);
    var c = bul(dolu);
    if (c === null && args.length) topla(n);
    return c || dolu;
  }

  // ---------- DOM çevirisi ----------
  var ATLA = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, PRE: 1 };
  var BICIM = { A: 1, B: 1, STRONG: 1, EM: 1, I: 1, BR: 1, KBD: 1, SMALL: 1 };
  var NITELIK = ['title', 'placeholder', 'aria-label', 'alt'];
  var yazilan = typeof WeakMap === 'function' ? new WeakMap() : null;
  var bitti = typeof WeakSet === 'function' ? new WeakSet() : null; // innerHTML'i bütün olarak çevrilen öğeler

  function haric(el) {
    for (; el && el.nodeType === 1; el = el.parentNode) {
      if (ATLA[el.tagName] || el.getAttribute('translate') === 'no' || el.getAttribute('data-dil') === 'yok' || el.isContentEditable || (bitti && bitti.has(el))) return true;
    }
    return false;
  }

  function metniCevir(node) {
    var v = node.nodeValue;
    if (!v || (yazilan && yazilan.get(node) === v)) return;
    var c = bul(v);
    if (c === null) return;
    var yeni = v.match(/^\s*/)[0] + c + v.match(/\s*$/)[0];
    if (yazilan) yazilan.set(node, yeni);
    if (yeni !== v) node.nodeValue = yeni;
  }

  function niteligiCevir(el, a) {
    var v = el.getAttribute(a);
    if (!v) return;
    var c = bul(v);
    if (c !== null && c !== v) el.setAttribute(a, c);
  }

  // Yalnızca biçim etiketleri ve metin içeren, kimliksiz öğe mi? (innerHTML ile bütün olarak çevrilebilir)
  function karisik(el) {
    var yazi = false, etiket = false;
    for (var c = el.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) { if (c.nodeValue.trim()) yazi = true; }
      else if (c.nodeType === 1) {
        if (!BICIM[c.tagName] || c.id || c.querySelector('[id]')) return false;
        for (var d = c.firstElementChild; d; d = d.nextElementSibling) if (!BICIM[d.tagName]) return false;
        etiket = true;
      }
    }
    return yazi && etiket;
  }

  function linkDil(a) {
    var h = a.getAttribute('href');
    if (!h || /^([a-z]+:|\/\/|#|\?lang=)/i.test(h) || /[?&]lang=/.test(h)) return;
    var p = h.split('#');
    a.setAttribute('href', p[0] + (p[0].indexOf('?') === -1 ? '?' : '&') + 'lang=' + DIL + (p.length > 1 ? '#' + p.slice(1).join('#') : ''));
  }

  function cevir(root) {
    if (!root) return;
    if (root.nodeType === 3) { if (!haric(root.parentNode)) metniCevir(root); return; }
    if (root.nodeType !== 1 || haric(root)) return;
    var stack = [root];
    while (stack.length) {
      var el = stack.pop();
      if (ATLA[el.tagName] || el.getAttribute('translate') === 'no' || el.getAttribute('data-dil') === 'yok') continue;
      for (var i = 0; i < NITELIK.length; i++) if (el.hasAttribute(NITELIK[i])) niteligiCevir(el, NITELIK[i]);
      if (el.tagName === 'META' && /^(description|og:title|og:description|twitter:title|twitter:description)$/.test(el.getAttribute('name') || el.getAttribute('property') || '')) niteligiCevir(el, 'content');
      if (el.tagName === 'A' && urlDil) linkDil(el);
      if (el.firstChild && karisik(el)) {
        var h = norm(el.innerHTML);
        if (ONEK) h = h.split('="' + ONEK).join('="'); // göreli bağlantılar sayfa derinliğinden bağımsız anahtar olsun
        if (!html[h]) {
          for (var q = 0; q < htmlKalip.length; q++) {
            var hm = h.match(htmlKalip[q].re);
            if (hm && htmlKalip[q].cevap) { html[h] = htmlKalip[q].cevap.replace(/\{(\d)\}/g, function (_, j) { return hm[+j + 1] || ''; }); break; }
          }
        }
        if (html[h]) {
          ceviri[norm(html[h])] = 1;
          if (bitti) bitti.add(el);
          el.innerHTML = ONEK ? html[h].replace(/(href|src)="(?![a-z]+:|\/|#|\?)/gi, '$1="' + ONEK) : html[h];
          continue;
        }
        if (!html[h]) {
          if (!Object.prototype.hasOwnProperty.call(html, h) && !ceviri[h]) topla(h); // ceviri: çevrilmiş içerik başka öğeye kopyalanmış
          sessiz++;
          for (var k = el.firstChild; k; k = k.nextSibling) cevir(k);
          sessiz--;
          continue;
        }
      }
      for (var c = el.lastChild; c; c = c.previousSibling) {
        if (c.nodeType === 3) metniCevir(c);
        else if (c.nodeType === 1) stack.push(c);
      }
    }
  }

  function izle() {
    if (typeof MutationObserver !== 'function') return;
    new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        var m = list[i];
        if (m.type === 'childList') { for (var j = 0; j < m.addedNodes.length; j++) cevir(m.addedNodes[j]); }
        else if (m.type === 'characterData') { if (!haric(m.target.parentNode)) metniCevir(m.target); }
        else if (!haric(m.target)) niteligiCevir(m.target, m.attributeName);
      }
    }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: NITELIK });
  }

  // ---------- Dil menüsü (üst menüde, tools/build-pages.js üretir) ----------
  function menu() {
    var kodlar = document.querySelectorAll('.dil-menu .dil-kod');
    for (var i = 0; i < kodlar.length; i++) kodlar[i].textContent = DIL.toUpperCase();
    var linkler = document.querySelectorAll('.dil-menu a[hreflang]');
    for (var j = 0; j < linkler.length; j++) {
      if (linkler[j].getAttribute('hreflang') === DIL) linkler[j].setAttribute('aria-current', 'true');
    }
  }

  // ---------- Başlat ----------
  var bekleyen = [];
  var hazir = DIL === 'tr';
  window.MO_DIL = {
    dil: DIL,
    diller: DILLER,
    t: t,
    hazir: function (cb) { if (hazir) cb(); else bekleyen.push(cb); },
    eksik: function () { return Object.keys(eksik); }
  };

  var domHazir = new Promise(function (r) {
    if (document.readyState !== 'loading') r();
    else document.addEventListener('DOMContentLoaded', r);
  });
  domHazir.then(menu);
  if (DIL === 'tr') return;

  document.documentElement.lang = DIL;
  document.documentElement.classList.add('dil-bekle');
  var stil = document.createElement('style');
  stil.textContent = 'html.dil-bekle body{visibility:hidden}';
  document.head.appendChild(stil);
  var ac = function () { document.documentElement.classList.remove('dil-bekle'); };
  setTimeout(ac, 2500);

  var dosyalar = ['ortak'];
  if (SAYFA && VAR.indexOf(DIL) !== -1) dosyalar.push(SAYFA);
  var al = function (f) {
    return fetch(KOK + 'diller/' + DIL + '/' + f + '.json').then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; });
  };
  Promise.all(dosyalar.map(al)).then(function (list) {
    list.forEach(yukle);
    return domHazir;
  }).then(function () {
    if (urlDil) {
      var can = document.querySelector('link[rel="canonical"]');
      if (can) can.setAttribute('href', can.getAttribute('href').split('?')[0] + '?lang=' + DIL);
    }
    cevir(document.documentElement);
    izle();
    hazir = true;
    bekleyen.forEach(function (cb) { try { cb(); } catch (e) {} });
    ac();
  });
})();
