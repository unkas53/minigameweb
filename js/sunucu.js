// Sunucu bağlantısı (Supabase): liderlik tablosu, hesap/yedekleme ve çevrim içi oyun odaları.
// Aşağıdaki iki ayar boşsa sunucu özellikleri sitede hiç görünmez ve hiçbir istek atılmaz.
// Anon (publishable) anahtar herkese açık olacak şekilde tasarlanmıştır; güvenliği veritabanındaki
// RLS kuralları sağlar (supabase/kurulum.sql). service_role / secret anahtarı ASLA buraya yazılmaz.
// Kütüphane (js/vendor/supabase-*.js) yalnızca sunucu ilk kez gerektiğinde yüklenir.
// Oyun sayfalarında js/oyun.js'den önce yüklenmelidir.
(function () {
  var SUPABASE_URL = 'https://ayatemjvbwysvkzphqbn.supabase.co';
  var SUPABASE_ANAHTAR = 'sb_publishable_u0RCQXZMxubEMCH9DUO5ZQ_VsVvS6Wr';
  var KUTUPHANE = 'vendor/supabase-2.117.2.js';
  var PROFILE_KEY = 'mo_profil';

  var me = document.currentScript;
  var jsDir = me ? me.src.replace(/[^/]*$/, '') : '';
  var siteRoot = jsDir.replace(/js\/$/, '');
  var clientP = null, sessionP = null, backupTimer = null;
  // Testler window.MO_SUNUCU_KAPALI ile sunucuyu kapatabilir
  var hazir = !!(SUPABASE_URL && SUPABASE_ANAHTAR) && !window.MO_SUNUCU_KAPALI;

  function load(key, def) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v === null ? def : v; } catch (e) { return def; }
  }
  function save(key, v) {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {}
  }
  function hata(r) {
    if (r.error) throw r.error;
    return r.data;
  }

  // Testler window.MO_SUNUCU_TEST ile sahte bir istemci verebilir.
  function istemci() {
    if (!MiniOyun.sunucu.hazir) return Promise.reject(new Error('sunucu ayarlı değil'));
    if (clientP) return clientP;
    clientP = new Promise(function (resolve, reject) {
      if (window.MO_SUNUCU_TEST) return resolve(window.MO_SUNUCU_TEST);
      var s = document.createElement('script');
      s.src = jsDir + KUTUPHANE;
      s.onload = function () {
        resolve(window.supabase.createClient(SUPABASE_URL, SUPABASE_ANAHTAR, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        }));
      };
      s.onerror = function () { clientP = null; reject(new Error('kütüphane yüklenemedi')); };
      document.head.appendChild(s);
    });
    return clientP;
  }

  // Takma adı olmayana "Oyuncu1234" gibi bir ad verilir; profil sayfasından değiştirilebilir.
  function profil() {
    var p = load(PROFILE_KEY, {});
    if (!p.ad) {
      p.ad = 'Oyuncu' + (1000 + Math.floor(Math.random() * 9000));
      save(PROFILE_KEY, p);
    }
    return p;
  }

  function profilGonder(c, user) {
    var p = profil();
    return c.from('profiller').upsert({ id: user.id, takma_ad: p.ad.slice(0, 20), avatar: p.avatar || '🙂', guncelleme: new Date().toISOString() }).then(hata);
  }

  // Oturum yoksa anonim oturum açar (e-posta veya şifre istemez).
  function oturum() {
    if (sessionP) return sessionP;
    sessionP = istemci().then(function (c) {
      return c.auth.getSession().then(function (r) {
        var s = r.data && r.data.session;
        if (s) return s.user;
        return c.auth.signInAnonymously().then(function (r2) {
          var user = hata(r2).user;
          return profilGonder(c, user).then(function () { return user; });
        });
      });
    });
    sessionP.catch(function () { sessionP = null; });
    return sessionP;
  }

  // Varsa mevcut kullanıcı; yoksa null (yeni oturum açmaz)
  function kullanici() {
    if (!MiniOyun.sunucu.hazir) return Promise.resolve(null);
    return istemci().then(function (c) {
      return c.auth.getSession().then(function (r) { return (r.data && r.data.session && r.data.session.user) || null; });
    }, function () { return null; });
  }

  // ---------- Liderlik tablosu ----------
  // o: { oyun, seviye, skor, kucukIyi, gunluk } → oyuncunun sırası
  function skorGonder(o) {
    return oturum().then(function (user) {
      return istemci().then(function (c) {
        return c.rpc('skor_gonder', { p_oyun: o.oyun, p_seviye: o.seviye || '', p_skor: Math.round(o.skor), p_kucuk_iyi: !!o.kucukIyi, p_gunluk: !!o.gunluk }).then(hata);
      }).then(function (sira) {
        yedekleSonra(user);
        return sira;
      });
    });
  }

  // seviye null ise tüm seviyeler birlikte (günlük tablo için)
  function liderler(oyun, seviye, gun, limit) {
    return istemci().then(function (c) {
      return c.rpc('liderler', { p_oyun: oyun, p_seviye: seviye === null ? null : seviye || '', p_gun: gun || null, p_limit: limit || 20 }).then(hata);
    });
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function skorYaz(v, birim) {
    if (birim === 'sn') return v >= 60 ? Math.floor(v / 60) + ':' + ('0' + v % 60).slice(-2) : v + ' sn';
    return v + ' ' + (birim === 'hamle' ? 'hamle' : 'puan');
  }

  // Tabloyu kutuya çizer. o: { oyun, seviye, gun, birim, limit }
  function tabloCiz(kutu, o) {
    kutu.innerHTML = '';
    kutu.appendChild(el('p', 'lider-durum', 'Yükleniyor…'));
    return liderler(o.oyun, o.seviye, o.gun, o.limit).then(function (rows) {
      kutu.innerHTML = '';
      if (!rows || !rows.length) {
        kutu.appendChild(el('p', 'lider-durum', o.gun ? 'Bugün henüz kimse bitirmedi. İlk sen ol!' : 'Henüz skor yok. İlk sen ol!'));
        return;
      }
      var ol = el('ol', 'lider-liste');
      rows.forEach(function (r) {
        var li = el('li', r.ben ? 'ben' : '');
        li.appendChild(el('span', 'lider-sira', r.sira <= 3 ? ['🥇', '🥈', '🥉'][r.sira - 1] : String(r.sira)));
        li.appendChild(el('span', 'lider-avatar', r.avatar));
        li.appendChild(el('span', 'lider-ad', r.takma_ad + (r.ben ? ' (sen)' : '')));
        li.appendChild(el('span', 'lider-skor', skorYaz(r.skor, o.birim)));
        ol.appendChild(li);
      });
      kutu.appendChild(ol);
    }, function () {
      kutu.innerHTML = '';
      kutu.appendChild(el('p', 'lider-durum', 'Liderlik tablosu şu an yüklenemedi. Biraz sonra tekrar dene.'));
    });
  }

  // ---------- Hesap ve yedekleme ----------
  function anahtarlar() {
    var keys = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if ((k.indexOf('mo_') === 0 || k.indexOf('-en-iyi-') !== -1) && k !== 'mo_cookie_consent') keys.push(k);
      }
    } catch (e) {}
    return keys;
  }
  function yerelVeri() {
    var data = {};
    anahtarlar().forEach(function (k) { data[k] = localStorage.getItem(k); });
    return data;
  }
  // Hangi kaydın daha "dolu" olduğunu bitirilen oyun sayısıyla ölçer
  function agirlik(data) {
    try {
      var b = JSON.parse(data.mo_istatistik || '{}').bitirme || {}, n = 0;
      for (var k in b) n += b[k];
      return n;
    } catch (e) { return 0; }
  }

  function epostaliMi(user) { return !!(user && user.email && !user.is_anonymous); }

  function yedekle() {
    return kullanici().then(function (user) {
      if (!epostaliMi(user)) return false;
      return istemci().then(function (c) {
        return c.from('kayitlar').upsert({ id: user.id, veri: yerelVeri(), guncelleme: new Date().toISOString() }).then(hata);
      }).then(function () { return true; });
    });
  }
  function yedekleSonra(user) {
    if (!epostaliMi(user)) return;
    clearTimeout(backupTimer);
    backupTimer = setTimeout(function () { yedekle().catch(function () {}); }, 1500);
  }

  // Giriş yapınca: buluttaki kayıt daha doluysa cihaza yüklenir, değilse cihazdaki buluta yazılır.
  // Sonuç: 'yuklendi' | 'yedeklendi' | null
  function esitle() {
    return kullanici().then(function (user) {
      if (!epostaliMi(user)) return null;
      return istemci().then(function (c) {
        return c.from('kayitlar').select('veri').eq('id', user.id).maybeSingle().then(hata);
      }).then(function (row) {
        var local = yerelVeri();
        if (row && row.veri && agirlik(row.veri) > agirlik(local)) {
          Object.keys(row.veri).forEach(function (k) {
            if (typeof row.veri[k] === 'string' && (k.indexOf('mo_') === 0 || k.indexOf('-en-iyi-') !== -1)) localStorage.setItem(k, row.veri[k]);
          });
          return 'yuklendi';
        }
        return yedekle().then(function () { return 'yedeklendi'; });
      });
    });
  }

  // E-posta ile hesabı bağlar veya başka cihazdaki hesaba giriş bağlantısı gönderir.
  // Sonuç: 'bagla' (bu cihazdaki ilerleme e-postaya bağlanacak) | 'giris' (mevcut hesaba giriş)
  function epostaGonder(adres) {
    var donus = siteRoot + 'profil.html';
    return oturum().then(function (user) {
      return istemci().then(function (c) {
        function giris() {
          return c.auth.signInWithOtp({ email: adres, options: { shouldCreateUser: false, emailRedirectTo: donus } }).then(hata).then(function () { return 'giris'; });
        }
        if (!user.is_anonymous) return giris();
        return c.auth.updateUser({ email: adres }, { emailRedirectTo: donus }).then(function (r) {
          if (r.error && (r.error.code === 'email_exists' || /already/i.test(r.error.message || ''))) return giris();
          hata(r);
          return 'bagla';
        });
      });
    });
  }

  function cikis() {
    return istemci().then(function (c) {
      return c.auth.signOut().then(function () { sessionP = null; });
    });
  }

  // Hesabı, profili, skorları ve buluttaki kaydı kalıcı olarak siler
  function hesapSil() {
    return istemci().then(function (c) {
      return c.rpc('hesap_sil').then(hata).then(function () {
        return c.auth.signOut({ scope: 'local' });
      }).then(function () { sessionP = null; });
    });
  }

  // Profil değişince (takma ad, avatar) oturum varsa sunucuya da yazılır
  var profilTimer = null;
  function profilDegisti() {
    clearTimeout(profilTimer);
    profilTimer = setTimeout(function () {
      kullanici().then(function (user) {
        if (!user) return;
        return istemci().then(function (c) { return profilGonder(c, user); });
      }).catch(function () {});
    }, 800);
  }

  // ---------- Çevrim içi odalar (Realtime broadcast + presence) ----------
  function kanal(ad, anahtar) {
    return oturum().then(function () {
      return istemci().then(function (c) {
        return c.channel(ad, { config: { broadcast: { self: false, ack: true }, presence: { key: anahtar } } });
      });
    });
  }
  function kanalBirak(ch) {
    return istemci().then(function (c) { return c.removeChannel(ch); }).catch(function () {});
  }

  window.MiniOyun = window.MiniOyun || {};
  MiniOyun.sunucu = {
    get hazir() { return hazir || !!window.MO_SUNUCU_TEST; },
    oturum: oturum,
    kullanici: kullanici,
    skorGonder: skorGonder,
    liderler: liderler,
    tabloCiz: tabloCiz,
    skorYaz: skorYaz,
    epostaGonder: epostaGonder,
    esitle: esitle,
    yedekle: yedekle,
    cikis: cikis,
    hesapSil: hesapSil,
    profilDegisti: profilDegisti,
    kanal: kanal,
    kanalBirak: kanalBirak
  };
})();
