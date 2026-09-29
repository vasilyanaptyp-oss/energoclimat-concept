/* Техенергооблік — homepage concept. Vanilla JS, no build step. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  var TG_URL = 'https://t.me/energo_climat';
  var VIBER_URL = 'viber://chat?number=%2B380962433748';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(s, root) { return (root || document).querySelector(s); }
  function $$(s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

  /* ---------- Toast ---------- */
  var toastEl = $('#toast'), toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3800);
  }

  /* ---------- Mobile menu ---------- */
  var menuBtn = $('#menuBtn');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    if (menuBtn) menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () { setMenu(!document.body.classList.contains('menu-open')); });
    $$('#mainNav a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------- Odometer (real prices from energo-climat.com price lists) ---------- */
  var ODO_ITEMS = [
    { v: 600, t: 'Повірка 1 лічильника води без зняття' },
    { v: 700, t: 'Заміна 1 лічильника води з постановкою на облік' },
    { v: 6500, t: 'Лічильник тепла Gross під ключ, з проєктом' },
    { v: 1800, t: 'Монтаж бойлера до готових підводів', from: true }
  ];
  var DIGITS = 5;
  var odo = $('#odo'), odoCap = $('#odoCaption'), odoDots = $('#odoDots');
  var odoIdx = 0, odoTimer;
  if (odo) {
    for (var i = 0; i < DIGITS; i++) {
      var cell = document.createElement('div');
      cell.className = 'odo-cell' + (i === DIGITS - 1 ? ' is-last' : '');
      var strip = document.createElement('div');
      strip.className = 'odo-strip';
      for (var d = 0; d <= 9; d++) { var s = document.createElement('span'); s.textContent = d; strip.appendChild(s); }
      cell.appendChild(strip);
      odo.appendChild(cell);
    }
    ODO_ITEMS.forEach(function (item, k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', item.t);
      b.addEventListener('click', function () { showOdo(k); restartOdo(); });
      odoDots.appendChild(b);
    });
    showOdo(0);
    restartOdo();
  }
  function showOdo(k) {
    odoIdx = k;
    var str = String(ODO_ITEMS[k].v);
    while (str.length < DIGITS) str = '0' + str;
    var leadEnd = str.length - String(ODO_ITEMS[k].v).length;
    $$('.odo-cell', odo).forEach(function (cell, idx) {
      var digit = parseInt(str.charAt(idx), 10);
      cell.firstChild.style.transform = 'translateY(' + (-42 * digit) + 'px)';
      cell.classList.toggle('is-lead', idx < leadEnd);
    });
    if (odoCap) odoCap.textContent = ODO_ITEMS[k].t + ' — ' + (ODO_ITEMS[k].from ? 'від ' : '') + fmt(ODO_ITEMS[k].v) + ' грн';
    $$('button', odoDots).forEach(function (b, idx) { b.classList.toggle('is-active', idx === k); });
  }
  function restartOdo() {
    clearInterval(odoTimer);
    if (reduceMotion) return;
    odoTimer = setInterval(function () { showOdo((odoIdx + 1) % ODO_ITEMS.length); }, 3600);
  }

  /* ---------- Service filter ---------- */
  var chips = $$('.chip');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-filter');
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      $$('.svc').forEach(function (card) {
        card.classList.toggle('is-hidden', f !== 'all' && card.getAttribute('data-cat') !== f);
      });
    });
  });

  /* ---------- Calculator ----------
     Prices: energo-climat.com/uk/lichilniki-vodi/, /povirka-lichylnykiv-vody-u-kyevi-ta-oblasti/, /lichilniki-tepla/ */
  var P = {
    replace: { own: { 1: 700, 2: 1250 }, ours: { gross: { 1: 1470, 2: 2620 }, picoflux: { 1: 1700, 2: 2900 }, zenner: { 1: 1870, 2: 3120 } } },
    'new': { own: { 1: 1550, 2: 2050 }, ours: { gross: { 1: 2630, 2: 4350 }, picoflux: { 1: 2790, 2: 4590 }, zenner: { 1: 2860, 2: 4860 } } },
    verify: { 1: 600, 2: 1000, 4: 1900 },
    heat: { gross: 6500, grossm: 6900, uhm: 7400, apator: 9350, t230: 9600 }
  };
  var BRAND = { gross: 'Metron / Gross, Україна', picoflux: 'Picoflux, Польща', zenner: 'Zenner, Німеччина' };
  var MODEL = { gross: 'Gross DN15/20, механічний', grossm: 'Gross DN15/20 з M-Bus', uhm: 'Metron UHM DN15 з M-Bus, ультразвуковий', apator: 'Apator DN15/20', t230: 'Ultraheat T-230' };
  var INCL = {
    replace: ['Демонтаж старих і монтаж нових лічильників', 'Постановка на облік і пакет документів', 'Заявка на опломбування — безкоштовно', 'Гарантія на роботу 24 місяці'],
    'new': ['Монтаж вузла обліку', 'Постановка на облік і пакет документів', 'Заявка на опломбування — безкоштовно', 'Гарантія на роботу 24 місяці'],
    verify: ['Повірка на місці станцією АС-П, 20–30 хв', 'Без відключення води й без зняття пломб', 'Акт виконаних робіт і свідоцтво про повірку', 'Допомога з постановкою на облік'],
    heat: ['Лічильник і монтажний комплект (крани, фільтр, переходи)', 'Проєкт за 1 добу й документи для обліку', 'Монтаж і пусконалагодження', 'Погодження в КП «Київтеплоенерго» — безкоштовно']
  };
  var NOTE = {
    water: 'Орієнтовно за прайсом. Огляд місця монтажу — 350 грн у Києві, від 500 грн в області; остаточну суму майстер називає після огляду.',
    verify: 'Ціна для лічильників DN15–20. Свідоцтво — протягом 10–14 днів. Для ОСББ при замовленні понад 50 шт. — 450 грн/шт.',
    heat: 'Ціна «під ключ» для стандартного монтажу. Виїзд на огляд і укладення договору — 300 грн.'
  };

  var calcEl = $('.calc');
  var state = { type: 'replace', qty: '1', owner: 'own', brand: 'gross', model: 'gross' };
  var userEditedMsg = false;
  var msgEl = $('#reqMsg');

  function val(name) { var el = $('input[name="' + name + '"]:checked'); return el ? el.value : null; }
  function setVal(name, v) { var el = $('input[name="' + name + '"][value="' + v + '"]'); if (el) el.checked = true; }

  function computeCalc() {
    state.type = val('type'); state.qty = val('qty'); state.owner = val('owner'); state.brand = val('brand'); state.model = val('model');
    var t = state.type, price = 0, title = '', detail = '', shown = '';
    var isWater = t === 'replace' || t === 'new';
    var qtyWord = function (q) { return q === '1' ? '1 лічильника' : q + ' лічильників'; };

    // Visibility
    $('#stepQty').hidden = t === 'heat';
    $('#stepOwner').hidden = !isWater;
    $('#stepHeat').hidden = t !== 'heat';
    $('#optBrand').hidden = !(isWater && state.owner === 'ours');
    var q4 = $('.qty-4');
    q4.hidden = t !== 'verify';
    if (t !== 'verify' && state.qty === '4') { setVal('qty', '2'); state.qty = '2'; }

    if (isWater) {
      price = state.owner === 'own' ? P[t].own[state.qty] : P[t].ours[state.brand][state.qty];
      title = (t === 'replace' ? 'Заміна ' : 'Нове встановлення ') + qtyWord(state.qty) + ' води';
      // detail goes into the client's message (client voice), shown is the result card (company voice)
      detail = state.owner === 'own' ? 'лічильники вже є' : 'лічильники від вас — ' + BRAND[state.brand];
      shown = state.owner === 'own' ? 'ваші лічильники' : 'лічильники ' + BRAND[state.brand];
    } else if (t === 'verify') {
      price = P.verify[state.qty];
      title = 'Повірка ' + qtyWord(state.qty) + ' води без зняття';
      detail = 'DN15–20';
      shown = 'DN15–20';
    } else {
      price = P.heat[state.model];
      title = 'Лічильник тепла під ключ';
      detail = MODEL[state.model];
      shown = MODEL[state.model];
    }

    $('#resPrice').textContent = fmt(price);
    $('#resTitle').textContent = title + ' · ' + shown;
    var list = $('#resList');
    list.innerHTML = '';
    INCL[t].forEach(function (txt) {
      var li = document.createElement('li');
      li.innerHTML = '<svg class="ic"><use href="#i-check"/></svg>';
      li.appendChild(document.createTextNode(txt));
      list.appendChild(li);
    });
    $('#resNote').textContent = isWater ? NOTE.water : NOTE[t];

    state.summary = title.charAt(0).toLowerCase() + title.slice(1) + (detail ? ' (' + detail + ')' : '');
    state.price = price;
    if (!userEditedMsg) msgEl.value = buildMessage();
  }

  function buildMessage() {
    var f = $('#reqForm');
    var name = f.name.value.trim(), phone = f.phone.value.trim(), addr = f.addr.value.trim();
    var lines = ['Добрий день! Хочу замовити: ' + state.summary + '.', 'Орієнтовно за прайсом: ' + fmt(state.price) + ' грн.'];
    if (name) lines.push("Ім'я: " + name);
    if (phone) lines.push('Телефон: ' + phone);
    if (addr) lines.push('Адреса / район: ' + addr);
    return lines.join('\n');
  }

  if (calcEl) {
    $$('.calc input[type="radio"]').forEach(function (r) { r.addEventListener('change', computeCalc); });
    msgEl.addEventListener('input', function () { userEditedMsg = true; });
    ['name', 'phone', 'addr'].forEach(function (n) {
      $('#reqForm')[n].addEventListener('input', function () {
        if (n === 'phone') this.classList.remove('is-invalid');
        if (!userEditedMsg) msgEl.value = buildMessage();
      });
    });
    computeCalc();
  }

  // "Порахувати" on service cards -> preselect calculator
  $$('.svc-calc').forEach(function (b) {
    b.addEventListener('click', function () {
      setVal('type', b.getAttribute('data-calc'));
      userEditedMsg = false;
      computeCalc();
      var target = $('#calc');
      if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* ---------- Send: copy text + open messenger ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallbackCopy(text); });
    }
    return Promise.resolve(fallbackCopy(text));
  }
  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = document.execCommand && document.execCommand('copy');
      document.body.removeChild(ta);
      return !!ok;
    } catch (e) { return false; }
  }
  $$('[data-send]').forEach(function (b) {
    b.addEventListener('click', function () {
      var kind = b.getAttribute('data-send');
      var text = msgEl.value;
      copyText(text).then(function (ok) {
        toast(ok ? 'Текст заявки скопійовано — вставте його в чат ' + (kind === 'tg' ? 'Telegram' : 'Viber') + '.' : 'Відкриваємо чат — опишіть, що потрібно зробити.');
        var url = kind === 'tg' ? TG_URL : VIBER_URL;
        setTimeout(function () { window.open(url, kind === 'tg' ? '_blank' : '_self'); }, 350);
      });
    });
  });

  /* ---------- Form (concept — no backend) ---------- */
  var form = $('#reqForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var phone = form.phone.value.replace(/\D/g, '');
      if (phone.length < 9) {
        form.phone.classList.add('is-invalid');
        form.phone.focus();
        toast('Вкажіть номер телефону — майстер передзвонить.');
        return;
      }
      toast('Дякуємо! Концепт: у робочій версії заявка одразу прийде менеджеру в Telegram.');
      form.reset();
      userEditedMsg = false;
      setVal('type', state.type); setVal('qty', state.qty); setVal('owner', state.owner); setVal('brand', state.brand); setVal('model', state.model);
      computeCalc();
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealTargets = $$('.section-head, .svc, .step, .work, .stat, .trust-card, .osbb, .rev, .faq details, .contact-card, .map-card, .calc-options, .calc-result');
  if ('IntersectionObserver' in window && !reduceMotion) {
    revealTargets.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealTargets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Sticky call bar: hide while the hero buttons are on screen ---------- */
  var callbar = $('.callbar'), heroCtas = $('.hero-ctas');
  if (callbar && heroCtas && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      callbar.classList.toggle('is-away', entries[0].isIntersecting);
    }).observe(heroCtas);
  }

  /* ---------- Footer year ---------- */
  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
})();
