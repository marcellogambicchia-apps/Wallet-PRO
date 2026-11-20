
(function() {
  var STORAGE_KEY = 'lamiabp_pro_data_v1';
  var LEGACY_KEY = 'lamiabp_new_data_v2';
  var PREFS_KEY = 'lamiabp_pro_prefs_v1';
  var MONTHS = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
  var MONTHS_SHORT = ['G','F','M','A','M','G','L','A','S','O','N','D'];
  var CAT_ICONS = {
    'Alimentari': '🛒', 'Casa & Utenze': '🏠', 'Auto & Trasporti': '🚗',
    'Salute': '💊', 'Tempo Libero': '🍽', 'Rate & Finanziamenti': '🏦', 'Altro': '📦'
  };
  var CUSTOM_CATEGORY_KEY = 'walletpro_custom_categories_v1';
  var customCategories = [];
  try { customCategories = JSON.parse(localStorage.getItem(CUSTOM_CATEGORY_KEY) || '[]'); if (!Array.isArray(customCategories)) customCategories = []; } catch(e) { customCategories = []; }
  var CUSTOM_ICONS_KEY = 'walletpro_custom_category_icons_v1';
  var customCategoryIcons = {};
  try { customCategoryIcons = JSON.parse(localStorage.getItem(CUSTOM_ICONS_KEY) || '{}') || {}; } catch(e) { customCategoryIcons = {}; }
  function categoryIcon(c) { var icon = (customCategoryIcons && Object.prototype.hasOwnProperty.call(customCategoryIcons,c) ? customCategoryIcons[c] : null) || CAT_ICONS[c] || '🏷️'; return escapeHtml(String(icon).slice(0,32)); }
  var EXTRA_CATEGORY_EMOJIS = ['🎂', '🏍️', '🦷', '👮🏼\u200d♂️', '🪡', '🐶', '🐱', '🐠', '🌏', '❄️', '☀️', '⛄️', '🍔', '🍕', '🦴', '⚽️', '🎾', '🚑', '🚚', '🚙', '🛵', '🛩️', '🚝', '⛵️', '🏖️', '🏥', '🏨', '💵', '💎'];
  function fillCategoryEmojiSelect(sel, initial) {
    if (!sel) return;
    var existing = Array.from(sel.options).map(function(o){return o.value;});
    EXTRA_CATEGORY_EMOJIS.concat(initial ? [initial] : []).forEach(function(emoji){if(emoji && existing.indexOf(emoji)<0){var o=document.createElement('option');o.value=emoji;o.textContent=emoji;sel.appendChild(o);existing.push(emoji);}});
    if(initial)sel.value=initial;
  }
  function allCategories() { var base=Object.keys(CAT_ICONS).concat(customCategories); if(typeof state!=='undefined'&&state&&Array.isArray(state.incomeCategories))base=base.concat(state.incomeCategories); return base.filter(function(c,i){return base.indexOf(c)===i;}); }
  function saveCustomCategories() {
    localStorage.setItem(CUSTOM_CATEGORY_KEY,JSON.stringify(customCategories));
    localStorage.setItem(CUSTOM_ICONS_KEY,JSON.stringify(customCategoryIcons));
    syncExpenseCategoryOptions();
    syncIncomeCategoryOptions();
    if (typeof renderEntrate === 'function') renderEntrate();
  }
  function syncExpenseCategoryOptions() {
    var sel = document.getElementById('expCategory'); if (!sel) return;
    var old = sel.value; sel.innerHTML = allCategories().map(function(c) { return '<option value="'+escapeHtml(c)+'">'+categoryIcon(c)+' '+escapeHtml(categoryLabel(c))+'</option>'; }).join('');
    if (allCategories().indexOf(old)>=0) sel.value=old;
  }
  var PIE_COLORS = ['#007AFF','#34C759','#FF9500','#5856D6','#FF2D55','#5AC8FA','#AF52DE','#FFCC00','#30B0C7','#FF3B30','#32ADE6','#A2845E'];
  var CHART_TYPES = ['bar', 'line', 'pie'];

  function makeZeroYear() {
    var a = [];
    for (var i = 0; i < 12; i++) a.push(0);
    return a;
  }

  var currentYear = new Date().getFullYear();
  var state = { monthly: {}, events: [], expenses: [], recurring: [], incomeRecurring: [], bankImportKeys: [], bankIncomeEntries: [], incomeCategories: [], payslips: [] };
  var prefs = {
    dark: false,
    language: 'it',
    currency: 'EUR',
    rates: {},
    budgetLimit: 0,
    vis: { netto: true, uscite: true, media: true, totale: true, stipendio: true, chartMensile: true, chartSpese: true, chartAnnuale: true, chartStipendi: true, forecast: true },
    monthlyChartType: 'bar',
    expenseChartType: 'pie',
    annualChartType: 'bar',
    salaryChartType: 'bar'
  };

  function loadAll() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          state.monthly = parsed.monthly || {};
          state.payslips = Array.isArray(parsed.payslips) ? parsed.payslips : [];
          state.events = Array.isArray(parsed.events) ? parsed.events : [];
          state.expenses = Array.isArray(parsed.expenses) ? parsed.expenses : [];
          state.recurring = Array.isArray(parsed.recurring) ? parsed.recurring : [];
          state.bankImportKeys = Array.isArray(parsed.bankImportKeys) ? parsed.bankImportKeys : [];
          state.bankIncomeEntries = Array.isArray(parsed.bankIncomeEntries) ? parsed.bankIncomeEntries : [];
          state.monthlyIncomeCategories = parsed.monthlyIncomeCategories && typeof parsed.monthlyIncomeCategories === 'object' ? parsed.monthlyIncomeCategories : {};
          state.incomeCategories = Array.isArray(parsed.incomeCategories) ? parsed.incomeCategories : [];
          state.paySalaryKeys = Array.isArray(parsed.paySalaryKeys) ? parsed.paySalaryKeys : [];
          state.incomeRowsMigratedV2 = !!parsed.incomeRowsMigratedV2;
        }
      }
      var rawP = localStorage.getItem(PREFS_KEY);
      if (rawP) {
        var pp = JSON.parse(rawP);
        if (pp) {
          prefs.dark = !!pp.dark;
          prefs.language = ['it','en','es','fr','de'].indexOf(pp.language) !== -1 ? pp.language : 'it';
          prefs.currency = /^[A-Z]{3}$/.test(pp.currency || '') ? pp.currency : 'EUR';
          if (pp.rates && typeof pp.rates === 'object') prefs.rates = pp.rates;
          prefs.budgetLimit = Number(pp.budgetLimit) || 0;
          if (pp.vis) {
            Object.keys(prefs.vis).forEach(function(k) {
              if (pp.vis[k] !== undefined) prefs.vis[k] = pp.vis[k] !== false;
            });
          }
          if (CHART_TYPES.indexOf(pp.monthlyChartType) !== -1) prefs.monthlyChartType = pp.monthlyChartType;
          if (pp.expenseChartType === 'pie' || pp.expenseChartType === 'bar') prefs.expenseChartType = pp.expenseChartType;
          if (CHART_TYPES.indexOf(pp.annualChartType) !== -1) prefs.annualChartType = pp.annualChartType;
        }
      }
    } catch (e) {}
    var yrs = getAvailableYears();
    if (yrs.indexOf(currentYear) === -1 && yrs.length > 0) currentYear = yrs.slice(0, 1).pop();
  }
  // Regola richiesta: stesso giorno + stessa tipologia + stesso importo in centesimi.
  // Per le entrate mensili manuali non esiste un giorno preciso: non possono essere
  // confrontate con movimenti bancari giornalieri senza rischiare errori.
  function isSalaryDescription(desc) {
    return /\b(stipendi[oa]|bust[ae]\s+pag[ae]|cedolin[oi]|retribuzion[ei]|emolument[oi])\b/i.test(String(desc || ''));
  }
  function salaryKey(date, amount) {
    var cents = Math.round(Number(amount) * 100);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || '')) || !Number.isFinite(cents) || cents <= 0) return null;
    return 'salary|' + date.slice(0, 7) + '|' + cents;
  }
  function salaryKeyFor(x) { return x && (String(x.category||'').toLowerCase().trim() === 'stipendio' || isSalaryDescription(x.desc)) ? salaryKey(x.date, x.amount) : null; }
  function paySalaryKey(y, m, amount) { return salaryKey(String(y)+'-'+String(Number(m)+1).padStart(2,'0')+'-01',amount); }
  function hasPaySalary(y,m,amount) {
    return (state.paySalaryKeys || []).indexOf(paySalaryKey(y,m,amount)) >= 0;
  }
  function duplicateKey(date, amount, type) {
    var cents = Math.round(Number(amount) * 100);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || '')) || !Number.isFinite(cents) || cents <= 0) return null;
    return type + '|' + date + '|' + cents;
  }
  // Per ogni movimento vale data completa + importo + verso. Solo per
  // entrate Stipendio si usa anche mese + anno + importo (giorno ignorato).
  function movementKeys(x, type) {
    var normal = duplicateKey(x.date, x.amount, type);
    var special = type === 'income' ? salaryKeyFor(x) : null;
    return [normal, special].filter(Boolean);
  }
  function registeredMovementKeys() {
    var keys = new Set();
    (state.expenses || []).forEach(function(x){movementKeys(x,'expense').forEach(function(k){keys.add(k);});});
    (state.bankIncomeEntries || []).forEach(function(x){movementKeys(x,'income').forEach(function(k){keys.add(k);});});
    (state.paySalaryKeys || []).forEach(function(k){keys.add(k);});
    return keys;
  }
  function isRegisteredMovement(x,type,keys) {
    return movementKeys(x,type).some(function(k){return keys.has(k);});
  }
  function cleanDuplicates() {
    var seen = Object.create(null), removed = 0;
    state.expenses = state.expenses.filter(function(ex) {
      var k = duplicateKey(ex.date, ex.amount, 'expense');
      if (!k) return true;
      if (seen[k] && !ex.duplicateConfirmed) { removed++; return false; }
      seen[k] = true; return true;
    });
    if (!Array.isArray(state.bankIncomeEntries)) state.bankIncomeEntries = [];
    // Entrate bancarie già conteggiate nei totali mensili: sottrarre la seconda
    // occorrenza quando si ripuliscono vecchi backup.
    var payKeys = new Set(state.paySalaryKeys || []);
    state.bankIncomeEntries = state.bankIncomeEntries.filter(function(en) {
      var k = salaryKeyFor(en) || duplicateKey(en.date, en.amount, 'income');
      if (!k) return true;
      if ((seen[k] && !en.duplicateConfirmed) || (salaryKeyFor(en) && payKeys.has(salaryKeyFor(en)) && en.source !== 'payslip' && !en.duplicateConfirmed)) {
        var y = Number(en.date.slice(0, 4)), m = Number(en.date.slice(5, 7)) - 1;
        if (state.monthly[y]) state.monthly[y][m] = Math.max(0, Math.round(((Number(state.monthly[y][m]) || 0) - Number(en.amount)) * 100) / 100);
        removed++; return false;
      }
      seen[k] = true; return true;
    });
    return removed;
  }
  function saveState() {
    try {
      var n = cleanDuplicates();
      if (n && !localStorage.getItem(STORAGE_KEY + '_prima_antidoppioni')) {
        var old = localStorage.getItem(STORAGE_KEY);
        if (old) localStorage.setItem(STORAGE_KEY + '_prima_antidoppioni', old);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      window.dispatchEvent(new Event("walletpro:data-changed"));
    } catch (e) {
      /* Privacy: non registrare in console dettagli del salvataggio finanziario. */
      var message = (e && (e.name === 'QuotaExceededError' || e.code === 22))
        ? 'Memoria del dispositivo piena. Esporta un backup e libera spazio prima di continuare.'
        : 'Impossibile salvare i dati sul dispositivo. Controlla lo spazio disponibile e le impostazioni di Safari.';
      showToast(message);
      window.alert(message + '\nLe ultime modifiche potrebbero non essere state salvate.');
      return false;
    }
    return true;
  }
  function savePrefs() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      return true;
    } catch (e) {
      var message = (e && (e.name === 'QuotaExceededError' || e.code === 22))
        ? 'Memoria del dispositivo piena: impossibile salvare le preferenze.'
        : 'Impossibile salvare le preferenze sul dispositivo. Controlla le impostazioni di Safari.';
      showToast(message);
      window.alert(message + '\nLe ultime preferenze potrebbero non essere state salvate.');
      return false;
    }
  }

  function showToast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.style.display = 'block';
    clearTimeout(t._timer);
    t._timer = setTimeout(function() { t.style.display = 'none'; }, 2600);
  }

  var FX_FALLBACK = { EUR:1, USD:1.08, GBP:0.84, CHF:0.94, JPY:163, CAD:1.49, AUD:1.65, CNY:7.78, INR:90.5 };
  function exchangeRate() {
    if (prefs.currency === 'EUR') return 1;
    return Number(prefs.rates[prefs.currency]) || FX_FALLBACK[prefs.currency] || 1;
  }
  function toDisplayAmount(eur) { return (Number(eur) || 0) * exchangeRate(); }
  function toEuroAmount(displayAmount) { return (Number(displayAmount) || 0) / exchangeRate(); }
  function currencyLocale() {
    return ({it:'it-IT',en:'en-US',es:'es-ES',fr:'fr-FR',de:'de-DE'})[prefs.language] || 'it-IT';
  }
  function fmtEur(n) {
    var val = toDisplayAmount(n);
    try { return new Intl.NumberFormat(currencyLocale(), { style:'currency', currency:prefs.currency, useGrouping: true, minimumFractionDigits: val % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(val); }
    catch(e) { return prefs.currency + ' ' + val.toLocaleString(currencyLocale(), {useGrouping:true,maximumFractionDigits:2}); }
  }
  function fmtShort(n) {
    var val = toDisplayAmount(n);
    if (val === 0) return '';
    var compact = val >= 1000 ? (val / 1000).toFixed(1) + 'k' : Math.round(val).toString();
    return compact;
  }
  function refreshExchangeRates() {
    var rate = exchangeRate();
    var info = document.getElementById('exchangeRateInfo');
    if (!info) return;
    if (prefs.currency === 'EUR') {
      info.textContent = tr('I dati sono conservati in EUR; gli importi vengono convertiti per la visualizzazione.');
    } else {
      info.textContent = 'Modalità privacy: nessuna connessione esterna. Tasso indicativo locale: 1 EUR = ' +
        Number(rate).toFixed(4) + ' ' + prefs.currency + '.';
    }
  }

  // Parser condiviso: non accetta suffissi o numeri parziali.
  function parseNumberInput(str, locale) {
    return window.walletProParseAmount(str, locale || null);
  }

  function escapeHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function getAvailableYears() {
    var set = {};
    set[new Date().getFullYear()] = true;
    set[currentYear] = true;
    Object.keys(state.monthly).forEach(function(y) { set[Number(y)] = true; });
    state.events.forEach(function(ev) { if (ev.year) set[Number(ev.year)] = true; });
    state.expenses.forEach(function(ex) {
      if (ex.date && ex.date.length >= 4) set[Number(ex.date.slice(0, 4))] = true;
    });
    return Object.keys(set).map(Number).sort(function(a, b) { return b - a; });
  }

  function syncYearDropdown() {
    var sel = document.getElementById('yearSelect');
    var years = getAvailableYears();
    sel.innerHTML = '';
    years.forEach(function(y) {
      var opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === currentYear) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  function getMaxPositive(arr) {
    var m = 1;
    for (var i = 0; i < arr.length; i++) {
      if ((Number(arr[i]) || 0) > m) m = Number(arr[i]);
    }
    return m;
  }
  function buildLineChartSVG(labels, values, highlightIdx) {
    var n = labels.length;
    var w = Math.max(320, n * 44);
    var h = 150;
    var padL = 18, padR = 18, padT = 24, padB = 24;
    var plotW = w - padL - padR;
    var plotH = h - padT - padB;
    var maxVal = getMaxPositive(values);

    var pts = [];
    for (var i = 0; i < n; i++) {
      var x = n === 1 ? padL + plotW / 2 : padL + (i / (n - 1)) * plotW;
      var y = padT + plotH - ((values[i] || 0) / maxVal) * plotH;
      pts.push({ x: x, y: y, val: values[i] || 0, lbl: labels[i], idx: i });
    }

    var pathD = '';
    pts.forEach(function(p, idx) {
      if (idx === 0) {
        pathD += 'M ' + p.x.toFixed(1) + ' ' + p.y.toFixed(1);
      } else {
        var prev = pts[idx - 1];
        var cx = (prev.x + p.x) / 2;
        pathD += ' C ' + cx.toFixed(1) + ' ' + prev.y.toFixed(1) + ', ' + cx.toFixed(1) + ' ' + p.y.toFixed(1) + ', ' + p.x.toFixed(1) + ' ' + p.y.toFixed(1);
      }
    });

    var firstPt = pts.slice(0, 1).pop();
    var lastPt = pts.slice(-1).pop();
    var areaD = pathD + ' L ' + lastPt.x.toFixed(1) + ' ' + (padT + plotH) + ' L ' + firstPt.x.toFixed(1) + ' ' + (padT + plotH) + ' Z';
    var gradId = 'lg_' + Math.random().toString(36).substr(2, 6);

    var svg = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" style="display:block;">';
    svg += '<defs><linearGradient id="' + gradId + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#007AFF" stop-opacity="0.28"/><stop offset="100%" stop-color="#007AFF" stop-opacity="0.0"/></linearGradient></defs>';
    svg += '<path d="' + areaD + '" fill="url(#' + gradId + ')"/>';
    svg += '<path d="' + pathD + '" fill="none" stroke="#007AFF" stroke-width="2.5" stroke-linecap="round"/>';

    pts.forEach(function(p) {
      var isHi = p.idx === highlightIdx;
      var dotCol = isHi ? '#34C759' : '#007AFF';
      if (p.val > 0) {
        svg += '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + (isHi ? '4.5' : '3.5') + '" fill="' + dotCol + '" stroke="#FFF" stroke-width="1.5"/>';
        svg += '<text x="' + p.x.toFixed(1) + '" y="' + (p.y - 7).toFixed(1) + '" text-anchor="middle" font-size="9" font-weight="600" fill="var(--subtext)">' + fmtShort(p.val) + '</text>';
      }
      svg += '<text x="' + p.x.toFixed(1) + '" y="' + (h - 6) + '" text-anchor="middle" font-size="10" font-weight="600" fill="var(--subtext)">' + escapeHtml(p.lbl) + '</text>';
    });
    svg += '</svg>';
    return svg;
  }
  function buildPieChartHTML(labels, values) {
    var total = values.reduce(function(a, b) { return a + (b || 0); }, 0);
    if (total <= 0) return '<div class="empty-state">Nessun dato positivo da visualizzare.</div>';

    var size = 132;
    var cx = size / 2, cy = size / 2, r = 52, innerR = 28;
    var startAngle = -Math.PI / 2;
    var svg = '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" style="flex-shrink:0;">';
    var legend = '<div class="pie-legend">';

    var activeItems = [];
    for (var i = 0; i < labels.length; i++) {
      if ((values[i] || 0) > 0) activeItems.push({ label: labels[i], val: values[i], color: PIE_COLORS[i % PIE_COLORS.length] });
    }

    if (activeItems.length === 1) {
      var item = activeItems.pop();
      svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + item.color + '"/>';
      svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + innerR + '" fill="var(--card)"/>';
      legend += '<div class="legend-item"><div class="legend-left"><span class="legend-dot" style="background:' + item.color + '"></span><span>' + escapeHtml(item.label) + '</span></div><b>100% (' + fmtShort(item.val) + ')</b></div>';
    } else {
      activeItems.forEach(function(item) {
        var slice = (item.val / total) * Math.PI * 2;
        var endAngle = startAngle + slice;
        var x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
        var x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
        var ix1 = cx + innerR * Math.cos(endAngle), iy1 = cy + innerR * Math.sin(endAngle);
        var ix2 = cx + innerR * Math.cos(startAngle), iy2 = cy + innerR * Math.sin(startAngle);
        var largeArc = slice > Math.PI ? 1 : 0;

        var d = 'M ' + x1.toFixed(2) + ' ' + y1.toFixed(2) +
                ' A ' + r + ' ' + r + ' 0 ' + largeArc + ' 1 ' + x2.toFixed(2) + ' ' + y2.toFixed(2) +
                ' L ' + ix1.toFixed(2) + ' ' + iy1.toFixed(2) +
                ' A ' + innerR + ' ' + innerR + ' 0 ' + largeArc + ' 0 ' + ix2.toFixed(2) + ' ' + iy2.toFixed(2) + ' Z';
        svg += '<path d="' + d + '" fill="' + item.color + '" stroke="var(--card)" stroke-width="1.5"/>';
        startAngle = endAngle;

        var pct = Math.round((item.val / total) * 100);
        legend += '<div class="legend-item"><div class="legend-left"><span class="legend-dot" style="background:' + item.color + '"></span><span>' + escapeHtml(item.label) + '</span></div><b>' + pct + '% (' + fmtShort(item.val) + ')</b></div>';
      });
    }
    svg += '</svg>';
    legend += '</div>';
    return '<div class="pie-wrapper">' + svg + legend + '</div>';
  }
  function renderMonthlyChart(arr) {
    var container = document.getElementById('monthlyChartContainer');
    var type = prefs.monthlyChartType;
    document.querySelectorAll('#pills-monthly .chart-pill').forEach(function(b) {
      b.classList.toggle('active', b.getAttribute('data-type') === type);
    });
    if (type === 'pie') { container.innerHTML = buildPieChartHTML(MONTHS, arr); return; }
    if (type === 'line') { container.innerHTML = '<div class="annual-scroll">' + buildLineChartSVG(MONTHS_SHORT, arr, -1) + '</div>'; return; }

    var maxVal = getMaxPositive(arr);
    var html = '<div class="bar-chart">';
    for (var i = 0; i < 12; i++) {
      var v = arr[i] || 0;
      var hPct = v > 0 ? Math.max(6, Math.round((v / maxVal) * 100)) : 3;
      html += '<div class="bar-col"><span class="bar-val">' + fmtShort(v) + '</span><div class="bar-fill" style="height:' + hPct + '%;opacity:' + (v > 0 ? '1' : '0.22') + '"></div><span class="bar-lbl">' + MONTHS_SHORT[i] + '</span></div>';
    }
    html += '</div>';
    container.innerHTML = html;
  }

  function renderExpenseChart(yearExpenses) {
    var container = document.getElementById('expenseChartContainer');
    var type = prefs.expenseChartType;
    document.querySelectorAll('#pills-expense .chart-pill').forEach(function(b) {
      b.classList.toggle('active', b.getAttribute('data-type') === type);
    });
    document.getElementById('expenseChartTitle').textContent = 'Uscite per Categoria ' + currentYear;

    if (yearExpenses.length === 0) {
      container.innerHTML = '<div class="empty-state">Nessuna uscita registrata nel ' + currentYear + '. Tocca <b>Aggiungi</b> -> <b>Uscita</b>.</div>';
      return;
    }

    var catTotals = {};
    yearExpenses.forEach(function(ex) {
      var c = ex.category || 'Altro';
      catTotals[c] = (catTotals[c] || 0) + (Number(ex.amount) || 0);
    });
    var cats = Object.keys(catTotals).sort(function(a, b) { return catTotals[b] - catTotals[a]; });
    var vals = cats.map(function(c) { return catTotals[c]; });

    if (type === 'pie') { container.innerHTML = buildPieChartHTML(cats.map(categoryLabel), vals); return; }

    var maxVal = getMaxPositive(vals);
    var html = '<div class="bar-chart">';
    for (var i = 0; i < cats.length; i++) {
      var v = vals[i];
      var hPct = Math.max(8, Math.round((v / maxVal) * 100));
      var icon = categoryIcon(cats[i]);
      html += '<div class="bar-col"><span class="bar-val">' + fmtShort(v) + '</span><div class="bar-fill" style="height:' + hPct + '%;background:linear-gradient(180deg,#FF453A 0%,#D70015 100%);"></div><span class="bar-lbl" title="' + cats[i] + '">' + icon + '</span></div>';
    }
    html += '</div>';
    container.innerHTML = html;
  }
  function renderAnnualChart() {
    var container = document.getElementById('annualChartContainer');
    var type = prefs.annualChartType;
    document.querySelectorAll('#pills-annual .chart-pill').forEach(function(b) {
      b.classList.toggle('active', b.getAttribute('data-type') === type);
    });
    var years = Object.keys(state.monthly).map(Number).sort(function(a, b) { return a - b; });
    if (years.length === 0) {
      container.innerHTML = '<div class="empty-state">Premi <b>Aggiungi</b> nella barra inferiore per inserire la prima entrata.</div>';
      return;
    }
    var totals = years.map(function(y) {
      return (state.monthly[y] || []).reduce(function(a, b) { return a + (Number(b) || 0); }, 0);
    });
    var labels = years.map(String);
    var hiIdx = years.indexOf(currentYear);

    if (type === 'pie') { container.innerHTML = buildPieChartHTML(labels, totals); return; }
    if (type === 'line') {
      container.innerHTML = '<div class="annual-scroll" id="annualScrollBox">' + buildLineChartSVG(labels, totals, hiIdx) + '</div>';
      scrollAnnualToSelected(hiIdx);
      return;
    }

    var maxVal = getMaxPositive(totals);
    var html = '<div class="annual-scroll" id="annualScrollBox"><div class="bar-chart">';
    for (var i = 0; i < years.length; i++) {
      var v = totals[i];
      var hPct = v > 0 ? Math.max(6, Math.round((v / maxVal) * 100)) : 3;
      var cls = years[i] === currentYear ? 'bar-fill highlight' : 'bar-fill';
      html += '<div class="bar-col"><span class="bar-val">' + fmtShort(v) + '</span><div class="' + cls + '" style="height:' + hPct + '%"></div><span class="bar-lbl">' + years[i] + '</span></div>';
    }
    html += '</div></div>';
    container.innerHTML = html;
    scrollAnnualToSelected(hiIdx);
  }

  function renderSalaryChart() {
    var container=document.getElementById('salaryChartContainer');
    // Busta paga e stipendio sono la stessa categoria: usa tutte le entrate
    // classificate Stipendio, anche quelle inserite manualmente o dalla banca.
    // Evita il doppio conteggio degli accrediti già inclusi nel riepilogo mensile.
    var totals={};
    var yearSet={};
    Object.keys(state.monthly||{}).forEach(function(y){yearSet[y]=true;});
    (state.bankIncomeEntries||[]).forEach(function(en){
      if(en.date && /^\d{4}-\d{2}/.test(en.date))yearSet[en.date.slice(0,4)]=true;
    });
    Object.keys(yearSet).forEach(function(y){
      var yearly=0, months=state.monthly[y]||makeZeroYear();
      for(var m=0;m<12;m++){
        var monthlyAmount=Number(months[m])||0;
        var category=(state.monthlyIncomeCategories||{})[y+'-'+m]||'Stipendio';
        var bankInMonth=(state.bankIncomeEntries||[]).filter(function(en){
          return en.date && Number(en.date.slice(0,4))===Number(y) && Number(en.date.slice(5,7))-1===m;
        });
        var bankTotal=bankInMonth.reduce(function(sum,en){return sum+(Number(en.amount)||0);},0);
        var bankSalary=bankInMonth.reduce(function(sum,en){
          return sum+(en.category==='Stipendio'||(!en.category&&isSalaryDescription(en.desc))?(Number(en.amount)||0):0);
        },0);
        if(category==='Stipendio')yearly+=Math.max(0,monthlyAmount-bankTotal);
        yearly+=bankSalary;
      }
      if(yearly!==0)totals[y]=yearly;
    });
    var years=Object.keys(totals).sort();
    if(!years.length){container.innerHTML='<div class="empty-state">Nessuna entrata nella categoria Stipendio.</div>';return;}
    var vals=years.map(function(y){return totals[y];}), type=prefs.salaryChartType||'bar';
    document.querySelectorAll('#pills-salary .chart-pill').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-type')===type);});
    if(type==='pie'){container.innerHTML=buildPieChartHTML(years,vals);return;}
    if(type==='line'){container.innerHTML='<div class="annual-scroll">'+buildLineChartSVG(years,vals,-1)+'</div>';return;}
    var max=getMaxPositive(vals),html='<div class="annual-scroll"><div class="bar-chart">';
    years.forEach(function(y,i){var v=vals[i],pct=v>0?Math.max(6,Math.round(v/max*100)):3;html+='<div class="bar-col"><span class="bar-val">'+fmtShort(v)+'</span><div class="bar-fill" style="height:'+pct+'%"></div><span class="bar-lbl">'+y+'</span></div>';});
    container.innerHTML=html+'</div></div>';
  }

  function scrollAnnualToSelected(idx) {
    if (idx < 0) return;
    setTimeout(function() {
      var box = document.getElementById('annualScrollBox');
      if (box) box.scrollLeft = Math.max(0, idx * 54 - box.clientWidth / 2 + 27);
    }, 30);
  }

  // Totale della categoria Stipendio per un anno, evitando di contare due volte
  // i movimenti gia' inclusi in state.monthly.
  function salaryTotalForYear(year) {
    var months = state.monthly[year] || makeZeroYear();
    var total = 0;
    for (var m = 0; m < 12; m++) {
      var details = (state.bankIncomeEntries || []).filter(function(e) {
        return e.date && Number(e.date.slice(0, 4)) === Number(year) && Number(e.date.slice(5, 7)) === m + 1;
      });
      var detailTotal = details.reduce(function(sum, e) { return sum + (Number(e.amount) || 0); }, 0);
      var salaryDetails = details.reduce(function(sum, e) {
        return sum + (String(e.category || '').trim().toLowerCase() === 'stipendio' ? (Number(e.amount) || 0) : 0);
      }, 0);
      var residual = Math.max(0, (Number(months[m]) || 0) - detailTotal);
      var residualCategory = (state.monthlyIncomeCategories || {})[year + '-' + m] || 'Stipendio';
      total += salaryDetails + (residualCategory === 'Stipendio' ? residual : 0);
    }
    return Math.round(total * 100) / 100;
  }

  function renderDashboard() {
    var budgetMonth = Number(document.getElementById("dashboardMonth").value);
    var arr = state.monthly[currentYear] || makeZeroYear();
    var yearSum = 0, activeMonths = 0;
    for (var i = 0; i < 12; i++) {
      var val = Number(arr[i]) || 0;
      { yearSum += val; if (val > 0) activeMonths++; }
    }
    var salaryYearSum = salaryTotalForYear(currentYear);
    var avg = activeMonths > 0 ? yearSum / activeMonths : 0;

    var prevArr = state.monthly[currentYear - 1] || [];
    var prevComparableSum = 0;
    for (var k = 0; k < 12; k++) {
      if ((Number(arr[k]) || 0) > 0) prevComparableSum += (Number(prevArr[k]) || 0);
    }
    var yoyEl = document.getElementById('kpiYoyBadge');
    var previousSalarySum = salaryTotalForYear(currentYear - 1);
    if (salaryYearSum > 0 && previousSalarySum > 0) {
      var diffPct = ((salaryYearSum - previousSalarySum) / previousSalarySum) * 100;
      var sign = diffPct >= 0 ? '+' : '';
      yoyEl.textContent = sign + diffPct.toFixed(1).replace('.', ',') + '% vs ' + (currentYear - 1);
      yoyEl.className = 'yoy-badge ' + (diffPct >= 0 ? 'pos' : 'neg');
      yoyEl.style.display = 'inline-block';
    } else {
      yoyEl.style.display = 'none';
    }

    var projEl = document.getElementById('kpiProjSub');
    if (activeMonths > 0 && activeMonths < 12) {
      projEl.textContent = 'Stima anno: ' + fmtEur(avg * 12);
      projEl.style.display = 'block';
    } else {
      projEl.style.display = 'none';
    }

    var yearExpenses = state.expenses.filter(function(ex) {
      return ex.date && Number(ex.date.slice(0, 4)) === currentYear;
    });
    var yearExpSum = yearExpenses.reduce(function(a, b) { return a + (Number(b.amount) || 0); }, 0);

    var allTimeIn = 0;
    Object.keys(state.monthly).forEach(function(y) {
      (state.monthly[y] || []).forEach(function(v) { allTimeIn += (Number(v) || 0); });
    });
    var allTimeOut = state.expenses.reduce(function(a, b) { return a + (Number(b.amount) || 0); }, 0);

    // Totale storico degli stipendi, indipendente dall'anno selezionato.
    // Gli accrediti bancari sono già compresi nei totali mensili: non sommarli due volte.
    var totalSalaryHistory = 0;
    Object.keys(state.monthly).forEach(function(y) {
      (state.monthly[y] || []).forEach(function(value, m) {
        var monthlyAmount = Number(value) || 0;
        var category = (state.monthlyIncomeCategories || {})[y + '-' + m] || 'Stipendio';
        var bankInMonth = (state.bankIncomeEntries || []).filter(function(en) {
          return en.date && Number(en.date.slice(0, 4)) === Number(y) && Number(en.date.slice(5, 7)) - 1 === m;
        });
        var bankTotal = bankInMonth.reduce(function(sum, en) { return sum + (Number(en.amount) || 0); }, 0);
        var bankSalary = bankInMonth.reduce(function(sum, en) {
          return sum + (en.category === 'Stipendio' || (!en.category && isSalaryDescription(en.desc)) ? (Number(en.amount) || 0) : 0);
        }, 0);
        var nonBankMonthly = Math.max(0, monthlyAmount - bankTotal);
        if (category === 'Stipendio') totalSalaryHistory += nonBankMonthly;
        totalSalaryHistory += bankSalary;
      });
    });
    document.getElementById('kpiNetto').textContent = fmtEur(salaryYearSum);
    document.getElementById('kpiUscite').textContent = fmtEur(yearExpSum);
    var saldoAnno = yearSum - yearExpSum;
    var saldoEl = document.getElementById('kpiRisparmioSub');
    saldoEl.textContent = 'Saldo: ' + fmtEur(saldoAnno);
    saldoEl.style.color = saldoAnno < 0 ? 'var(--red)' : 'var(--green)';
    saldoEl.style.fontWeight = '700';
    document.getElementById('kpiMedia').textContent = fmtEur(avg);
    document.getElementById('kpiTotaleStorico').textContent = fmtEur(yearSum);
    document.getElementById('kpiStipendioStorico').textContent = fmtEur(totalSalaryHistory);
    document.getElementById('kpiBilancioAll').textContent = 'Delta Entrate: ' + fmtEur(yearSum - salaryYearSum);
    document.getElementById('monthlyChartTitle').textContent = 'Entrate Mensili ' + currentYear;

    var budgetCard = document.getElementById('card-budget');
    var budgetConfig = {};
    try { budgetConfig = JSON.parse(localStorage.getItem('walletpro_simple_v2') || '{}').budgets || {}; } catch(e) {}
    if (!budgetConfig || typeof budgetConfig !== 'object' || Array.isArray(budgetConfig)) budgetConfig = {};
    var budgetOptions = ['monthly'].concat(Object.keys(budgetConfig).sort(function(a,b){return a.localeCompare(b,'it')}).map(function(cat){return 'category:'+cat}));
    if (!budgetOptions.includes(window.walletproBudgetView)) window.walletproBudgetView='monthly';
    var selectedCategory = window.walletproBudgetView.startsWith('category:') ? window.walletproBudgetView.slice(9) : null;
    document.getElementById('budgetCycle').setAttribute('aria-label', 'Budget '+(selectedCategory||'mensile')+'. Tocca per visualizzare il successivo');
    var limit = selectedCategory === null ? Number(prefs.budgetLimit) : Number(budgetConfig[selectedCategory])/100;
    var monthExpenses = yearExpenses.filter(function(ex){return Number(ex.date.slice(5,7))-1 === budgetMonth});
    var spent = monthExpenses.filter(function(ex){return selectedCategory === null || String(ex.category||'Altro')===selectedCategory})
      .reduce(function(total,ex){return total+(Number(ex.amount)||0)},0);
    var fill = document.getElementById('budgetBarFill');
    var pct = limit > 0 ? Math.min(100,Math.round(spent/limit*100)) : 0;
    fill.style.width=pct+'%';
    fill.style.backgroundColor=spent>=limit&&limit>0?'var(--red)':pct>=75?'var(--orange)':'var(--green)';
    document.getElementById('budgetLabel').textContent=selectedCategory===null?'Budget mensile':'Budget: '+selectedCategory;
    document.getElementById('budgetNumbers').textContent=fmtEur(spent)+' / '+fmtEur(limit||0);
    budgetCard.style.display=(Number(prefs.budgetLimit)>0 || Object.keys(budgetConfig).length>0)?'block':'none';

    // Stima prudente, non saldo bancario: saldo annuale + flussi stimati dei giorni rimanenti.
    (function(){
      var el=document.getElementById('forecastAmount'), detail=document.getElementById('forecastDetails');
      var now=new Date(), yr=now.getFullYear(), mo=now.getMonth(), day=now.getDate();
      if(currentYear!==yr){el.textContent='—';detail.textContent='Seleziona l’anno corrente per la previsione';return;}
      var days=new Date(yr,mo+1,0).getDate(), remaining=Math.max(0,days-day);
      var expensesThisMonth=state.expenses.filter(function(x){return x.date&&Number(x.date.slice(0,4))===yr&&Number(x.date.slice(5,7))===mo+1&&Number(x.date.slice(8,10))<=day;});
      var spentToDate=expensesThisMonth.reduce(function(a,x){return a+(Number(x.amount)||0)},0);
      var incomeToDate=Number((state.monthly[yr]||[])[mo])||0;
      var pastMonths=[];
      for(var mm=Math.max(0,mo-3);mm<mo;mm++){
        var amount=state.expenses.filter(function(x){return x.date&&Number(x.date.slice(0,4))===yr&&Number(x.date.slice(5,7))===mm+1;}).reduce(function(a,x){return a+(Number(x.amount)||0)},0);
        if(amount>0)pastMonths.push(amount);
      }
      var dailyOut=spentToDate>0?spentToDate/Math.max(1,day):0;
      if(pastMonths.length){var histDaily=pastMonths.reduce(function(a,b){return a+b},0)/pastMonths.length/30.44;dailyOut=dailyOut?dailyOut*.5+histDaily*.5:histDaily;}
      var expectedOut=dailyOut*remaining;
      var expectedIn=0;
      var pastIncome=[];
      for(var mi=Math.max(0,mo-3);mi<mo;mi++){var v=Number((state.monthly[yr]||[])[mi])||0;if(v>0)pastIncome.push(v);}
      if(incomeToDate===0&&pastIncome.length)expectedIn=pastIncome.reduce(function(a,b){return a+b},0)/pastIncome.length;
      var estimated=saldoAnno+expectedIn-expectedOut;
      el.textContent=fmtEur(estimated);
      el.style.color=estimated<0?'var(--red)':'var(--green)';
      detail.textContent='Saldo annuale attuale '+fmtEur(saldoAnno)+' · Entrate attese '+fmtEur(expectedIn)+' · Uscite stimate '+fmtEur(expectedOut)+' · '+remaining+' giorni rimanenti. Stima indicativa, non saldo del conto.';
    })();

    var yearEvents = state.events.filter(function(e) { return Number(e.year) === currentYear; });
    var banner = document.getElementById('eventsBanner');
    var bList = document.getElementById('eventsBannerList');
    if (yearEvents.length > 0) {
      banner.style.display = 'block';
      bList.innerHTML = yearEvents.map(function(ev) {
        var badge = (ev.value !== null && ev.value !== undefined && ev.value !== '') ? '<span class="event-val-badge">' + fmtEur(ev.value) + '</span>' : '';
        return '<div class="event-chip"><span>' + escapeHtml(ev.title) + '</span>' + badge + '</div>';
      }).join('');
    } else {
      banner.style.display = 'none';
    }

    renderMonthlyChart(arr);
    renderExpenseChart(yearExpenses);
    renderSalaryChart();
    renderAnnualChart();
  }
  function renderIncomeRecurring(){
    var el=document.getElementById('incomeRecurringList');if(!el)return;
    var entries=Array.isArray(state.incomeRecurring)?state.incomeRecurring:[];
    if(!entries.length){el.innerHTML='<div class="list-row" style="color:var(--subtext)">Nessuna entrata fissa ricorrente salvata.</div>';return;}
    el.innerHTML=entries.map(function(r,i){return '<div class="list-row"><div><b>'+escapeHtml(r.category||'Altro')+'</b><div class="row-sub">'+fmtEur(r.amount)+'/mese</div></div><button type="button" class="del-btn" data-del-income-rec="'+i+'">Rimuovi</button></div>';}).join('');
  }
  document.getElementById('incomeRecurringList').addEventListener('click',function(e){
    var btn=e.target.closest('[data-del-income-rec]');if(!btn)return;
    if(!Array.isArray(state.incomeRecurring))state.incomeRecurring=[];state.incomeRecurring.splice(Number(btn.getAttribute('data-del-income-rec')),1);saveState();renderIncomeRecurring();showToast('Entrata ricorrente rimossa');
  });
  document.getElementById('btnApplyIncomeRecurring').addEventListener('click',function(){
    var entries=Array.isArray(state.incomeRecurring)?state.incomeRecurring:[];
    if(!entries.length){showToast('Nessuna entrata ricorrente da applicare');return;}
    var now=new Date(),y=now.getFullYear(),m=now.getMonth(),day=now.getDate(),date=y+'-'+String(m+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');
    if(!state.monthly[y])state.monthly[y]=makeZeroYear();
    if(!Array.isArray(state.bankIncomeEntries))state.bankIncomeEntries=[];
    var added=0,skipped=0;
    entries.forEach(function(r){
      var salary=String(r.category).toLowerCase()==='stipendio';
      var dup=state.bankIncomeEntries.some(function(en){return Math.round(Number(en.amount)*100)===Math.round(Number(r.amount)*100)&&(salary?String(en.date).slice(0,7)===date.slice(0,7):en.date===date);}) || (salary && (state.paySalaryKeys||[]).indexOf(paySalaryKey(y,m,r.amount))!==-1);
      if(dup){skipped++;return;}
      state.bankIncomeEntries.push({date:date,amount:r.amount,desc:r.category,category:r.category,source:'recurring-income'});
      state.monthly[y][m]=Math.round((Number(state.monthly[y][m]||0)+Number(r.amount))*100)/100;added++;
    });
    currentYear=y;if(!saveState())return;syncYearDropdown();renderDashboard();renderEntrate();renderStorico();
    showToast(added+' entrate applicate, '+skipped+' duplicati ignorati');
  });
  function renderSpese() {
    document.getElementById('speseHeaderTitle').textContent = 'Uscite ' + currentYear;
    var mFilter = document.getElementById('expenseMonthFilter').value;
    var search = (document.getElementById('expenseSearch').value || '').trim().toLocaleLowerCase();
    var list = state.expenses.map(function(ex, idx) { return { item: ex, idx: idx }; })
      .filter(function(o) {
        if (!o.item.date || Number(o.item.date.slice(0, 4)) !== currentYear) return false;
        if (mFilter !== 'all' && (Number(o.item.date.slice(5, 7)) - 1) !== Number(mFilter)) return false;
        if (search && ![o.item.desc,o.item.category,o.item.date,String(o.item.amount)].join(' ').toLocaleLowerCase().includes(search)) return false;
        return true;
      })
      .sort(function(a, b) { return b.item.date.localeCompare(a.item.date); });

    document.getElementById('expenseSearchCount').textContent = search ? list.length + ' uscite trovate' : '';
    var container = document.getElementById('speseList');
    if (list.length === 0) {
      container.innerHTML = '<div class="list-row" style="color:var(--subtext);">Nessuna uscita trovata per questo filtro.</div>';
    } else {
      container.innerHTML = list.map(function(o) {
        var ex = o.item;
        var icon = categoryIcon(ex.category);
        return '<div class="list-row" style="flex-wrap:wrap;"><div style="flex:1;min-width:130px;"><div>' + icon + ' <b>' + escapeHtml(ex.desc || ex.category) + '</b></div><div class="row-sub">' + escapeHtml(ex.date) + '</div></div><div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;justify-content:flex-end;"><span style="font-weight:700;color:var(--red);">-' + fmtEur(ex.amount) + '</span><button type="button" class="del-btn" data-del-exp="' + o.idx + '">✕</button></div><select class="form-input" style="width:100%;font-size:13px;padding:7px 10px;" data-change-exp-category="' + o.idx + '" aria-label="Modifica categoria uscita">' + allCategories().concat(allCategories().indexOf(ex.category)<0?[ex.category]:[]).map(function(c){return '<option value="'+escapeHtml(c)+'"'+(c===ex.category?' selected':'')+'>'+categoryIcon(c)+' '+escapeHtml(categoryLabel(c))+'</option>';}).join('') + '</select></div>';
      }).join('');
    }

    var recContainer = document.getElementById('recurringList');
    if (state.recurring.length === 0) {
      recContainer.innerHTML = '<div class="list-row" style="color:var(--subtext);">Nessuna spesa fissa ricorrente salvata.</div>';
    } else {
      recContainer.innerHTML = state.recurring.map(function(r, idx) {
        var icon = categoryIcon(r.category);
        return '<div class="list-row"><div><div>' + icon + ' ' + escapeHtml(r.desc || r.category) + '</div><div class="row-sub">' + escapeHtml(categoryLabel(r.category)) + ' • ' + fmtEur(r.amount) + '/mese</div></div><button type="button" class="del-btn" data-del-rec="' + idx + '">Rimuovi</button></div>';
      }).join('');
    }
  }

  function renderStorico() {
    document.getElementById('storicoMonthHeader').textContent = 'Dettaglio Mensile ' + currentYear;
    var arr = state.monthly[currentYear] || makeZeroYear();
    var mHtml = '';
    for (var i = 0; i < 12; i++) {
      var val = Number(arr[i]) || 0;
      mHtml += '<div class="list-row clickable" data-edit-month="' + i + '"><div><div>' + MONTHS[i] + '</div><div class="row-sub">Tocca per modificare</div></div><div style="font-weight:600;color:' + (val > 0 ? 'var(--text)' : 'var(--subtext)') + '">' + fmtEur(val) + '</div></div>';
    }
    document.getElementById('storicoMonthlyList').innerHTML = mHtml;

    var evList = document.getElementById('storicoEventsList');
    var yearEvents = state.events.map(function(e, idx) { return { item: e, idx: idx }; }).filter(function(o) { return Number(o.item.year) === currentYear; });
    if (yearEvents.length === 0) {
      evList.innerHTML = '<div class="list-row" style="color:var(--subtext);">Nessun evento registrato per il ' + currentYear + '</div>';
    } else {
      evList.innerHTML = yearEvents.map(function(o) {
        var valStr = (o.item.value !== null && o.item.value !== undefined && o.item.value !== '') ? ' • ' + fmtEur(o.item.value) : '';
        return '<div class="list-row"><div><div>' + escapeHtml(o.item.title) + '</div><div class="row-sub">' + escapeHtml(o.item.year) + valStr + '</div></div><button type="button" class="del-btn" data-del-ev="' + o.idx + '">Elimina</button></div>';
      }).join('');
    }

    var yList = document.getElementById('storicoYearsList');
    var years = Object.keys(state.monthly).map(Number).sort(function(a, b) { return b - a; });
    if (years.length === 0) {
      yList.innerHTML = '<div class="list-row" style="color:var(--subtext);">Nessun dato storico presente</div>';
    } else {
      yList.innerHTML = years.map(function(y) {
        var sumIn = (state.monthly[y] || []).reduce(function(a, b) { return a + (Number(b) || 0); }, 0);
        var sumOut = state.expenses.filter(function(ex) { return ex.date && Number(ex.date.slice(0, 4)) === y; })
                                   .reduce(function(a, b) { return a + (Number(b.amount) || 0); }, 0);
        return '<div class="list-row clickable" data-select-year="' + y + '"><div><b>' + y + '</b><div class="row-sub">Uscite: ' + fmtEur(sumOut) + '</div></div><span style="font-weight:700;color:var(--blue)">' + fmtEur(sumIn) + '</span></div>';
      }).join('');
    }
  }
  function applyPrefsUI() {
    document.body.classList.toggle('dark', prefs.dark);
    var metaTheme = document.getElementById('themeColorMeta');
    if (metaTheme) metaTheme.setAttribute('content', prefs.dark ? '#000000' : '#F2F2F7');

    document.getElementById('toggleDark').checked = prefs.dark;
    document.getElementById('inpBudgetLimit').value = prefs.budgetLimit > 0 ? toDisplayAmount(prefs.budgetLimit).toFixed(2) : '';
    document.getElementById('languageSelect').value = prefs.language;
    ['segUscita','segEvento'].forEach(function(id){ var el=document.getElementById(id); if(el) el.textContent = tr(id==='segUscita' ? 'Uscita' : 'Evento'); });
    document.querySelector('label[for="inpAmount"]').textContent = tr('Totale Netto a Pagare') + ' (' + prefs.currency + ')';
    document.querySelector('label[for="expAmount"]').textContent = tr('Importo Uscita') + ' (' + prefs.currency + ')';
    document.querySelector('label[for="evVal"]').textContent = tr('Valore - opzionale') + ' (' + prefs.currency + ')';
    document.getElementById('currencySelect').value = prefs.currency;

    document.getElementById('vis-netto').checked = prefs.vis.netto;
    document.getElementById('vis-uscite').checked = prefs.vis.uscite;
    document.getElementById('vis-media').checked = prefs.vis.media;
    document.getElementById('vis-totale').checked = prefs.vis.totale;
    document.getElementById('vis-stipendio').checked = prefs.vis.stipendio;
    document.getElementById('vis-forecast').checked = prefs.vis.forecast !== false;
    document.getElementById('vis-chart-mensile').checked = prefs.vis.chartMensile;
    document.getElementById('vis-chart-spese').checked = prefs.vis.chartSpese;
    document.getElementById('vis-chart-annuale').checked = prefs.vis.chartAnnuale;
    document.getElementById('vis-chart-stipendi').checked = prefs.vis.chartStipendi !== false;

    document.getElementById('card-netto').style.display = prefs.vis.netto ? 'block' : 'none';
    document.getElementById('card-uscite').style.display = prefs.vis.uscite ? 'block' : 'none';
    document.getElementById('card-media').style.display = prefs.vis.media ? 'block' : 'none';
    document.getElementById('card-totale').style.display = prefs.vis.totale ? 'block' : 'none';
    document.getElementById('card-stipendio').style.display = prefs.vis.stipendio ? 'block' : 'none';
    document.getElementById('card-forecast').style.display = prefs.vis.forecast !== false ? 'block' : 'none';
    document.getElementById('card-chart-mensile').style.display = prefs.vis.chartMensile ? 'block' : 'none';
    document.getElementById('card-chart-spese').style.display = prefs.vis.chartSpese ? 'block' : 'none';
    document.getElementById('card-chart-annuale').style.display = prefs.vis.chartAnnuale ? 'block' : 'none';
    document.getElementById('card-chart-stipendi').style.display = prefs.vis.chartStipendi !== false ? 'block' : 'none';
  }


  var I18N = {
    en: {
      'Uscite Totali':'Total expenses','Saldo:':'Balance:','Delta Entrate:':'Other income:',
      'Lingua e valuta':'Language & currency','Lingua dell\'app':'App language','Valuta di visualizzazione':'Display currency',
      'I dati sono conservati in EUR; gli importi vengono convertiti per la visualizzazione.':'Data is stored in EUR; amounts are converted for display.',
      'Tasso di cambio aggiornato':'Exchange rate updated','Connessione non disponibile: usato il tasso di cambio indicativo salvato.':'Offline: using the saved indicative exchange rate.',
      'Aspetto':'Appearance','Budget':'Budget','Budget Spesa Mensile':'Monthly expense budget','Aspetto e Budget':'Appearance & budget','Dark Mode':'Dark mode','Budget Spese Mensile':'Monthly expense budget',
      '0 per nascondere la barra':'Enter 0 to hide the bar','Personalizzazione Dashboard':'Dashboard customization',
      'Entrate Nette + YoY':'Net income + YoY','Uscite Totali + Saldo':'Total expenses + savings','Media + Proiezione Annua':'Average + annual projection',
      'Storico Entrate + Delta Entrate':'Income history + balance','Storico Entrate':'Income history','Totale storico Stipendio':'Total salary history','Grafico Entrate Mensili':'Monthly income chart','Grafico Uscite Categorie':'Expenses by category chart','Grafico Entrate Annue':'Annual income chart',
      'Importa Buste Paga (PDF)':'Import payslips (PDF)','Legge dal PDF il netto del mese, il mese e l\'anno. Prima del salvataggio puoi controllare e correggere ogni valore.':'Reads monthly net pay, month and year from the PDF. Review and edit values before saving.',
      'Scegli uno o più file PDF':'Choose one or more PDF files','Scegli una cartella':'Choose a folder',
      'Importa / Esporta CSV e Backup JSON':'Import / export CSV and JSON backup','Formato CSV Entrate:':'Income CSV format:',
      'Formato CSV Uscite:':'Expense CSV format:','Scarica Modello CSV Entrate':'Download income CSV template','Scarica Modello CSV Uscite':'Download expense CSV template',
      'Carica CSV Entrate':'Import income CSV','Carica CSV Uscite (Estratto Conto)':'Import expenses CSV (bank statement)','📊 Importa Estratto Conto Excel (Entrate + Uscite)':'📊 Import bank statement Excel (income + expenses)','Supporta file Excel con colonne Data, Descrizione e Importo, oppure Dare/Avere o Uscite/Entrate. I movimenti saranno controllati prima del salvataggio.':'Supports Excel files with Date, Description and Amount columns, or Debit/Credit columns. Transactions are reviewed before saving.',
      'Esporta Entrate in CSV':'Export income to CSV','Esporta Uscite in CSV':'Export expenses to CSV',
      'Scarica Backup Completo (.JSON)':'Download full backup (.JSON)','Ripristina da Backup (.JSON)':'Restore from backup (.JSON)','Azzera Tutti i Dati':'Reset all data',
      'Entrate Nette':'Net income','Totale Uscite':'Total expenses','Risparmio:':'Savings:','Media Mensile':'Monthly average','Storico Entrate + Delta Entrate':'Income history + balance','Storico Entrate':'Income history','Totale storico Stipendio':'Total salary history',
      'Bilancio netto:':'Net balance:','Budget Spesa Mese Corrente':'Current month expense budget','Eventi & Scatti dell\'Anno':'Year events & milestones',
      'Entrate Mensili':'Monthly income','Uscite per Categoria':'Expenses by category','Entrate Nette Annue':'Annual net income',
      'Barre':'Bars','Linea':'Line','Torta':'Pie','Tocca il grafico per cambiare stile':'Tap chart to change style',
      'Tocca per alternare Torta e Barre':'Tap to switch between pie and bars','Uscite dell\'Anno':'Year expenses','Tutti i mesi':'All months',
      'Spese Ricorrenti Fisse':'Recurring fixed expenses','Applica al mese corrente':'Apply to current month','Dettaglio Mensile':'Monthly details',
      'Eventi dell\'Anno':'Year events','Confronto Tutti gli Anni':'All-years comparison','Dashboard':'Dashboard','Spese':'Expenses','Aggiungi':'Add','Storico':'History','Impostazioni':'Settings',
      'Nuovo Inserimento':'New entry','Annulla':'Cancel','Chiudi':'Close','Entrata':'Income','Uscita':'Expense','Evento':'Event',
      'Anno':'Year','Mese':'Month','Gennaio':'January','Febbraio':'February','Marzo':'March','Aprile':'April','Maggio':'May','Giugno':'June','Luglio':'July','Agosto':'August','Settembre':'September','Ottobre':'October','Novembre':'November','Dicembre':'December',
      'Totale Netto a Pagare':'Net amount','Salva Entrata Mensile':'Save monthly income','Scansiona Scontrino (Fotocamera OCR)':'Scan receipt (camera OCR)','Scansione Scontrino con Fotocamera':'Scan receipt with camera',
      'Data Spesa':'Expense date','Categoria':'Category','Alimentari e Supermercati':'Groceries & supermarkets','Casa, Bollette e Utenze':'Home, bills & utilities',
      'Auto, Carburante e Trasporti':'Car, fuel & transport','Salute e Farmacia':'Health & pharmacy','Ristoranti e Tempo Libero':'Restaurants & leisure',
      'Rate, Prestiti e Finanziamenti':'Installments, loans & financing','Altro':'Other','Descrizione / Negozio':'Description / store',
      'Salva anche come Spesa Ricorrente Fissa':'Also save as recurring expense','Salva Uscita':'Save expense','Descrizione Evento':'Event description',
      'Valore - opzionale':'Value - optional','Salva Evento':'Save event','Created By Marcello Gambicchia (2026)':'Created by Marcello Gambicchia (2026)',
      'Rimuovi':'Remove','Elimina':'Delete','Tocca per modificare':'Tap to edit','Nessuna uscita trovata per questo filtro.':'No expenses found for this filter.',
      'Nessuna spesa fissa ricorrente salvata.':'No recurring expenses saved.','Nessun evento registrato per il':'No events recorded for',
      'Nessun dato storico presente':'No historical data available','Nessun dato positivo da visualizzare.':'No positive data to display.',
      'Nessuna uscita registrata nel':'No expenses recorded in','Premi':'Press','per inserire la prima entrata.':'to add your first income.',
      'Stima anno:':'Year projection:','Budget Spese':'Expense budget','Nessun file letto':'No files read','Importa':'Import','Mese?':'Month?',
      'Nessun file PDF trovato':'No PDF file found','File JSON non valido':'Invalid JSON file','Backup JSON ripristinato':'JSON backup restored',
      'Tutti i dati sono stati azzerati':'All data has been reset','Anno non valido':'Invalid year','Importo non valido':'Invalid amount',
      'Spesa Fineco rilevata: verifica e salva':'Fineco expense detected: review and save','Nessun evento registrato per il':'No events recorded for'
    },
    es: {
      'Uscite Totali':'Gastos totales','Saldo:':'Saldo:','Delta Entrate:':'Otros ingresos:',
      'Lingua e valuta':'Idioma y moneda','Lingua dell\'app':'Idioma de la aplicación','Valuta di visualizzazione':'Moneda de visualización',
      'I dati sono conservati in EUR; gli importi vengono convertiti per la visualizzazione.':'Los datos se guardan en EUR; los importes se convierten para mostrarse.',
      'Tasso di cambio aggiornato':'Tipo de cambio actualizado','Aspetto':'Apariencia','Budget':'Presupuesto','Budget Spesa Mensile':'Presupuesto mensual de gastos','Aspetto e Budget':'Apariencia y presupuesto','Dark Mode':'Modo oscuro',
      'Budget Spese Mensile':'Presupuesto mensual de gastos','Personalizzazione Dashboard':'Personalizar panel','Entrate Nette':'Ingresos netos',
      'Totale Uscite':'Gastos totales','Risparmio:':'Ahorro:','Media Mensile':'Promedio mensual','Storico Entrate + Delta Entrate':'Historial de ingresos + saldo','Storico Entrate':'Historial de ingresos','Totale storico Stipendio':'Total histórico de salarios',
      'Bilancio netto:':'Balance neto:','Entrate Mensili':'Ingresos mensuales','Uscite per Categoria':'Gastos por categoría',
      'Entrate Nette Annue':'Ingresos netos anuales','Barre':'Barras','Linea':'Línea','Torta':'Circular',
      'Dashboard':'Panel','Spese':'Gastos','Aggiungi':'Añadir','Storico':'Historial','Impostazioni':'Ajustes',
      'Nuovo Inserimento':'Nuevo registro','Annulla':'Cancelar','Chiudi':'Cerrar','Entrata':'Ingreso','Uscita':'Gasto','Evento':'Evento',
      'Anno':'Año','Mese':'Mes','Gennaio':'Enero','Febbraio':'Febrero','Marzo':'Marzo','Aprile':'Abril','Maggio':'Mayo','Giugno':'Junio',
      'Luglio':'Julio','Agosto':'Agosto','Settembre':'Septiembre','Ottobre':'Octubre','Novembre':'Noviembre','Dicembre':'Diciembre',
      'Data Spesa':'Fecha del gasto','Categoria':'Categoría','Altro':'Otro','Descrizione / Negozio':'Descripción / tienda',
      'Salva Entrata Mensile':'Guardar ingreso mensual','Salva Uscita':'Guardar gasto','Salva Evento':'Guardar evento',
      'Rimuovi':'Eliminar','Elimina':'Borrar','Tocca per modificare':'Toca para editar','Tutti i mesi':'Todos los meses',
      'Spese Ricorrenti Fisse':'Gastos fijos recurrentes','Applica al mese corrente':'Aplicar al mes actual',
      'Dettaglio Mensile':'Detalle mensual','Eventi dell\'Anno':'Eventos del año','Confronto Tutti gli Anni':'Comparación de años',
      'Created By Marcello Gambicchia (2026)':'Creado por Marcello Gambicchia (2026)'
    },
    fr: {
      'Uscite Totali':'Dépenses totales','Saldo:':'Solde :','Delta Entrate:':'Autres revenus :',
      'Lingua e valuta':'Langue et devise','Lingua dell\'app':'Langue de l’application','Valuta di visualizzazione':'Devise d’affichage',
      'I dati sono conservati in EUR; gli importi vengono convertiti per la visualizzazione.':'Les données sont stockées en EUR ; les montants sont convertis pour l’affichage.',
      'Tasso di cambio aggiornato':'Taux de change actualisé','Aspetto':'Apparence','Budget':'Budget','Budget Spesa Mensile':'Budget mensuel des dépenses','Aspetto e Budget':'Apparence et budget','Dark Mode':'Mode sombre',
      'Budget Spese Mensile':'Budget mensuel des dépenses','Personalizzazione Dashboard':'Personnalisation du tableau de bord',
      'Entrate Nette':'Revenus nets','Totale Uscite':'Dépenses totales','Risparmio:':'Épargne :','Media Mensile':'Moyenne mensuelle',
      'Storico Entrate + Delta Entrate':'Historique des revenus + solde','Storico Entrate':'Historique des revenus','Totale storico Stipendio':'Total historique des salaires','Bilancio netto:':'Solde net :','Entrate Mensili':'Revenus mensuels',
      'Uscite per Categoria':'Dépenses par catégorie','Entrate Nette Annue':'Revenus nets annuels','Barre':'Barres','Linea':'Courbe','Torta':'Camembert',
      'Dashboard':'Tableau de bord','Spese':'Dépenses','Aggiungi':'Ajouter','Storico':'Historique','Impostazioni':'Paramètres',
      'Nuovo Inserimento':'Nouvelle saisie','Annulla':'Annuler','Chiudi':'Fermer','Entrata':'Revenu','Uscita':'Dépense','Evento':'Événement',
      'Anno':'Année','Mese':'Mois','Gennaio':'Janvier','Febbraio':'Février','Marzo':'Mars','Aprile':'Avril','Maggio':'Mai','Giugno':'Juin',
      'Luglio':'Juillet','Agosto':'Août','Settembre':'Septembre','Ottobre':'Octobre','Novembre':'Novembre','Dicembre':'Décembre',
      'Data Spesa':'Date de dépense','Categoria':'Catégorie','Altro':'Autre','Descrizione / Negozio':'Description / magasin',
      'Salva Entrata Mensile':'Enregistrer le revenu mensuel','Salva Uscita':'Enregistrer la dépense','Salva Evento':'Enregistrer l’événement',
      'Rimuovi':'Supprimer','Elimina':'Supprimer','Tocca per modificare':'Toucher pour modifier','Tutti i mesi':'Tous les mois',
      'Spese Ricorrenti Fisse':'Dépenses fixes récurrentes','Applica al mese corrente':'Appliquer au mois actuel',
      'Dettaglio Mensile':'Détail mensuel','Eventi dell\'Anno':'Événements de l’année','Confronto Tutti gli Anni':'Comparaison annuelle',
      'Created By Marcello Gambicchia (2026)':'Créé par Marcello Gambicchia (2026)'
    },
    de: {
      'Uscite Totali':'Gesamtausgaben','Saldo:':'Saldo:','Delta Entrate:':'Sonstige Einnahmen:',
      'Lingua e valuta':'Sprache & Währung','Lingua dell\'app':'App-Sprache','Valuta di visualizzazione':'Anzeigewährung',
      'I dati sono conservati in EUR; gli importi vengono convertiti per la visualizzazione.':'Daten werden in EUR gespeichert; Beträge werden zur Anzeige umgerechnet.',
      'Tasso di cambio aggiornato':'Wechselkurs aktualisiert','Aspetto':'Darstellung','Budget':'Budget','Budget Spesa Mensile':'Monatliches Ausgabenbudget','Aspetto e Budget':'Darstellung & Budget','Dark Mode':'Dunkelmodus',
      'Budget Spese Mensile':'Monatliches Ausgabenbudget','Personalizzazione Dashboard':'Dashboard anpassen',
      'Entrate Nette':'Nettoeinnahmen','Totale Uscite':'Gesamtausgaben','Risparmio:':'Ersparnis:','Media Mensile':'Monatsdurchschnitt',
      'Storico Entrate + Delta Entrate':'Einnahmenverlauf + Saldo','Storico Entrate':'Einnahmenverlauf','Totale storico Stipendio':'Gehaltssumme insgesamt','Bilancio netto:':'Nettosaldo:','Entrate Mensili':'Monatliche Einnahmen',
      'Uscite per Categoria':'Ausgaben nach Kategorie','Entrate Nette Annue':'Jährliche Nettoeinnahmen','Barre':'Balken','Linea':'Linie','Torta':'Kreis',
      'Dashboard':'Übersicht','Spese':'Ausgaben','Aggiungi':'Hinzufügen','Storico':'Verlauf','Impostazioni':'Einstellungen',
      'Nuovo Inserimento':'Neuer Eintrag','Annulla':'Abbrechen','Chiudi':'Schließen','Entrata':'Einnahme','Uscita':'Ausgabe','Evento':'Ereignis',
      'Anno':'Jahr','Mese':'Monat','Gennaio':'Januar','Febbraio':'Februar','Marzo':'März','Aprile':'April','Maggio':'Mai','Giugno':'Juni',
      'Luglio':'Juli','Agosto':'August','Settembre':'September','Ottobre':'Oktober','Novembre':'November','Dicembre':'Dezember',
      'Data Spesa':'Ausgabedatum','Categoria':'Kategorie','Altro':'Sonstiges','Descrizione / Negozio':'Beschreibung / Geschäft',
      'Salva Entrata Mensile':'Monatliche Einnahme speichern','Salva Uscita':'Ausgabe speichern','Salva Evento':'Ereignis speichern',
      'Rimuovi':'Entfernen','Elimina':'Löschen','Tocca per modificare':'Zum Bearbeiten antippen','Tutti i mesi':'Alle Monate',
      'Spese Ricorrenti Fisse':'Wiederkehrende Fixkosten','Applica al mese corrente':'Auf aktuellen Monat anwenden',
      'Dettaglio Mensile':'Monatsdetails','Eventi dell\'Anno':'Jahresereignisse','Confronto Tutti gli Anni':'Jahresvergleich',
      'Created By Marcello Gambicchia (2026)':'Erstellt von Marcello Gambicchia (2026)'
    }
  };

  Object.assign(I18N.en, {
    "Eventi & Scatti dell'Anno":'Events & highlights of the year','Tocca il grafico per cambiare stile':'Tap the chart to change its style','Tocca per alternare Torta e Barre':'Tap to switch between pie and bars','Scorri per tutti gli anni':'Scroll through all years',"Uscite dell'Anno":'Expenses of the year','Importa Buste Paga (PDF)':'Import payslips (PDF)',"Legge dal PDF il netto del mese, il mese e l'anno. Prima del salvataggio puoi controllare e correggere ogni valore.":'Reads the monthly net amount, month and year from the PDF. You can review and edit each value before saving.','Scegli uno o più file PDF':'Choose one or more PDF files','Scegli una cartella':'Choose a folder','Importa / Esporta CSV e Backup JSON':'Import / Export CSV and JSON backup','Formato CSV Entrate:':'Income CSV format:','Formato CSV Uscite:':'Expenses CSV format:','Scarica Modello CSV Entrate':'Download income CSV template','Scarica Modello CSV Uscite':'Download expenses CSV template','Carica CSV Entrate':'Import income CSV','Carica CSV Uscite (Estratto Conto)':'Import expenses CSV (bank statement)','📊 Importa Estratto Conto Excel (Entrate + Uscite)':'📊 Import bank statement Excel (income + expenses)','Supporta file Excel con colonne Data, Descrizione e Importo, oppure Dare/Avere o Uscite/Entrate. I movimenti saranno controllati prima del salvataggio.':'Supports Excel files with Date, Description and Amount columns, or Debit/Credit columns. Transactions are reviewed before saving.','Esporta Entrate in CSV':'Export income to CSV','Esporta Uscite in CSV':'Export expenses to CSV','Scarica Backup Completo (.JSON)':'Download full backup (.JSON)','Ripristina da Backup (.JSON)':'Restore from backup (.JSON)','Azzera Tutti i Dati':'Reset all data','Importa Buste Paga':'Import payslips','Scansiona Scontrino (Fotocamera OCR)':'Scan receipt (camera OCR)','Scansione Scontrino con Fotocamera':'Scan receipt with camera','Salva anche come Spesa Ricorrente Fissa':'Also save as recurring fixed expense','Descrizione Evento':'Event description','Budget Spesa Mese Corrente':'Current month expense budget','Uscite:':'Expenses:','Nessun dato storico presente':'No historical data available','Importa':'Import','Totale Netto a Pagare':'Net amount payable','Importo Uscita':'Expense amount','Valore - opzionale':'Value - optional'
  });
  Object.assign(I18N.es, {
    "Eventi & Scatti dell'Anno":'Eventos y momentos del año','Tocca il grafico per cambiare stile':'Toca el gráfico para cambiar el estilo','Tocca per alternare Torta e Barre':'Toca para alternar entre circular y barras','Scorri per tutti gli anni':'Desplázate por todos los años',"Uscite dell'Anno":'Gastos del año','Importa Buste Paga (PDF)':'Importar nóminas (PDF)',"Legge dal PDF il netto del mese, il mese e l'anno. Prima del salvataggio puoi controllare e correggere ogni valore.":'Lee del PDF el importe neto mensual, el mes y el año. Puedes revisar y corregir cada valor antes de guardar.','Scegli uno o più file PDF':'Elegir uno o más archivos PDF','Scegli una cartella':'Elegir una carpeta','Importa / Esporta CSV e Backup JSON':'Importar / Exportar CSV y copia JSON','Formato CSV Entrate:':'Formato CSV de ingresos:','Formato CSV Uscite:':'Formato CSV de gastos:','Scarica Modello CSV Entrate':'Descargar plantilla CSV de ingresos','Scarica Modello CSV Uscite':'Descargar plantilla CSV de gastos','Carica CSV Entrate':'Importar CSV de ingresos','Carica CSV Uscite (Estratto Conto)':'Importar CSV de gastos (extracto bancario)','Esporta Entrate in CSV':'Exportar ingresos a CSV','Esporta Uscite in CSV':'Exportar gastos a CSV','Scarica Backup Completo (.JSON)':'Descargar copia completa (.JSON)','Ripristina da Backup (.JSON)':'Restaurar desde copia (.JSON)','Azzera Tutti i Dati':'Borrar todos los datos','Importa Buste Paga':'Importar nóminas','Scansiona Scontrino (Fotocamera OCR)':'Escanear recibo (cámara OCR)','Scansione Scontrino con Fotocamera':'Escanear recibo con cámara','Salva anche come Spesa Ricorrente Fissa':'Guardar también como gasto fijo recurrente','Descrizione Evento':'Descripción del evento','Budget Spesa Mese Corrente':'Presupuesto de gastos del mes actual','Uscite:':'Gastos:','Nessun dato storico presente':'No hay datos históricos','Importa':'Importar','Totale Netto a Pagare':'Importe neto a pagar','Importo Uscita':'Importe del gasto','Valore - opzionale':'Valor - opcional'
  });
  Object.assign(I18N.fr, {
    "Eventi & Scatti dell'Anno":'Événements et moments de l’année','Tocca il grafico per cambiare stile':'Touchez le graphique pour changer le style','Tocca per alternare Torta e Barre':'Touchez pour alterner camembert et barres','Scorri per tutti gli anni':'Faites défiler toutes les années',"Uscite dell'Anno":'Dépenses de l’année','Importa Buste Paga (PDF)':'Importer les fiches de paie (PDF)',"Legge dal PDF il netto del mese, il mese e l'anno. Prima del salvataggio puoi controllare e correggere ogni valore.":'Lit le montant net mensuel, le mois et l’année depuis le PDF. Vous pouvez vérifier et corriger chaque valeur avant l’enregistrement.','Scegli uno o più file PDF':'Choisir un ou plusieurs fichiers PDF','Scegli una cartella':'Choisir un dossier','Importa / Esporta CSV e Backup JSON':'Importer / Exporter CSV et sauvegarde JSON','Formato CSV Entrate:':'Format CSV des revenus :','Formato CSV Uscite:':'Format CSV des dépenses :','Scarica Modello CSV Entrate':'Télécharger le modèle CSV des revenus','Scarica Modello CSV Uscite':'Télécharger le modèle CSV des dépenses','Carica CSV Entrate':'Importer CSV des revenus','Carica CSV Uscite (Estratto Conto)':'Importer CSV des dépenses (relevé bancaire)','Esporta Entrate in CSV':'Exporter les revenus en CSV','Esporta Uscite in CSV':'Exporter les dépenses en CSV','Scarica Backup Completo (.JSON)':'Télécharger la sauvegarde complète (.JSON)','Ripristina da Backup (.JSON)':'Restaurer depuis une sauvegarde (.JSON)','Azzera Tutti i Dati':'Effacer toutes les données','Importa Buste Paga':'Importer les fiches de paie','Scansiona Scontrino (Fotocamera OCR)':'Scanner un reçu (caméra OCR)','Scansione Scontrino con Fotocamera':'Scanner un reçu avec la caméra','Salva anche come Spesa Ricorrente Fissa':'Enregistrer aussi comme dépense fixe récurrente','Descrizione Evento':'Description de l’événement','Budget Spesa Mese Corrente':'Budget des dépenses du mois en cours','Uscite:':'Dépenses :','Nessun dato storico presente':'Aucune donnée historique','Importa':'Importer','Totale Netto a Pagare':'Montant net à payer','Importo Uscita':'Montant de la dépense','Valore - opzionale':'Valeur - facultatif'
  });
  Object.assign(I18N.de, {
    "Eventi & Scatti dell'Anno":'Ereignisse und Höhepunkte des Jahres','Tocca il grafico per cambiare stile':'Diagramm antippen, um den Stil zu ändern','Tocca per alternare Torta e Barre':'Antippen, um zwischen Kreis- und Balkendiagramm zu wechseln','Scorri per tutti gli anni':'Scrollen für alle Jahre',"Uscite dell'Anno":'Ausgaben des Jahres','Importa Buste Paga (PDF)':'Gehaltsabrechnungen importieren (PDF)',"Legge dal PDF il netto del mese, il mese e l'anno. Prima del salvataggio puoi controllare e correggere ogni valore.":'Liest Nettobetrag, Monat und Jahr aus dem PDF. Vor dem Speichern können Sie jeden Wert prüfen und ändern.','Scegli uno o più file PDF':'Eine oder mehrere PDF-Dateien auswählen','Scegli una cartella':'Ordner auswählen','Importa / Esporta CSV e Backup JSON':'CSV und JSON-Sicherung importieren / exportieren','Formato CSV Entrate:':'CSV-Format Einnahmen:','Formato CSV Uscite:':'CSV-Format Ausgaben:','Scarica Modello CSV Entrate':'CSV-Vorlage für Einnahmen herunterladen','Scarica Modello CSV Uscite':'CSV-Vorlage für Ausgaben herunterladen','Carica CSV Entrate':'Einnahmen-CSV importieren','Carica CSV Uscite (Estratto Conto)':'Ausgaben-CSV importieren (Kontoauszug)','📊 Importa Estratto Conto Excel (Entrate + Uscite)':'📊 Kontoauszug aus Excel importieren (Einnahmen + Ausgaben)','Supporta file Excel con colonne Data, Descrizione e Importo, oppure Dare/Avere o Uscite/Entrate. I movimenti saranno controllati prima del salvataggio.':'Unterstützt Excel-Spalten Datum, Beschreibung und Betrag oder Soll/Haben. Buchungen werden vor dem Speichern geprüft.','Esporta Entrate in CSV':'Einnahmen als CSV exportieren','Esporta Uscite in CSV':'Ausgaben als CSV exportieren','Scarica Backup Completo (.JSON)':'Vollständige Sicherung herunterladen (.JSON)','Ripristina da Backup (.JSON)':'Aus Sicherung wiederherstellen (.JSON)','Azzera Tutti i Dati':'Alle Daten zurücksetzen','Importa Buste Paga':'Gehaltsabrechnungen importieren','Scansiona Scontrino (Fotocamera OCR)':'Beleg scannen (OCR-Kamera)','Scansione Scontrino con Fotocamera':'Beleg mit Kamera scannen','Salva anche come Spesa Ricorrente Fissa':'Auch als wiederkehrende Fixkosten speichern','Descrizione Evento':'Ereignisbeschreibung','Budget Spesa Mese Corrente':'Ausgabenbudget des aktuellen Monats','Uscite:':'Ausgaben:','Nessun dato storico presente':'Keine historischen Daten vorhanden','Importa':'Importieren','Totale Netto a Pagare':'Auszuzahlender Nettobetrag','Importo Uscita':'Ausgabenbetrag','Valore - opzionale':'Wert - optional'
  });


  // Traduzioni aggiuntive: finestra informazioni, budget e nuove funzioni.
  Object.assign(I18N.en, {"Informazioni su Wallet-PRO": "About Wallet-PRO", "Ti piace ": "Do you like ", "È gratuita senza pubblicità e pensata per aiutarti a gestire il tuo portafoglio senza pensieri.": "It is free, ad-free, and designed to help you manage your finances with peace of mind.", "Grazie per averla scaricata.": "Thank you for downloading it.", "Previsione saldo a fine mese": "End-of-month balance forecast", "Budget per categoria": "Budget by category", "Budget mensile": "Monthly budget", "Tocca la barra per cambiare budget": "Tap the bar to switch budgets", "Anteprima importazione": "Import preview", "Categorie automatiche": "Automatic categories", "Saldo previsto": "Forecast balance", "Scarica backup cifrato": "Download encrypted backup", "Backup cifrato pronto": "Encrypted backup ready", "Salva / condividi backup cifrato": "Save / share encrypted backup", "Gestione abbonamenti": "Subscription management", "Analisi automatica spese": "Automatic expense analysis", "Inserisci Scadenze": "Add reminders", "Importa dati": "Import data", "Esporta dati": "Export data", "Backup dati": "Data backup", "BackUp dati": "Data backup", "Notifiche scadenze": "Due-date notifications", "Informazioni": "Information", "Salva budget": "Save budget", "Annulla importazione": "Cancel import", "Conferma importazione": "Confirm import", "Duplicati ignorati": "Duplicates skipped", "Nuovi movimenti": "New transactions", "Impostazioni": "Settings", "Chiudi": "Close"});
  Object.assign(I18N.es, {"Informazioni su Wallet-PRO": "Información sobre Wallet-PRO", "Ti piace ": "¿Te gusta ", "È gratuita senza pubblicità e pensata per aiutarti a gestire il tuo portafoglio senza pensieri.": "Es gratuita, sin publicidad, y está diseñada para ayudarte a gestionar tus finanzas con tranquilidad.", "Grazie per averla scaricata.": "Gracias por descargarla.", "Previsione saldo a fine mese": "Previsión del saldo a fin de mes", "Budget per categoria": "Presupuesto por categoría", "Budget mensile": "Presupuesto mensual", "Tocca la barra per cambiare budget": "Toca la barra para cambiar de presupuesto", "Anteprima importazione": "Vista previa de importación", "Categorie automatiche": "Categorías automáticas", "Saldo previsto": "Saldo previsto", "Scarica backup cifrato": "Descargar copia cifrada", "Backup cifrato pronto": "Copia cifrada lista", "Salva / condividi backup cifrato": "Guardar / compartir copia cifrada", "Gestione abbonamenti": "Gestión de suscripciones", "Analisi automatica spese": "Análisis automático de gastos", "Inserisci Scadenze": "Añadir vencimientos", "Importa dati": "Importar datos", "Esporta dati": "Exportar datos", "Backup dati": "Copia de seguridad", "BackUp dati": "Copia de seguridad", "Notifiche scadenze": "Notificaciones de vencimientos", "Informazioni": "Información", "Salva budget": "Guardar presupuesto", "Annulla importazione": "Cancelar importación", "Conferma importazione": "Confirmar importación", "Duplicati ignorati": "Duplicados omitidos", "Nuovi movimenti": "Nuevos movimientos", "Impostazioni": "Ajustes", "Chiudi": "Cerrar"});
  Object.assign(I18N.fr, {"Informazioni su Wallet-PRO": "À propos de Wallet-PRO", "Ti piace ": "Vous aimez ", "È gratuita senza pubblicità e pensata per aiutarti a gestire il tuo portafoglio senza pensieri.": "Elle est gratuite, sans publicité, et conçue pour vous aider à gérer vos finances sereinement.", "Grazie per averla scaricata.": "Merci de l’avoir téléchargée.", "Previsione saldo a fine mese": "Prévision du solde de fin de mois", "Budget per categoria": "Budget par catégorie", "Budget mensile": "Budget mensuel", "Tocca la barra per cambiare budget": "Touchez la barre pour changer de budget", "Anteprima importazione": "Aperçu de l’importation", "Categorie automatiche": "Catégories automatiques", "Saldo previsto": "Solde prévisionnel", "Scarica backup cifrato": "Télécharger la sauvegarde chiffrée", "Backup cifrato pronto": "Sauvegarde chiffrée prête", "Salva / condividi backup cifrato": "Enregistrer / partager la sauvegarde chiffrée", "Gestione abbonamenti": "Gestion des abonnements", "Analisi automatica spese": "Analyse automatique des dépenses", "Inserisci Scadenze": "Ajouter des échéances", "Importa dati": "Importer des données", "Esporta dati": "Exporter des données", "Backup dati": "Sauvegarde des données", "BackUp dati": "Sauvegarde des données", "Notifiche scadenze": "Notifications d’échéances", "Informazioni": "Informations", "Salva budget": "Enregistrer le budget", "Annulla importazione": "Annuler l’importation", "Conferma importazione": "Confirmer l’importation", "Duplicati ignorati": "Doublons ignorés", "Nuovi movimenti": "Nouvelles opérations", "Impostazioni": "Paramètres", "Chiudi": "Fermer"});
  Object.assign(I18N.de, {"Informazioni su Wallet-PRO": "Über Wallet-PRO", "Ti piace ": "Gefällt dir ", "È gratuita senza pubblicità e pensata per aiutarti a gestire il tuo portafoglio senza pensieri.": "Sie ist kostenlos, werbefrei und hilft dir, deine Finanzen entspannt zu verwalten.", "Grazie per averla scaricata.": "Danke fürs Herunterladen.", "Previsione saldo a fine mese": "Prognose des Monatsendsaldos", "Budget per categoria": "Budget nach Kategorie", "Budget mensile": "Monatsbudget", "Tocca la barra per cambiare budget": "Balken antippen, um das Budget zu wechseln", "Anteprima importazione": "Importvorschau", "Categorie automatiche": "Automatische Kategorien", "Saldo previsto": "Voraussichtlicher Saldo", "Scarica backup cifrato": "Verschlüsseltes Backup herunterladen", "Backup cifrato pronto": "Verschlüsseltes Backup bereit", "Salva / condividi backup cifrato": "Verschlüsseltes Backup speichern / teilen", "Gestione abbonamenti": "Abonnementverwaltung", "Analisi automatica spese": "Automatische Ausgabenanalyse", "Inserisci Scadenze": "Fälligkeiten hinzufügen", "Importa dati": "Daten importieren", "Esporta dati": "Daten exportieren", "Backup dati": "Datensicherung", "BackUp dati": "Datensicherung", "Notifiche scadenze": "Fälligkeitserinnerungen", "Informazioni": "Informationen", "Salva budget": "Budget speichern", "Annulla importazione": "Import abbrechen", "Conferma importazione": "Import bestätigen", "Duplicati ignorati": "Duplikate übersprungen", "Nuovi movimenti": "Neue Buchungen", "Impostazioni": "Einstellungen", "Chiudi": "Schließen"});

  // Etichette categorie localizzate; i valori salvati restano in italiano.
  var CATEGORY_TRANSLATIONS = {"en": {"Alimentari": "Groceries & supermarkets", "Casa & Utenze": "Home, bills & utilities", "Auto & Trasporti": "Car, fuel & transport", "Salute": "Health & pharmacy", "Tempo Libero": "Restaurants & leisure", "Rate & Finanziamenti": "Installments, loans & financing", "Altro": "Other"}, "es": {"Alimentari": "Alimentación y supermercados", "Casa & Utenze": "Hogar, facturas y servicios", "Auto & Trasporti": "Coche, combustible y transporte", "Salute": "Salud y farmacia", "Tempo Libero": "Restaurantes y ocio", "Rate & Finanziamenti": "Cuotas, préstamos y financiación", "Altro": "Otros"}, "fr": {"Alimentari": "Alimentation et supermarchés", "Casa & Utenze": "Maison, factures et services", "Auto & Trasporti": "Voiture, carburant et transports", "Salute": "Santé et pharmacie", "Tempo Libero": "Restaurants et loisirs", "Rate & Finanziamenti": "Mensualités, prêts et financements", "Altro": "Autres"}, "de": {"Alimentari": "Lebensmittel und Supermärkte", "Casa & Utenze": "Wohnen, Rechnungen und Nebenkosten", "Auto & Trasporti": "Auto, Kraftstoff und Verkehr", "Salute": "Gesundheit und Apotheke", "Tempo Libero": "Restaurants und Freizeit", "Rate & Finanziamenti": "Raten, Kredite und Finanzierung", "Altro": "Sonstiges"}};
  function categoryLabel(category) {
    var labels = CATEGORY_TRANSLATIONS[prefs.language] || {};
    return labels[category] || category;
  }
  function translateExpenseCategories() {
    var select = document.getElementById('expCategory');
    if (!select) return;
    syncExpenseCategoryOptions();
    Array.prototype.forEach.call(select.options, function(option) {
      if (!option.dataset.originalCategoryText) option.dataset.originalCategoryText = option.textContent;
      var original = option.dataset.originalCategoryText;
      var icon = (original.match(/^\s*[^\w\s]+\s*/u) || [''])[0];
      option.textContent = icon + categoryLabel(option.value);
    });
  }

  function tr(s) {
    var dict = I18N[prefs.language] || {};
    return dict[s] || s;
  }
  // Conserva sempre il testo originale: le traduzioni non devono mai diventare
  // la nuova sorgente, altrimenti il passaggio EN -> FR -> IT resta bloccato.
  var originalTextNodes = new WeakMap();
  var originalAttributes = new WeakMap();
  function translatePage() {
    var dict = Object.assign({}, I18N[prefs.language] || {});
    var cardLabels = {
      en: ['Salary Income', 'Total Income', 'Salary Income + YoY', 'Total Income + Balance'],
      es: ['Ingresos salariales', 'Ingresos totales', 'Ingresos salariales + variación anual', 'Ingresos totales + saldo'],
      fr: ['Revenus salariaux', 'Revenus totaux', 'Revenus salariaux + évolution annuelle', 'Revenus totaux + solde'],
      de: ['Gehaltseinnahmen', 'Gesamteinnahmen', 'Gehaltseinnahmen + Jahresvergleich', 'Gesamteinnahmen + Saldo']
    };
    if (cardLabels[prefs.language]) {
      ['Entrate Stipendio', 'Entrate Totali', 'Entrate Stipendio + YoY', 'Entrate Totali + Bilancio'].forEach(function(k, i) {
        dict[k] = cardLabels[prefs.language][i];
      });
    }
    var keys = Object.keys(dict).sort(function(a,b){return b.length-a.length;});
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function(node) {
      if (!originalTextNodes.has(node)) originalTextNodes.set(node, node.nodeValue);
      var original = originalTextNodes.get(node);
      var trimmed = original.trim();
      if (!trimmed) return;
      var translated = dict[trimmed];
      if (translated === undefined) {
        translated = original;
        keys.forEach(function(k) {
          if (translated.indexOf(k) !== -1) translated = translated.split(k).join(dict[k]);
        });
      }
      if (node.nodeValue !== translated) node.nodeValue = translated;
    });
    document.querySelectorAll('[placeholder],[aria-label],[title],option').forEach(function(el) {
      var saved = originalAttributes.get(el) || {};
      ['placeholder','aria-label','title'].forEach(function(a) {
        if (el.hasAttribute(a)) {
          if (saved[a] === undefined) saved[a] = el.getAttribute(a);
          var value = saved[a];
          el.setAttribute(a, dict[value] !== undefined ? dict[value] : value);
        }
      });
      if (el.tagName === 'OPTION') {
        if (saved.optionText === undefined) saved.optionText = el.textContent;
        var optionText = saved.optionText.trim();
        el.textContent = dict[optionText] !== undefined ? dict[optionText] : optionText;
      }
      originalAttributes.set(el, saved);
    });
    translateExpenseCategories();
    // La valuta appare una sola volta nel titolo di ciascun grafico.
    // I valori delle barre, delle linee e delle legende restano numerici.
    var chartTitles = [
      ['monthlyChartTitle', 'Entrate Mensili ' + currentYear],
      ['expenseChartTitle', 'Uscite per Categoria ' + currentYear],
      ['annualChartTitle', 'Entrate Nette Annue'],
      ['salaryChartTitle', 'Totale Stipendi · Tutti gli anni']
    ];
    chartTitles.forEach(function(item) {
      var el = document.getElementById(item[0]);
      if (el) el.textContent = tr(item[1]) + ' (' + prefs.currency + ')';
    });
    document.documentElement.lang = prefs.language;
  }

  // Entrate bancarie dettagliate e riepiloghi mensili; nessuna duplicazione nei totali.
  var INCOME_CATEGORIES = ['Stipendio','Pensione','Bonifici','Rimborsi','Interessi','Vendite','Altro'];
  function incomeCategories() {
    var found = {};
    INCOME_CATEGORIES.concat(allCategories()).forEach(function(c){found[c]=true;});
    (state.incomeCategories || []).forEach(function(c){found[c]=true;});
    (state.bankIncomeEntries || []).forEach(function(e){if(e.category)found[e.category]=true;});
    return Object.keys(found);
  }
  function incomeIcon(c) { return customCategoryIcons[c] ? categoryIcon(c) : (({Stipendio:'💼',Pensione:'🏦',Bonifici:'💸',Rimborsi:'↩️',Interessi:'📈',Vendite:'🛍️',Altro:'🏷️'})[c] || categoryIcon(c)); }
  function syncIncomeCategoryOptions() {
    var sel=document.getElementById('monthlyIncomeCategory');if(!sel)return;
    var old=sel.value;
    sel.innerHTML=incomeCategories().map(function(c){return '<option value="'+escapeHtml(c)+'">'+incomeIcon(c)+' '+escapeHtml(c)+'</option>';}).join('');
    if(incomeCategories().indexOf(old)>=0)sel.value=old;
    if (document.getElementById('incomeDayGroup')) document.getElementById('incomeDayGroup').style.display=sel.value==='Stipendio'?'none':'block';
  }
  // Migrazione una tantum: trasforma i vecchi importi mensili senza causale
  // in righe vere, senza cambiare i totali contabili esistenti.
  function migrateLegacyIncomeRows() {
    if (state.incomeRowsMigratedV2) return;
    if (!Array.isArray(state.bankIncomeEntries)) state.bankIncomeEntries=[];
    Object.keys(state.monthly || {}).forEach(function(y) {
      var arr=state.monthly[y]; if (!Array.isArray(arr)) return;
      for(var m=0;m<12;m++) {
        var detail=state.bankIncomeEntries.reduce(function(sum,e){
          return e.date && Number(e.date.slice(0,4))===Number(y) && Number(e.date.slice(5,7))===m+1 ? sum+(Number(e.amount)||0):sum;
        },0);
        var residual=Math.round(((Number(arr[m])||0)-detail)*100)/100;
        if(residual>0.009) {
          var cat=(state.monthlyIncomeCategories||{})[y+'-'+m]||'Stipendio';
          state.bankIncomeEntries.push({date:y+'-'+String(m+1).padStart(2,'0')+'-01',amount:residual,
            category:cat,desc:cat,source:'legacy-monthly',duplicateConfirmed:true});
        }
      }
    });
    state.incomeRowsMigratedV2=true;
    saveState();
  }
  // Stessa struttura e stesso modello di gestione delle Uscite.
  function renderEntrate() {
    renderIncomeRecurring();
    var el=document.getElementById('incomeList'); if(!el)return;
    document.getElementById('incomeHeaderTitle').textContent='Entrate '+currentYear;
    var month=document.getElementById('incomeMonthFilter').value;
    var search=(document.getElementById('incomeSearch').value||'').trim().toLocaleLowerCase();
    var list=(state.bankIncomeEntries||[]).map(function(item,idx){return {item:item,idx:idx};})
      .filter(function(o){var e=o.item;
        if(!e.date||Number(e.date.slice(0,4))!==currentYear)return false;
        if(month!=='all'&&Number(e.date.slice(5,7))-1!==Number(month))return false;
        return !search||[e.desc,e.category,e.date,String(e.amount)].join(' ').toLocaleLowerCase().includes(search);
      }).sort(function(a,b){return b.item.date.localeCompare(a.item.date);});
    document.getElementById('incomeSearchCount').textContent=search?list.length+' entrate trovate':'';
    el.innerHTML=list.length?list.map(function(o){
      var e=o.item,cat=e.category||'Altro';
      var categories=incomeCategories(); if(categories.indexOf(cat)<0)categories.push(cat);
      return '<div class="list-row" style="flex-wrap:wrap;"><div style="flex:1;min-width:130px;"><div>'+incomeIcon(cat)+' <b>'+escapeHtml(e.desc||cat)+'</b></div><div class="row-sub">'+escapeHtml(e.date)+'</div></div><div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;justify-content:flex-end;"><span style="font-weight:700;color:var(--green);">+'+fmtEur(e.amount)+'</span><button type="button" class="del-btn" data-del-income="'+o.idx+'" aria-label="Elimina entrata">✕</button></div><select class="form-input" style="width:100%;font-size:13px;padding:7px 10px;" data-income-cat="'+o.idx+'" aria-label="Modifica categoria entrata">'+categories.map(function(c){return '<option value="'+escapeHtml(c)+'"'+(c===cat?' selected':'')+'>'+incomeIcon(c)+' '+escapeHtml(c)+'</option>';}).join('')+'</select></div>';
    }).join(''):'<div class="list-row" style="color:var(--subtext);">Nessuna entrata trovata per questo filtro.</div>';
  }
  function incomeCategoryEditor() {
    var panel=document.getElementById('incomeCategoryManager');panel.style.display='block';
    panel.innerHTML='<div style="padding:12px;"><label class="form-label" for="newIncomeCat">Nome nuova categoria</label><input id="newIncomeCat" class="form-input" maxlength="55" placeholder="Es. Affitti"><label class="form-label" for="incomeManagerIcon" style="margin-top:10px">Icona</label><select id="incomeManagerIcon" class="form-input"></select><div style="display:flex;gap:8px;margin-top:10px;"><button type="button" class="mini-btn" id="saveIncomeCat">Salva categoria</button><button type="button" class="mini-btn" id="cancelIncomeCat">Annulla</button></div><div id="incomeManagerExisting" style="margin-top:12px"></div></div>';
    fillCategoryEmojiSelect(document.getElementById('incomeManagerIcon'),'🏷️');
    document.getElementById('incomeManagerExisting').innerHTML=customCategories.map(function(c,i){return '<div class="list-row"><span>'+categoryIcon(c)+' '+escapeHtml(c)+'</span><button type="button" class="mini-btn" data-income-edit-icon="'+i+'">Modifica icona</button></div>';}).join('');
    document.getElementById('incomeManagerExisting').onclick=function(ev){var b=ev.target.closest('[data-income-edit-icon]');if(!b)return;var c=customCategories[Number(b.dataset.incomeEditIcon)];document.getElementById('newIncomeCat').value=c;fillCategoryEmojiSelect(document.getElementById('incomeManagerIcon'),categoryIcon(c));document.getElementById('saveIncomeCat').dataset.editCategory=c;};
    document.getElementById('newIncomeCat').focus();
    document.getElementById('cancelIncomeCat').onclick=function(){panel.style.display='none';};
    document.getElementById('saveIncomeCat').onclick=function(){var name=document.getElementById('newIncomeCat').value.trim(), old=this.dataset.editCategory, icon=document.getElementById('incomeManagerIcon').value;if(!name){showToast('Inserisci il nome della categoria');return;}if(incomeCategories().some(function(c){return c.toLocaleLowerCase()===name.toLocaleLowerCase() && c!==old;})){showToast('Categoria già presente');return;}if(old){var idx=customCategories.indexOf(old);if(idx<0)return;customCategories[idx]=name;if(name!==old){delete customCategoryIcons[old];state.expenses.forEach(function(x){if(x.category===old)x.category=name;});state.recurring.forEach(function(x){if(x.category===old)x.category=name;});state.bankIncomeEntries.forEach(function(x){if(x.category===old)x.category=name;});state.incomeRecurring.forEach(function(x){if(x.category===old)x.category=name;});state.incomeCategories=state.incomeCategories.map(function(c){return c===old?name:c;});}}else{customCategories.push(name);}customCategoryIcons[name]=icon;saveCustomCategories();saveState();panel.style.display='none';renderEntrate();renderSpese();renderDashboard();showToast('Categoria e icona aggiornate in tutta l’app');};
  }
  document.getElementById('btnAddIncomeCategory').addEventListener('click',incomeCategoryEditor);
  document.getElementById('incomeSearch').addEventListener('input',renderEntrate);
  document.getElementById('incomeMonthFilter').addEventListener('change',renderEntrate);
  // Identico sistema di delega eventi usato per Uscite; nessun confirm di Safari.
  document.getElementById('incomeList').addEventListener('click', function(ev) {
    var btn=ev.target.closest('[data-del-income]');
    if (!btn) return;
    ev.preventDefault();
    var i=parseInt(btn.getAttribute('data-del-income'),10);
    if (!Number.isInteger(i) || i<0 || i>=state.bankIncomeEntries.length) {showToast('Entrata non trovata');return;}
    var entry=state.bankIncomeEntries[i];
    var y=Number(String(entry.date).slice(0,4)),m=Number(String(entry.date).slice(5,7))-1;
    state.bankIncomeEntries.splice(i,1);
    // Il totale mensile e il dettaglio devono restare sincronizzati.
    if(state.monthly[y] && m>=0 && m<12)
      state.monthly[y][m]=Math.max(0,Math.round(((Number(state.monthly[y][m])||0)-(Number(entry.amount)||0))*100)/100);
    if(entry.source==='payslip') {
      var pk=paySalaryKey(y,m,Number(entry.amount));
      state.paySalaryKeys=(state.paySalaryKeys||[]).filter(function(k){return k!==pk;});
      var pi=(state.payslips||[]).findIndex(function(p){return Number(p.year)===y&&Number(p.month)===m&&Math.round(Number(p.amount)*100)===Math.round(Number(entry.amount)*100);});
      if(pi>=0)state.payslips.splice(pi,1);
    }
    // Non riaggiungere la voce cancellata con la migrazione dei riepiloghi.
    state.incomeRowsMigratedV2=true;
    try {
      localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    } catch(err) {window.alert('Impossibile salvare la cancellazione: '+err.message);return;}
    renderEntrate();renderDashboard();showToast('Entrata eliminata');
  });
  document.getElementById('incomeList').addEventListener('change',function(ev){
    var select=ev.target.closest('[data-income-cat]');if(!select)return;
    var i=Number(select.getAttribute('data-income-cat')),entry=(state.bankIncomeEntries||[])[i];if(!entry)return;
    var keyword=document.getElementById('incomeSearch').value.trim();
    var matches=keyword?(state.bankIncomeEntries||[]).map(function(e,j){return {e:e,j:j};}).filter(function(x){return String(x.e.desc||'').toLocaleLowerCase().includes(keyword.toLocaleLowerCase());}).map(function(x){return x.j;}):[];
    var newCat=select.value;
    function apply(choice){if(choice==='cancel'){renderEntrate();return;}var indices=choice==='all'?matches:[i];indices.forEach(function(j){if(state.bankIncomeEntries[j])state.bankIncomeEntries[j].category=newCat;});saveState();renderEntrate();showToast('Categoria aggiornata per '+indices.length+' entrata/e');}
    if(keyword&&matches.length>1&&matches.indexOf(i)>=0)askFilteredCategoryChange(matches.length,keyword,apply);else apply('one');
  });
  function switchTab(tabName) {
    // Le sezioni Impostazioni si richiudono quando si lascia la scheda.
    var settingsView = document.getElementById('view-impostazioni');
    if (tabName !== 'impostazioni' && settingsView && settingsView.classList.contains('active')) {
      settingsView.querySelectorAll('details.settings-accordion[open]').forEach(function(section) { section.open = false; });
    }
    document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
    document.getElementById('view-' + tabName).classList.add('active');
    document.querySelectorAll('.tab-item[data-tab]').forEach(function(b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === tabName);
    });
    if (tabName === 'dashboard') renderDashboard();
    if (tabName === 'spese') renderSpese();
    if (tabName === 'entrate') renderEntrate();
    if (tabName === 'storico') renderStorico();
  }

  function openModal(mode, preMonth) {
    document.getElementById('addModal').classList.add('open');
    document.getElementById('inpYear').value = currentYear;
    document.getElementById('evYear').value = currentYear;
    document.getElementById('expDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('ocrStatus').style.display = 'none';

    if (typeof preMonth === 'number') {
      document.getElementById('inpMonth').value = String(preMonth);
      var existing = (state.monthly[currentYear] && state.monthly[currentYear][preMonth]) || '';
      document.getElementById('inpAmount').value = existing ? String(toDisplayAmount(existing).toFixed(2)).replace('.', ',') : '';
    } else {
      document.getElementById('inpAmount').value = '';
    }
    document.getElementById('expDesc').value = '';
    document.getElementById('expDesc').dataset.smartManual='0';
    document.getElementById('expAmount').value = '';
    document.getElementById('expRecurring').checked = false;
    document.getElementById('evTitle').value = '';
    document.getElementById('evVal').value = '';
    // La categoria del riepilogo mensile è separata dalle singole entrate bancarie.
    var sel = document.getElementById('monthlyIncomeCategory');
    var selectedMonth = typeof preMonth === 'number' ? preMonth : Number(document.getElementById('inpMonth').value);
    var key = currentYear + '-' + selectedMonth;
    var savedCat = (state.monthlyIncomeCategories || {})[key] || 'Stipendio';
    var cats = incomeCategories();
    if (cats.indexOf(savedCat) < 0) cats.push(savedCat);
    sel.innerHTML = cats.map(function(c){return '<option value="'+escapeHtml(c)+'">'+incomeIcon(c)+' '+escapeHtml(c)+'</option>';}).join('');
    sel.value = savedCat;
    setModalSegment(mode || 'netto');
  }

  function closeModal() { document.getElementById('addModal').classList.remove('open'); }

  function setModalSegment(mode) {
    document.getElementById('segNetto').classList.toggle('active', mode === 'netto');
    document.getElementById('segUscita').classList.toggle('active', mode === 'uscita');
    document.getElementById('segEvento').classList.toggle('active', mode === 'evento');
    document.getElementById('formNetto').style.display = mode === 'netto' ? 'block' : 'none';
    document.getElementById('formUscita').style.display = mode === 'uscita' ? 'block' : 'none';
    document.getElementById('formEvento').style.display = mode === 'evento' ? 'block' : 'none';
  }
  // OCR scontrini: parsing prudente, data, esercente e importo in locale.
  function receiptMoney(token) {
    var t=String(token||'').replace(/[€\s]/g,'').replace(/[Oo]/g,'0').replace(/[Il|]/g,'1');
    if(!/[.,]\d{2}$/.test(t))return null;
    var sep=Math.max(t.lastIndexOf(','),t.lastIndexOf('.'));
    var euros=t.slice(0,sep).replace(/[.,']/g,''), cents=t.slice(sep+1);
    if(!/^\d+$/.test(euros)||!/^\d{2}$/.test(cents))return null;
    var n=Number(euros+'.'+cents);
    return Number.isFinite(n)&&n>0&&n<50000?n:null;
  }
  function receiptDate(lines) {
    var now=new Date(), matches=[];
    lines.forEach(function(line,i){
      var rx=/(?:^|\D)(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})(?=\D|$)/g,m;
      while((m=rx.exec(line))){
        var day=+m[1],mon=+m[2],year=+m[3]; if(year<100)year+=year>=80?1900:2000;
        var dt=new Date(year,mon-1,day);
        if(dt.getFullYear()!==year||dt.getMonth()!==mon-1||dt.getDate()!==day||year<2000||dt.getTime()>now.getTime()+86400000)continue;
        var score=(/DATA|EMISSIONE|DOCUMENTO|ORA|ACQUISTO/i.test(line)?30:0)+(i<12?8:0);
        matches.push({date:String(year)+'-'+String(mon).padStart(2,'0')+'-'+String(day).padStart(2,'0'),score:score,index:i});
      }
    });
    matches.sort(function(a,b){return b.score-a.score||a.index-b.index;});
    return matches.length?matches[0].date:null;
  }
  function receiptMerchant(lines) {
    var bad=/^(?:SCONTRINO|DOCUMENTO|COMMERCIALE|FISCALE|PARTITA\s*IVA|P\.?\s*IVA|CODICE\s*FISCALE|C\.?F\.?|DATA|ORA|TEL\.?|TELEFONO|WWW\.|HTTP|EURO|TOTALE|SUBTOTALE|PAGAMENTO|CASSA|OPERATORE|BANCOMAT|CONTANTI|CARTA|VIA\b|VIALE\b|PIAZZA\b|CORSO\b|GRAZIE|ARRIVEDERCI|COPIA|TRANS\.|AUT\.|POS\b|RT\b|NUMERO|N\.?\s*\d)/i;
    var best='',scoreBest=-1e3;
    lines.slice(0,Math.min(14,lines.length)).forEach(function(raw,i){
      var line=raw.trim().replace(/\s{2,}/g,' ');
      if(line.length<3||line.length>65||bad.test(line)||/\d{2}[\/.-]\d{2}/.test(line))return;
      var letters=(line.match(/[A-Za-zÀ-ÿ]/g)||[]).length;
      if(letters<3||letters/line.length<0.6)return;
      var score=25-i*2+Math.min(letters,30)/5;
      if(/\b(?:S\.?R\.?L\.?|S\.?P\.?A\.?|SNC|SAS|SUPERMERCAT|MARKET|STORE|SHOP|FARMACIA|BAR|RISTORANTE|PIZZERIA|COOP|CONAD|LIDL|EUROSPIN|ESSELUNGA|CARREFOUR|TIGOTÀ|EUROSPIN|MD)\b/i.test(line))score+=18;
      if(/\d{5,}|[@€]|\b(?:PIVA|CF|REPARTO|CODICE|OPERAZIONE)\b/i.test(line))score-=35;
      if(score>scoreBest){scoreBest=score;best=line;}
    });
    return best;
  }
  function extractReceiptData(text, applyFields) {
    var lines=String(text||'').split(/\r?\n/).map(function(x){return x.trim();}).filter(Boolean);
    var candidates=[];
    var totalRx=/\b(?:TOTALE(?:\s+(?:DA\s*PAGARE|PAGATO|DOCUMENTO|COMPLESSIVO|EUR|EURO))?|TOT\.?|IMPORTO\s+(?:PAGATO|DOVUTO|TOTALE)|DA\s*PAGARE|AMOUNT\s*DUE|TOTAL)\b/i;
    var excludeRx=/\b(?:SUB\s*TOTALE|SUBTOTALE|IVA|IMPOSTA|IMPONIBILE|SCONTO|RISPARMIO|RESTO|CAMBIO|ARTICOLI|QUANTIT[AÀ]|Q\.?TA|PREZZO\s*UNITARIO|PUNTI|SALDO\s*PRECEDENTE|TESSERA|CONTANTE\s*RICEVUTO|CONTANTI\s*RICEVUTI|PAGATO\s*CON|TENDERED)\b/i;
    lines.forEach(function(line,i){
      var norm=line.toUpperCase().replace(/T0TALE/g,'TOTALE');
      var matches=norm.match(/(?:\d{1,3}(?:[.,]\d{3})+|\d{1,6})[.,]\s*\d{2}\b/g)||[];
      matches.forEach(function(raw,j){
        var value=receiptMoney(raw.replace(/\s/g,''));if(value===null)return;
        var previous=(lines[i-1]||'').toUpperCase();
        var score=0;
        if(totalRx.test(norm))score+=105;
        if(/DA\s*PAGARE|TOTALE\s*(?:DOCUMENTO|COMPLESSIVO)|IMPORTO\s*(?:PAGATO|DOVUTO)/i.test(norm))score+=55;
        if(!totalRx.test(norm)&&totalRx.test(previous))score+=48;
        if(excludeRx.test(norm))score-=180;
        if(/\b(?:CARTA|BANCOMAT|POS|PAGAMENTO\s+ELETTRONICO)\b/i.test(norm))score+=12;
        if(matches.length>1&&j!==matches.length-1)score-=20;
        score+=i/Math.max(lines.length,1)*12;
        candidates.push({value:value,score:score,line:i});
      });
    });
    candidates.sort(function(a,b){return b.score-a.score||b.line-a.line;});
    var best=candidates[0]||null,runner=candidates[1]||null;
    var ambiguous=!!(best&&runner&&Math.abs(best.score-runner.score)<12&&Math.abs(best.value-runner.value)>0.009);
    var amount=best&&best.score>=65&&!ambiguous?best.value:null;
    var merchant=receiptMerchant(lines),date=receiptDate(lines);
    if(applyFields!==false && amount!==null)document.getElementById('expAmount').value=toDisplayAmount(amount).toFixed(2).replace('.',',');
    if(applyFields!==false && merchant){document.getElementById('expDesc').value=merchant.slice(0,60);smartSuggestExpense(false);}
    if(applyFields!==false && date)document.getElementById('expDate').value=date;
    return {amount:amount,merchant:merchant,date:date,uncertain:amount===null,ambiguous:ambiguous};
  }
  // Aumenta contrasto e risoluzione localmente per migliorare la lettura delle cifre.
  function prepareReceiptImage(file) {
    return new Promise(function(resolve) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function() {
        try {
          var maxEdge = 1700;
          var scale = Math.min(1.6, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
          scale = Math.min(1.6, Math.max(0.2, scale));
          var canvas = document.createElement('canvas');
          canvas.width = Math.round(img.naturalWidth * scale);
          canvas.height = Math.round(img.naturalHeight * scale);
          var ctx = canvas.getContext('2d', {willReadFrequently:true});
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          var pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
          var d = pixels.data;
          for (var i=0; i<d.length; i+=4) {
            var gray = 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2];
            var contrast = Math.max(0, Math.min(255, (gray-128)*1.45+150));
            d[i] = d[i+1] = d[i+2] = contrast;
          }
          ctx.putImageData(pixels, 0, 0);
          URL.revokeObjectURL(url);
          resolve(canvas);
        } catch(err) { URL.revokeObjectURL(url); resolve(file); }
      };
      img.onerror = function() { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }
  // Compatibilita con versioni precedenti dell'OCR.
  function parseReceiptOcrText(text) { return extractReceiptData(text); }

  function loadOcrLibrary(callback) {
    if (typeof Tesseract !== 'undefined') { callback(); return; }
    var s = document.createElement('script');
    s.src = './vendor/tesseract.min.js';
    s.onload = callback;
    s.onerror = function() {
      document.getElementById('ocrStatus').textContent = 'Libreria OCR locale mancante: vendor/tesseract.min.js';
    };
    document.head.appendChild(s);
  }

  // Data e ora locali nel nome: evita sovrascritture anche con più esportazioni nello stesso giorno.
  function walletProExportFilename(filename) {
    var d = new Date();
    var pad = function(n, len) { return String(n).padStart(len || 2, '0'); };
    var stamp = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '_' + pad(d.getHours()) + '-' + pad(d.getMinutes()) + '-' + pad(d.getSeconds()) + '-' + pad(d.getMilliseconds(), 3);
    var pos = filename.lastIndexOf('.');
    return (pos > 0 ? filename.slice(0, pos) : filename) + '_' + stamp + (pos > 0 ? filename.slice(pos) : '');
  }
  window.walletProExportFilename = walletProExportFilename;
  function downloadFile(filename, content, mime) {
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = walletProExportFilename(filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
  }
  // Importazione CSV locale: un movimento = una voce dettagliata.
  // La chiave anti-duplicato è tipo + data completa + importo in centesimi.
  function csvRows(text) {
    var raw=String(text||'').replace(/^\uFEFF/,'');
    var first=raw.split(/\r?\n/).find(function(x){return x.trim();})||'';
    var sep=(first.match(/;/g)||[]).length >= (first.match(/,/g)||[]).length?';':',';
    var rows=[], row=[], field='', quoted=false;
    for(var i=0;i<raw.length;i++){
      var ch=raw[i];
      if(ch==='"'){if(quoted&&raw[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
      else if(ch===sep&&!quoted){row.push(field.trim());field='';}
      else if((ch==='\n'||ch==='\r')&&!quoted){
        if(ch==='\r'&&raw[i+1]==='\n')i++;
        row.push(field.trim());field='';if(row.some(function(v){return v!=='';}))rows.push(row);row=[];
      }else field+=ch;
    }
    row.push(field.trim());if(row.some(function(v){return v!=='';}))rows.push(row);
    return rows;
  }
  function csvDate(value) {
    var v=String(value||'').trim(),m;
    if((m=v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)))return m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0');
    if((m=v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)))return m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');
    return null;
  }
  function importCsvMovements(text, defaultType) {
    var rows=csvRows(text), added=0, skipped=0, invalid=0, pending=[];
    if(!rows.length){showToast('CSV vuoto');return;}
    if(!Array.isArray(state.bankIncomeEntries))state.bankIncomeEntries=[];
    var seen=registeredMovementKeys();
    var csvLocale=window.walletProAmountLocale(rows.slice(1).map(function(r){return r.length>=5&&/^(entrata|uscita|income|expense)$/i.test(r[0])?r[4]:r.length>=4&&csvDate(r[0])?r[3]:r.length>=3?r[2]:null;}));
    // Colonne supportate: Tipo;Data;Categoria;Descrizione;Importo oppure
    // Data;Categoria;Descrizione;Importo. Per il CSV mensile legacy:
    // Anno;Mese;Netto, data convenzionale al giorno 1.
    rows.forEach(function(r,index){
      var h=r.map(function(v){return String(v).toLowerCase().trim();});
      if(index===0&&h.some(function(v){return /^(tipo|data|anno|mese|categoria|descrizione|importo|netto)$/.test(v);}))return;
      var type=defaultType,dt,cat,desc,amount;
      if(r.length>=5&&/^(entrata|uscita|income|expense)$/i.test(r[0])){
        type=/^(entrata|income)$/i.test(r[0])?'income':'expense';
        dt=csvDate(r[1]);cat=r[2];desc=r[3];amount=parseNumberInput(r[4],csvLocale);
      }else if(r.length>=4&&csvDate(r[0])){
        dt=csvDate(r[0]);cat=r[1];desc=r[2];amount=parseNumberInput(r[3],csvLocale);
      }else if(defaultType==='income'&&r.length>=3&&/^\d{4}$/.test(r[0])){
        var monthRaw=String(r[1]).toLowerCase().trim(),mo=Number(monthRaw);
        if(!mo||mo<1||mo>12)mo=MONTHS.findIndex(function(x){return x.toLowerCase().startsWith(monthRaw);})+1;
        if(mo>0&&mo<=12)dt=r[0]+'-'+String(mo).padStart(2,'0')+'-01';
        cat='Stipendio';desc='Entrata CSV mensile';amount=parseNumberInput(r[2],csvLocale);
      }else{invalid++;return;}
      if(!dt||!Number.isFinite(amount)||amount<=0){invalid++;return;}
      amount=Math.round(amount*100)/100;
      var guessedCategory=(type==='expense'&&(!cat||/^(altro|other|varie)$/i.test(String(cat).trim())))?bankCategory(desc||''):cat;
      var candidate={date:dt,amount:amount,category:guessedCategory||'',desc:desc||''};
      var candidateKeys=movementKeys(candidate,type);
      if(!candidateKeys.length){invalid++;return;}
      if(isRegisteredMovement(candidate,type,seen)){skipped++;return;}
      candidateKeys.forEach(function(k){seen.add(k);});
      pending.push({type:type,date:dt,amount:amount,category:guessedCategory||'Altro',desc:desc||''});
      added++;
    });
    if(invalid>0){showToast('CSV bloccato: '+invalid+' righe non valide o con importi ambigui. Nessun dato modificato.');return;}
    var totals=pending.reduce(function(acc,x){acc[x.type]=(acc[x.type]||0)+x.amount;return acc;},{income:0,expense:0});
    var sample=pending.slice(0,12).map(function(x){return x.date+' · '+(x.type==='income'?'+':'-')+fmtEur(x.amount)+' · '+x.category+' · '+x.desc;}).join('\n');
    var msg='Anteprima CSV (nessun dato ancora salvato)\nNuovi: '+pending.length+' · Duplicati: '+skipped+' · Non validi: '+invalid+'\nEntrate: '+fmtEur(totals.income)+' · Uscite: '+fmtEur(totals.expense)+'\n\n'+sample+(pending.length>12?'\n… e altri '+(pending.length-12)+' movimenti':'')+'\n\nConfermi l’importazione?';
    if(!pending.length){showToast('CSV: nessun nuovo movimento; '+skipped+' duplicati, '+invalid+' non validi');return;}
    bankShowImportConfirm(msg,function(accepted){
      if(!accepted){showToast('Importazione CSV annullata: nessun dato modificato');return;}
      pending.forEach(function(x){
        if(x.type==='income'){
          state.bankIncomeEntries.push({date:x.date,amount:x.amount,category:x.category,desc:x.desc||'Entrata CSV',source:'csv'});
          var y=Number(x.date.slice(0,4)),m=Number(x.date.slice(5,7))-1;
          if(!state.monthly[y])state.monthly[y]=makeZeroYear();
          state.monthly[y][m]=Math.round(((Number(state.monthly[y][m])||0)+x.amount)*100)/100;
        }else state.expenses.push({date:x.date,amount:x.amount,category:x.category,desc:x.desc||'Uscita CSV',source:'csv'});
      });
      currentYear=Number(pending[pending.length-1].date.slice(0,4));
      saveState();syncYearDropdown();renderDashboard();renderEntrate();renderSpese();renderStorico();
      showToast('CSV: '+pending.length+' importati, '+skipped+' duplicati ignorati'+(invalid?', '+invalid+' righe non valide':''));
    });
  }
  function importIncomeCsvText(text){importCsvMovements(text,'income');}
  function importExpenseCsvText(text){importCsvMovements(text,'expense');}
  document.getElementById('languageSelect').addEventListener('change', function() {
    prefs.language = this.value; savePrefs();
    applyPrefsUI(); renderDashboard(); renderSpese(); renderEntrate(); renderStorico(); translatePage();
  });
  document.getElementById('currencySelect').addEventListener('change', function() {
    prefs.currency = this.value; savePrefs();
    refreshExchangeRates(); applyPrefsUI(); renderDashboard(); renderSpese(); renderEntrate(); renderStorico(); translatePage();
  });
  (function(){var sel=document.getElementById('dashboardMonth');MONTHS.forEach(function(m,i){var op=document.createElement('option');op.value=String(i);op.textContent=m;sel.appendChild(op);});sel.value=String(new Date().getMonth());sel.addEventListener('change',renderDashboard);var cycle=document.getElementById('budgetCycle');function nextBudget(){var cfg={};try{cfg=JSON.parse(localStorage.getItem('walletpro_simple_v2')||'{}').budgets||{}}catch(e){}var options=['monthly'].concat(Object.keys(cfg||{}).sort(function(a,b){return a.localeCompare(b,'it')}).map(function(cat){return 'category:'+cat}));var idx=options.indexOf(window.walletproBudgetView||'monthly');window.walletproBudgetView=options[(idx+1)%options.length];renderDashboard()}cycle.addEventListener('click',nextBudget);cycle.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();nextBudget()}});window.addEventListener('walletpro:budget-changed',renderDashboard);})();
  document.querySelectorAll('#pills-salary .chart-pill').forEach(function(btn){btn.addEventListener('click',function(){prefs.salaryChartType=this.getAttribute('data-type');savePrefs();renderDashboard();});});
  document.getElementById('yearSelect').addEventListener('change', function(e) { currentYear = Number(e.target.value); renderDashboard(); renderSpese(); renderEntrate(); renderStorico(); });

  document.getElementById('tabAddBtn').addEventListener('click', function() { openModal('uscita'); });
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('addModal').addEventListener('click', function(e) { if (e.target === this) closeModal(); });
  document.getElementById('segNetto').addEventListener('click', function() { setModalSegment('netto'); });
  document.getElementById('segUscita').addEventListener('click', function() { setModalSegment('uscita'); });
  document.getElementById('segEvento').addEventListener('click', function() { setModalSegment('evento'); });

  document.querySelectorAll('.tab-item[data-tab]').forEach(function(btn) {
    btn.addEventListener('click', function() { switchTab(this.getAttribute('data-tab')); });
  });

  function refreshMonthlyIncomeCategory() {
    var yr = Number(document.getElementById('inpYear').value), mo = Number(document.getElementById('inpMonth').value);
    var sel = document.getElementById('monthlyIncomeCategory');
    var cat = (state.monthlyIncomeCategories || {})[yr + '-' + mo] || 'Stipendio';
    if (!Array.from(sel.options).some(function(o){return o.value===cat;})) sel.add(new Option(incomeIcon(cat)+' '+cat,cat));
    sel.value=cat;
    updateIncomeDayVisibility();
  }
  function updateIncomeDayVisibility() {
    var cat=(document.getElementById('monthlyIncomeCategory').value||'').trim().toLowerCase();
    document.getElementById('incomeDayGroup').style.display=cat==='stipendio'?'none':'block';
  }
  document.getElementById('monthlyIncomeCategory').addEventListener('change',updateIncomeDayVisibility);
  document.getElementById('inpMonth').addEventListener('change',updateIncomeDayVisibility);
  document.getElementById('inpYear').addEventListener('change',refreshMonthlyIncomeCategory);
  document.getElementById('inpMonth').addEventListener('change',updateIncomeDayVisibility);
  var manualIncomeDuplicateApproval = null;
  var pendingManualIncomeSignature = null;
  document.getElementById('incomeDuplicateCancel').addEventListener('click',function(){
    pendingManualIncomeSignature=null;
    document.getElementById('incomeDuplicateModal').classList.remove('open');
  });
  document.getElementById('incomeDuplicateContinue').addEventListener('click',function(){
    manualIncomeDuplicateApproval=pendingManualIncomeSignature;
    pendingManualIncomeSignature=null;
    document.getElementById('incomeDuplicateModal').classList.remove('open');
    document.getElementById('btnSaveNetto').click();
  });
  document.getElementById('btnSaveNetto').addEventListener('click', function() {
    var yr = parseInt(document.getElementById('inpYear').value, 10);
    var mo = parseInt(document.getElementById('inpMonth').value, 10);
    var val = toEuroAmount(parseNumberInput(document.getElementById('inpAmount').value, 'it'));
    if (isNaN(yr) || yr < 1900 || yr > 2100) { showToast('Anno non valido'); return; }
    if (isNaN(val) || val < 0) { showToast('Importo non valido'); return; }
    if (isNaN(mo) || mo < 0 || mo > 11) { showToast('Mese non valido'); return; }
    if (!Number.isFinite(val) || val <= 0) { showToast('Inserisci un importo entrata valido'); return; }
    // Duplicati manuali: Stipendio = mese/anno/importo;
    // altre entrate = giorno/mese/anno/importo, indipendentemente dalla categoria.
    var selectedCategory = document.getElementById('monthlyIncomeCategory').value || 'Stipendio';
    var isSalary = selectedCategory.trim().toLowerCase() === 'stipendio';
    var day = isSalary ? 1 : parseInt(document.getElementById('inpDay').value, 10);
    var maxDay = new Date(yr,mo+1,0).getDate();
    if (!isSalary && (!Number.isInteger(day) || day < 1 || day > maxDay)) { showToast('Giorno non valido per il mese selezionato'); return; }
    var monthPrefix = yr + '-' + String(mo + 1).padStart(2, '0');
    var entryDate = monthPrefix + '-' + String(day).padStart(2,'0');
    var amountCents = Math.round(val * 100);
    var sameIncome = (state.bankIncomeEntries || []).some(function(e) {
      return (isSalary ? String(e.date || '').slice(0,7) === monthPrefix : String(e.date || '') === entryDate) &&
        Math.round(Number(e.amount) * 100) === amountCents;
    });
    if (!sameIncome && isSalary) sameIncome = (state.paySalaryKeys || []).indexOf(paySalaryKey(yr,mo,val)) !== -1;
    // Conferma interna all'app: non dipende dai popup confirm di Safari.
    // Il permesso vale per un solo salvataggio e per la stessa combinazione di dati.
    var signature = [yr,mo,day,isSalary?'stipendio':'entrata',amountCents].join('|');
    if (sameIncome && manualIncomeDuplicateApproval !== signature) {
      document.getElementById('incomeDuplicateMessage').textContent =
        'Esiste già un’entrata uguale: ' + selectedCategory + ', ' +
        (isSalary ? MONTHS[mo] + ' ' + yr : entryDate) + ', ' + val.toFixed(2) +
        '. Vuoi aggiungerla comunque?';
      pendingManualIncomeSignature = signature;
      document.getElementById('incomeDuplicateModal').classList.add('open');
      return;
    }
    manualIncomeDuplicateApproval = null;
    if (!state.monthly[yr]) state.monthly[yr] = makeZeroYear();
    // Ogni nuova entrata è un accredito autonomo: non sottrarre bonifici o altre causali.
    // Il riepilogo mensile contiene la somma di tutte le entrate del mese.
    if (!Array.isArray(state.bankIncomeEntries)) state.bankIncomeEntries = [];
    var monthKey = yr + '-' + String(mo + 1).padStart(2, '0');
    if (val <= 0) { showToast('Inserisci un importo entrata valido'); return; }
    state.bankIncomeEntries.push({
      date: entryDate, amount: val,
      desc: document.getElementById('monthlyIncomeCategory').value || 'Stipendio',
      category: document.getElementById('monthlyIncomeCategory').value || 'Stipendio',
      source: 'manual-monthly', duplicateConfirmed: sameIncome
    });
    if(document.getElementById('incomeRecurring').checked){
      if(!Array.isArray(state.incomeRecurring))state.incomeRecurring=[];
      // Due entrate ricorrenti distinte possono avere categoria e importo uguali.
      // Ogni voce ha un ID proprio e puo' essere rimossa separatamente.
      state.incomeRecurring.push({id:'income-rec-'+Date.now()+'-'+Math.random().toString(36).slice(2,9),category:selectedCategory,amount:val});
    }
    state.monthly[yr][mo] = Math.round(((Number(state.monthly[yr][mo]) || 0) + val) * 100) / 100;
    // Le categorie delle singole entrate restano in bankIncomeEntries.
    // NON sovrascrivere la categoria del residuo mensile storico: in un mese
    // possono coesistere stipendio, bonifici e altre entrate.
    if (!state.monthlyIncomeCategories) state.monthlyIncomeCategories = {};
    currentYear = yr;
    if (!saveState()) return;
    syncYearDropdown(); renderDashboard(); renderEntrate(); renderStorico(); closeModal();
    showToast('Entrata salvata: ' + MONTHS[mo] + ' ' + yr);
  });

  document.getElementById('btnSaveUscita').addEventListener('click', function() {
    var dt = document.getElementById('expDate').value;
    var cat = document.getElementById('expCategory').value;
    var desc = document.getElementById('expDesc').value.trim() || cat;
    var val = toEuroAmount(parseNumberInput(document.getElementById('expAmount').value, 'it'));
    var isRec = document.getElementById('expRecurring').checked;
    if (!dt) { showToast('Seleziona una data'); return; }
    if (isNaN(val) || val <= 0) { showToast('Inserisci un importo uscita valido'); return; }
    var existingSameExpense = state.expenses.some(function(ex) {
      return duplicateKey(ex.date, ex.amount, 'expense') === duplicateKey(dt, val, 'expense');
    });
    if (existingSameExpense && !window.confirm('Esiste già una spesa uguale (stessa data e stesso importo). Vuoi continuare?')) return;
    state.expenses.push({ date: dt, category: cat, desc: desc, amount: val, duplicateConfirmed: existingSameExpense });
    if (isRec) state.recurring.push({ category: cat, desc: desc, amount: val });
    currentYear = Number(dt.slice(0, 4));
    if(!saveState())return;
    smartRemember(desc,cat);
    syncYearDropdown(); renderDashboard(); renderSpese(); closeModal();
    showToast('Uscita salvata: -' + fmtEur(val));
  });

  document.getElementById('btnSaveEvento').addEventListener('click', function() {
    var yr = parseInt(document.getElementById('evYear').value, 10);
    var title = document.getElementById('evTitle').value.trim();
    var valRaw = document.getElementById('evVal').value.trim();
    var val = valRaw ? toEuroAmount(parseNumberInput(valRaw, 'it')) : null;
    if (isNaN(yr) || !title) { showToast('Compila anno e descrizione'); return; }
    state.events.push({ year: yr, title: title, value: val });
    currentYear = yr;
    saveState(); syncYearDropdown(); renderDashboard(); renderEntrate(); renderStorico(); closeModal();
    showToast('Evento salvato');
  });
    document.getElementById('btnScanReceipt').addEventListener('click', function() { document.getElementById('receiptFileInput').click(); });
    document.getElementById('receiptFileInput').addEventListener('change', function(e) {
    var file = e.target.files && e.target.files.item(0);
    if (!file) return;
    var status = document.getElementById('ocrStatus');
    status.style.display = 'block';
    status.textContent = 'Riconoscimento locale in corso…';
    var input = this;
    loadOcrLibrary(function() {
      if (typeof Tesseract === 'undefined') { status.textContent = 'Motore OCR non disponibile'; input.value = ''; return; }
      var opts = {workerPath:new URL('vendor/worker.min.js', document.baseURI).href,
        corePath:new URL('vendor/tesseract-core.wasm.js', document.baseURI).href,
        langPath:new URL('vendor/lang', document.baseURI).href, workerBlobURL:false, gzip:true,
        logger:function(m){if(m&&m.status)status.textContent='OCR locale: '+m.status+(m.progress?' '+Math.round(m.progress*100)+'%':'');}};
      var first=null, second=null, firstImage=null;
      prepareReceiptImage(file).then(function(image){
        firstImage=image;
        return Tesseract.recognize(image,'ita+eng',opts);
      }).then(function(result){
        first=extractReceiptData(result&&result.data?result.data.text:'',false);
        // La seconda lettura usa il file originale solo se il totale non è attendibile.
        if(first.amount!==null&&!first.ambiguous)return null;
        status.textContent='Seconda lettura OCR sullo scontrino originale…';
        return Tesseract.recognize(file,'ita+eng',opts);
      }).then(function(result){
        if(result)second=extractReceiptData(result&&result.data?result.data.text:'',false);
        var chosen=first;
        if(second&&second.amount!==null&&(first.amount===null||first.ambiguous))chosen=second;
        if(first&&second&&first.amount!==null&&second.amount!==null&&Math.abs(first.amount-second.amount)>0.009){
          chosen={amount:null,merchant:first.merchant||second.merchant,date:first.date||second.date,uncertain:true,ambiguous:true};
        }
        if(chosen.amount!==null)document.getElementById('expAmount').value=toDisplayAmount(chosen.amount).toFixed(2).replace('.',',');
        if(chosen.merchant){document.getElementById('expDesc').value=chosen.merchant.slice(0,60);smartSuggestExpense(false);}
        if(chosen.date)document.getElementById('expDate').value=chosen.date;
        status.textContent=(chosen.ambiguous?'Letture discordanti: controlla manualmente il totale. ':
          chosen.uncertain?'Totale non riconosciuto: inseriscilo manualmente. ':'Importo individuato: controllalo prima di salvare. ')+
          (chosen.merchant?'Negozio: '+chosen.merchant+'. ':'Negozio non identificato. ')+
          (chosen.date?'Data: '+chosen.date+'.':'Data non identificata: verifica la data.');
      }).catch(function(err){status.textContent='OCR non riuscito: '+(err&&err.message?err.message:'verifica i file OCR locali');})
      .then(function(){if(firstImage&&firstImage.width){firstImage.width=0;firstImage.height=0;}input.value='';});
    });
  });

  document.querySelectorAll('#pills-monthly .chart-pill').forEach(function(btn) {
    btn.addEventListener('click', function(e) { e.stopPropagation(); prefs.monthlyChartType = this.getAttribute('data-type'); savePrefs(); renderDashboard(); });
  });
  document.querySelectorAll('#pills-expense .chart-pill').forEach(function(btn) {
    btn.addEventListener('click', function(e) { e.stopPropagation(); prefs.expenseChartType = this.getAttribute('data-type'); savePrefs(); renderDashboard(); });
  });
  document.querySelectorAll('#pills-annual .chart-pill').forEach(function(btn) {
    btn.addEventListener('click', function(e) { e.stopPropagation(); prefs.annualChartType = this.getAttribute('data-type'); savePrefs(); renderDashboard(); });
  });

  document.getElementById('monthlyChartTouch').addEventListener('click', function() { prefs.monthlyChartType = CHART_TYPES[(CHART_TYPES.indexOf(prefs.monthlyChartType) + 1) % CHART_TYPES.length]; savePrefs(); renderDashboard(); });
  document.getElementById('expenseChartTouch').addEventListener('click', function() { prefs.expenseChartType = prefs.expenseChartType === 'pie' ? 'bar' : 'pie'; savePrefs(); renderDashboard(); });
  document.getElementById('salaryChartTouch').addEventListener('click', function() { var types=['bar','line','pie']; var current=prefs.salaryChartType||'bar'; prefs.salaryChartType=types[(types.indexOf(current)+1)%types.length]; savePrefs(); renderDashboard(); });
  document.getElementById('annualChartTouch').addEventListener('click', function() { prefs.annualChartType = CHART_TYPES[(CHART_TYPES.indexOf(prefs.annualChartType) + 1) % CHART_TYPES.length]; savePrefs(); renderDashboard(); });
  // Dialog compatto, nello stile iOS di Wallet-PRO, senza alert/prompt del browser.
  function askFilteredCategoryChange(count, keyword, callback) {
    var overlay = document.createElement('div');
    overlay.className = 'modal-backdrop open';
    overlay.style.cssText = 'z-index:900;align-items:center;padding:18px;';
    var panel = document.createElement('div');
    panel.style.cssText = 'background:var(--card);color:var(--text);border:1px solid var(--border);border-radius:18px;width:100%;max-width:340px;padding:18px;box-shadow:0 12px 36px rgba(0,0,0,.2);';
    var heading = document.createElement('div');
    heading.style.cssText = 'font-size:16px;font-weight:700;text-align:center;margin-bottom:8px;';
    heading.textContent = 'Cambiare categoria?';
    var msg = document.createElement('div');
    msg.style.cssText = 'font-size:13px;color:var(--subtext);line-height:1.45;text-align:center;margin-bottom:16px;';
    msg.textContent = 'La ricerca "' + keyword + '" corrisponde a ' + count + ' uscite in tutti gli anni. Vuoi aggiornarle tutte?';
    var all = document.createElement('button');
    all.type='button'; all.className='save-btn';
    all.style.cssText='font-size:14px;padding:11px;margin:0 0 8px;';
    all.textContent='Tutte le ' + count + ' uscite';
    var one = document.createElement('button');
    one.type='button'; one.className='save-btn';
    one.style.cssText='font-size:14px;padding:11px;margin:0 0 8px;background:var(--input-bg);color:var(--blue);';
    one.textContent='Solo questa uscita';
    var cancel = document.createElement('button');
    cancel.type='button'; cancel.className='close-btn';
    cancel.style.cssText='display:block;width:100%;padding:9px;font-size:13px;';
    cancel.textContent='Annulla';
    var resolved=false;
    function done(choice) { if(resolved)return;resolved=true;document.removeEventListener('keydown',onKey);overlay.remove();callback(choice); }
    function onKey(e) { if(e.key==='Escape')done('cancel'); }
    all.addEventListener('click',function(){done('all');});
    one.addEventListener('click',function(){done('one');});
    cancel.addEventListener('click',function(){done('cancel');});
    overlay.addEventListener('click',function(e){if(e.target===overlay)done('cancel');});
    document.addEventListener('keydown',onKey);
    panel.appendChild(heading);panel.appendChild(msg);panel.appendChild(all);panel.appendChild(one);panel.appendChild(cancel);
    overlay.appendChild(panel);document.body.appendChild(overlay);
    cancel.focus();
  }
  // La modifica collettiva cerca in TUTTI gli anni, a prescindere dall'anno e dal mese visualizzati.
  // Si basa sul testo della causale/descrizione, per evitare corrispondenze casuali su date o importi.
  function filteredExpenseIndices() {
    var term=(document.getElementById('expenseSearch').value||'').trim().toLocaleLowerCase();
    if(!term)return [];
    return state.expenses.map(function(ex,i){return {ex:ex,i:i};}).filter(function(o){
      return String(o.ex.desc||'').toLocaleLowerCase().includes(term);
    }).map(function(o){return o.i;});
  }
  document.getElementById('expenseSearch').addEventListener('input', renderSpese);
  document.getElementById('speseList').addEventListener('change', function(e) {
    var sel = e.target.closest('[data-change-exp-category]'); if (!sel) return;
    var idx = Number(sel.getAttribute('data-change-exp-category'));
    if (!state.expenses[idx]) return;
    var newCategory=sel.value;
    var keyword=(document.getElementById('expenseSearch').value||'').trim();
    var matches=keyword ? filteredExpenseIndices() : [];
    function applyCategory(choice) {
      if(choice==='cancel') { renderSpese(); return; }
      var indices=choice==='all' ? matches : [idx];
      indices.forEach(function(i){ if(state.expenses[i]) state.expenses[i].category=newCategory; });
      saveState(); renderDashboard(); renderSpese(); showToast('Categoria aggiornata per '+indices.length+' uscita/e');
    }
    if(keyword && matches.length>1 && matches.indexOf(idx)>=0) askFilteredCategoryChange(matches.length,keyword,applyCategory);
    else applyCategory('one');
  });
  function renderCategoryManager() {
    var panel = document.getElementById('categoryManager');
    panel.innerHTML = customCategories.length ? customCategories.map(function(c,i) {
      return '<div class="list-row"><span>'+categoryIcon(c)+' '+escapeHtml(c)+'</span><div style="display:flex;gap:6px;"><button type="button" class="mini-btn" data-rename-category="'+i+'">Rinomina</button><button type="button" class="del-btn" data-remove-category="'+i+'">Elimina</button></div></div>';
    }).join('') : '<div class="list-row row-sub">Le categorie predefinite rimangono disponibili. Qui puoi aggiungere e gestire categorie personalizzate.</div>';
  }
  // Modulo integrato: evita window.prompt, che può essere bloccato in Safari/PWA.
  function openCategoryEditor(index) {
    var panel = document.getElementById('categoryManager');
    panel.style.display = 'block';
    renderCategoryManager();
    var old = index === null ? '' : customCategories[index];
    if (index !== null && typeof old !== 'string') return;
    var form = document.createElement('form');
    form.id = 'categoryEditForm';
    form.style.cssText = 'padding:12px 15px;border-bottom:1px solid var(--border)';
    var label = document.createElement('label');
    label.className = 'form-label'; label.textContent = index === null ? 'Nome nuova categoria' : 'Rinomina categoria';
    var input = document.createElement('input');
    input.className = 'form-input'; input.type = 'text'; input.maxLength = 60;
    input.required = true; input.placeholder = 'Es. Abbonamenti'; input.value = old;
    input.setAttribute('aria-label', label.textContent);
    var iconLabel = document.createElement('label'); iconLabel.className = 'form-label'; iconLabel.textContent = 'Icona della categoria'; iconLabel.style.marginTop='10px';
    var iconSelect = document.createElement('select'); iconSelect.className='form-input';
    ['🏷️','📺','📱','💻','🛍️','🛒','🏠','🚗','⛽','💊','🍽️','🎬','🎮','🎓','✈️','🐾','💡','💳','🏦','🎁','📦','🔧','💰','📚','🎵','🏋️','👕','☕'].forEach(function(emoji){
      var option=document.createElement('option'); option.value=emoji; option.textContent=emoji; iconSelect.appendChild(option);
    });
    fillCategoryEmojiSelect(iconSelect, index === null ? '🏷️' : categoryIcon(old));
    var actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:8px;margin-top:10px';
    var save = document.createElement('button'); save.type = 'submit'; save.className = 'mini-btn'; save.textContent = 'Salva categoria';
    var cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'mini-btn'; cancel.textContent = 'Annulla';
    cancel.addEventListener('click', function(){ renderCategoryManager(); });
    actions.appendChild(save); actions.appendChild(cancel);
    form.appendChild(label); form.appendChild(input); form.appendChild(iconLabel); form.appendChild(iconSelect); form.appendChild(actions);
    panel.insertBefore(form, panel.firstChild);
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var name = input.value.trim();
      if (!name || name.length > 60 || allCategories().some(function(c) {
        return c !== old && c.toLocaleLowerCase() === name.toLocaleLowerCase();
      })) { showToast('Nome non valido o già presente'); input.focus(); return; }
      try {
        if (index === null) customCategories.push(name);
        else {
          customCategories[index] = name;
          delete customCategoryIcons[old];
          state.expenses.forEach(function(ex){ if(ex.category === old) ex.category = name; });
          state.recurring.forEach(function(ex){ if(ex.category === old) ex.category = name; });
          state.bankIncomeEntries.forEach(function(ex){ if(ex.category === old) ex.category = name; });
          state.incomeRecurring.forEach(function(ex){ if(ex.category === old) ex.category = name; });
          state.incomeCategories=state.incomeCategories.map(function(c){return c===old?name:c;});
        }
        customCategoryIcons[name] = iconSelect.value;
        saveCustomCategories(); saveState(); renderCategoryManager(); renderDashboard(); renderSpese();
        showToast(index === null ? 'Categoria aggiunta' : 'Categoria rinominata');
      } catch(err) { /* Errore gestito senza dettagli in console. */ showToast('Errore nel salvataggio della categoria'); }
    });
    input.focus();
  }
  // Entrate e Uscite usano lo stesso archivio di categorie personalizzate.
  (function setupInlineIncomeCategoryCreation(){
    var btn=document.getElementById('btnAddCategoryInIncome');
    var form=document.getElementById('newCategoryInIncomeForm');
    var nameInput=document.getElementById('newIncomeCategoryName');
    var iconSelect=document.getElementById('newIncomeCategoryIcon');
    ['🏷️','💼','💰','🏦','💸','📈','🛍️','🏠','🚗','🎁','📦','📚','🎓','💳','🔧','☕','✈️','📱','💻','🎵','🐾'].forEach(function(emoji){var opt=document.createElement('option');opt.value=emoji;opt.textContent=emoji;iconSelect.appendChild(opt);});
    fillCategoryEmojiSelect(iconSelect, '🏷️');
    function hide(){form.style.display='none';btn.style.display='inline-block';form.reset();}
    btn.addEventListener('click',function(){btn.style.display='none';form.style.display='block';iconSelect.value='🏷️';nameInput.focus();});
    document.getElementById('cancelNewIncomeCategory').addEventListener('click',hide);
    form.addEventListener('submit',function(ev){
      ev.preventDefault();var name=nameInput.value.trim();
      if(!name||name.length>60||incomeCategories().some(function(c){return c.toLocaleLowerCase()===name.toLocaleLowerCase();})){
        showToast('Nome non valido o già presente');nameInput.focus();return;
      }
      try{
        customCategories.push(name);customCategoryIcons[name]=iconSelect.value;
        saveCustomCategories();
        document.getElementById('monthlyIncomeCategory').value=name;
        renderCategoryManager();hide();showToast('Categoria aggiunta e disponibile in tutti i menu');
      }catch(err){/* Errore gestito senza dettagli in console. */showToast('Errore nel salvataggio della categoria');}
    });
  })();
  // Creazione categoria direttamente nel modulo Aggiungi > Uscita.
  (function setupInlineExpenseCategoryCreation() {
    var btn=document.getElementById('btnAddCategoryInExpense');
    var form=document.getElementById('newCategoryInExpenseForm');
    var nameInput=document.getElementById('newExpenseCategoryName');
    var iconSelect=document.getElementById('newExpenseCategoryIcon');
    var icons=['🏷️','📺','📱','💻','🛍️','🛒','🏠','🚗','⛽','💊','🍽️','🎬','🎮','🎓','✈️','🐾','💡','💳','🏦','🎁','📦','🔧','💰','📚','🎵','🏋️','👕','☕'];
    icons.forEach(function(emoji){var option=document.createElement('option');option.value=emoji;option.textContent=emoji;iconSelect.appendChild(option);});
    fillCategoryEmojiSelect(iconSelect, '🏷️');
    function hide(){form.style.display='none';btn.style.display='inline-block';form.reset();}
    btn.addEventListener('click',function(){btn.style.display='none';form.style.display='block';iconSelect.value='🏷️';nameInput.focus();});
    document.getElementById('cancelNewExpenseCategory').addEventListener('click',hide);
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var name=nameInput.value.trim();
      if(!name || name.length>60 || allCategories().some(function(c){return c.toLocaleLowerCase()===name.toLocaleLowerCase();})){
        showToast('Nome non valido o già presente');nameInput.focus();return;
      }
      try{
        customCategories.push(name);
        customCategoryIcons[name]=iconSelect.value;
        saveCustomCategories();
        document.getElementById('expCategory').value=name;
        renderCategoryManager();
        hide();
        showToast('Categoria aggiunta e selezionata');
      }catch(err){/* Errore gestito senza dettagli in console. */showToast('Errore nel salvataggio della categoria');}
    });
  })();
  document.getElementById('btnManageCategories').addEventListener('click',function(){ openCategoryEditor(null); });
  document.getElementById('categoryManager').addEventListener('click',function(e){
    var rename=e.target.closest('[data-rename-category]'), remove=e.target.closest('[data-remove-category]');
    if(rename){
      openCategoryEditor(Number(rename.getAttribute('data-rename-category')));
    }
    if(remove){
      var i=Number(remove.getAttribute('data-remove-category')), old=customCategories[i];
      if (!old) return;
      var panel=document.getElementById('categoryManager');
      var previous=panel.querySelector('#categoryDeleteConfirm');
      if(previous) previous.remove();
      var warning=document.createElement('div'); warning.id='categoryDeleteConfirm';
      warning.style.cssText='padding:12px 15px;border-bottom:1px solid var(--border)';
      var message=document.createElement('div');
      message.textContent='Eliminare "'+old+'"? Le uscite e le spese ricorrenti associate passeranno alla categoria Altro.';
      warning.appendChild(message);
      var actions=document.createElement('div'); actions.style.cssText='display:flex;gap:8px;margin-top:10px';
      var yes=document.createElement('button'); yes.type='button'; yes.className='del-btn'; yes.textContent='Conferma eliminazione';
      var no=document.createElement('button'); no.type='button'; no.className='mini-btn'; no.textContent='Annulla';
      no.addEventListener('click',function(){warning.remove();});
      yes.addEventListener('click',function(){
        state.expenses.forEach(function(ex){if(ex.category===old)ex.category='Altro';});
        state.recurring.forEach(function(ex){if(ex.category===old)ex.category='Altro';});
        customCategories.splice(customCategories.indexOf(old),1);
        delete customCategoryIcons[old];
        saveCustomCategories();saveState();renderCategoryManager();renderDashboard();renderSpese();
        showToast('Categoria eliminata');
      });
      actions.appendChild(yes); actions.appendChild(no); warning.appendChild(actions);
      panel.insertBefore(warning,panel.firstChild);
    }
  });
  document.getElementById('expenseMonthFilter').addEventListener('change', renderSpese);
  document.getElementById('speseList').addEventListener('click', function(e) {
    var btn = e.target.closest('[data-del-exp]');
    if (btn) { state.expenses.splice(parseInt(btn.getAttribute('data-del-exp'), 10), 1); saveState(); renderDashboard(); renderSpese(); showToast('Uscita eliminata'); }
  });
  document.getElementById('recurringList').addEventListener('click', function(e) {
    var btn = e.target.closest('[data-del-rec]');
    if (btn) { state.recurring.splice(parseInt(btn.getAttribute('data-del-rec'), 10), 1); saveState(); renderSpese(); showToast('Spesa ricorrente rimossa'); }
  });
  document.getElementById('btnApplyRecurring').addEventListener('click', function() {
    if (state.recurring.length === 0) { showToast('Nessuna spesa ricorrente da applicare'); return; }
    var today = new Date().toISOString().slice(0, 10);
    state.recurring.forEach(function(r) { state.expenses.push({ date: today, category: r.category, desc: r.desc, amount: r.amount }); });
    saveState(); renderDashboard(); renderSpese();
    showToast('Applicate ' + state.recurring.length + ' spese fisse al mese');
  });

  document.getElementById('storicoMonthlyList').addEventListener('click', function(e) {
    var row = e.target.closest('[data-edit-month]');
    if (row) openModal('netto', parseInt(row.getAttribute('data-edit-month'), 10));
  });
  document.getElementById('storicoEventsList').addEventListener('click', function(e) {
    var btn = e.target.closest('[data-del-ev]');
    if (btn) { state.events.splice(parseInt(btn.getAttribute('data-del-ev'), 10), 1); saveState(); renderDashboard(); renderStorico(); showToast('Evento eliminato'); }
  });
  document.getElementById('storicoYearsList').addEventListener('click', function(e) {
    var row = e.target.closest('[data-select-year]');
    if (row) { currentYear = parseInt(row.getAttribute('data-select-year'), 10); syncYearDropdown(); switchTab('dashboard'); }
  });

  document.getElementById('toggleDark').addEventListener('change', function() { prefs.dark = this.checked; savePrefs(); applyPrefsUI(); });
  document.getElementById('inpBudgetLimit').addEventListener('change', function() {
    var v = toEuroAmount(parseNumberInput(this.value, 'it'));
    prefs.budgetLimit = (!isNaN(v) && v > 0) ? v : 0;
    savePrefs(); renderDashboard(); showToast('Budget mensile aggiornato');
  });

  var visMap = { 'vis-netto': 'netto', 'vis-uscite': 'uscite', 'vis-media': 'media', 'vis-totale': 'totale', 'vis-stipendio': 'stipendio', 'vis-forecast': 'forecast', 'vis-chart-mensile': 'chartMensile', 'vis-chart-spese': 'chartSpese', 'vis-chart-annuale': 'chartAnnuale', 'vis-chart-stipendi': 'chartStipendi' };
  Object.keys(visMap).forEach(function(id) {
    document.getElementById(id).addEventListener('change', function() { prefs.vis[visMap[id]] = this.checked; savePrefs(); applyPrefsUI(); });
  });
  document.getElementById('btnDownloadTemplate').addEventListener('click', function() {
    var lines = ['Anno;Mese;Netto'];
    for (var i = 0; i < 12; i++) lines.push(currentYear + ';' + MONTHS[i] + ';0.00');
    downloadFile('Modello_Entrate_' + currentYear + '.csv', lines.join('\n'), 'text/csv;charset=utf-8;');
  });
  document.getElementById('btnDownloadExpTemplate').addEventListener('click', function() {
    var lines = ['Data;Categoria;Descrizione;Importo', currentYear + '-01-15;Alimentari;Supermercato;65.50', currentYear + '-01-20;Casa & Utenze;Bolletta Luce;89.00'];
    downloadFile('Modello_Uscite_' + currentYear + '.csv', lines.join('\n'), 'text/csv;charset=utf-8;');
  });

  // ===== IMPORTA BUSTE PAGA PDF =====
  // Percorsi assoluti ricavati dall'URL della pagina, non dalla posizione degli script.
  var PDFJS_URL = new URL('vendor/pdf.mjs', document.baseURI).href;
  var PDFJS_WORKER = new URL('vendor/pdf.worker.mjs', document.baseURI).href;
  var payRows = [];
  var payRun = 0;
  var payOcrAllowed = null;

  // PAY-PURE-START
  var AMT_RE = /(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2}/g;
  var MON_ABBR = '(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic)';
  var MON_FULL = '(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)';
  var RE_NAMED = new RegExp('\\b' + MON_ABBR + '\\b\\.?\\s*(?:del\\s+|/|-)?\\s*(20\\d{2})\\b', 'i');
  var RE_NUM = /\b(0?[1-9]|1[0-2])\s*[\/\-.]\s*(20\d{2})\b/;
  var RE_KEY = /periodo|mese|competenza|retribuzion|cedolino|paga\b/i;
  var NETTO_KEYS = [/netto\s+del\s+mese/i, /netto\s+in\s+busta/i, /netto\s+(?:a|da)\s+pagare/i, /netto\s+busta/i, /totale\s+netto/i, /netto\s+pagato/i, /^\s*netto\b/i];

  function monthFromName(s) {
    s = String(s).toLowerCase();
    for (var m = 0; m < 12; m++) { if (MONTHS[m].toLowerCase().indexOf(s) === 0) return m; }
    return -1;
  }
  function amountsIn(str) { return str.match(AMT_RE) || []; }

  // Individua il netto in cedolini con etichette su una o più righe.
  // In caso di più importi plausibili non sceglie arbitrariamente.
  // Famiglie di etichette: gestionali italiani, PA e cedolini multilingue.
  // Priorità: netto da pagare > netto mensile > etichetta generica.
  var NETTO_LABELS = [
    /\bnetto\s+(?:a|da)\s+(?:pagare|corrispondere|liquidare|erogare|accreditare)\b/i,
    /\b(?:importo|totale)\s+(?:netto\s+)?(?:da\s+)?(?:accreditare|corrispondere|pagare)\b/i,
    /\b(?:liquido|somma)\s+(?:a|da)\s+(?:pagare|corrispondere|liquidare)\b/i,
    /\bnetto\s+(?:del\s+mese|in\s+busta|busta|pagato|mensile|dipendente|da\s+corrispondere)\b/i,
    /\b(?:importo|totale|retribuzione|stipendio)\s+netto\b/i,
    /\b(?:net\s+pay|take[\s-]*home\s+pay|net\s+salary|net\s+amount)\b/i,
    /\bnetto\b/i
  ];
  function moneyTokens(line) {
    var re = /(?:^|[^\d])((?:\d{1,3}(?:[.\s]\d{3})+|\d+),\d{2}|(?:\d{1,3}(?:,\d{3})+|\d+)\.\d{2})(?!\d)/g;
    var found=[],m;
    while ((m=re.exec(String(line)))) {
      var n=parseNumberInput(m[1].replace(/\s/g,''),'it');
      if (Number.isFinite(n) && n>0 && n<=1000000) found.push(n);
    }
    return found;
  }
  function findNetto(lines) {
    var matches=[];
    for(var i=0;i<lines.length;i++) {
      var line=String(lines[i]||'');
      // Non confondere imponibile fiscale netto, ritenute e progressivi con il netto in busta.
      if (/\b(?:fiscale\s+netto|imponibile|ritenut[ae]|tfr|progressiv[oi]|contributi|detrazioni|netto\s+imponibile)\b/i.test(line) &&
          !/\bnetto\s+(?:a|da)\s+pagare\b/i.test(line)) continue;
      var combined=line+' '+String(lines[i+1]||'')+' '+String(lines[i+2]||'');
      var label=null, priority=0, labelEnd=0;
      for(var k=0;k<NETTO_LABELS.length;k++) {
        var m=NETTO_LABELS[k].exec(line);
        if(m) {label=m[0];priority=NETTO_LABELS.length-k;labelEnd=m.index+m[0].length;break;}
        // Etichette spezzate: "NETTO A" / "PAGARE".
        if(k<NETTO_LABELS.length-1) {
          m=NETTO_LABELS[k].exec(combined);
          if(m && m.index < line.length+2) {
            label=m[0];priority=NETTO_LABELS.length-k;labelEnd=-1;break;
          }
        }
      }
      if(!label) continue;
      // Stessa riga: cerca soltanto gli importi DOPO l'etichetta.
      var same=labelEnd>=0?moneyTokens(line.slice(labelEnd)):[];
      if(same.length===1) {matches.push({amount:same[0],score:priority*10+5,at:i});continue;}
      if(same.length>1) continue;
      // Nelle tabelle il netto può essere sotto un'intestazione spezzata.
      // Non oltrepassare un'altra intestazione o una nuova sezione.
      for(var j=i+1;j<=i+4 && j<lines.length;j++){
        var next=String(lines[j]||'');
        if(j>i+1 && /\b(?:imponibili\s+progressivi|istituto\s+residue|elementi\s+retributivi)\b/i.test(next))break;
        var nums=moneyTokens(next);
        // Data valuta + importo netto: la data non viene riconosciuta come denaro.
        if(nums.length===1) {matches.push({amount:nums[0],score:priority*10+2-(j-i),at:i});break;}
        if(nums.length>1) break; // non indovinare tra competenze e trattenute
      }
    }
    if(!matches.length)return null;
    matches.sort(function(a,b){return b.score-a.score;});
    var best=matches[0], tied=matches.filter(function(x){return x.score>=best.score-2;});
    if(tied.some(function(x){return Math.abs(x.amount-best.amount)>0.005;}))return null;
    return best.amount;
  }

  function detectPeriod(lines) {
    var RE_SKIP = /assunz|assunt|nascita|nato\b|nata\b|anzianit|cessaz|scadenz|iscrizion/i;
    var head = lines.slice(0, 45).filter(function(l) { return !RE_SKIP.test(l); });
    var keyLines = head.filter(function(l) { return RE_KEY.test(l); });
    var i, m;
    for (i = 0; i < keyLines.length; i++) {
      m = RE_NAMED.exec(keyLines[i]);
      if (m) return { m: monthFromName(m[1]), y: parseInt(m[2], 10) };
    }
    for (i = 0; i < keyLines.length; i++) {
      m = RE_NUM.exec(keyLines[i]);
      if (m) return { m: parseInt(m[1], 10) - 1, y: parseInt(m[2], 10) };
    }
    for (i = 0; i < head.length; i++) {
      m = RE_NAMED.exec(head[i]);
      if (m) return { m: monthFromName(m[1]), y: parseInt(m[2], 10) };
    }
    var mo = -1, yr = 0;
    var reFull = new RegExp('\\b' + MON_FULL + '\\b', 'i');
    for (i = 0; i < keyLines.length && mo < 0; i++) { m = reFull.exec(keyLines[i]); if (m) mo = monthFromName(m[1]); }
    for (i = 0; i < head.length && !yr; i++) { m = /anno\s*:?\s*(20\d{2})/i.exec(head[i]); if (m) yr = parseInt(m[1], 10); }
    return { m: mo, y: yr };
  }

  function periodFromName(name) {
    var n = String(name).replace(/\.pdf$/i, '');
    var spaced = n.replace(/[_\.]/g, ' ');
    var m = RE_NAMED.exec(spaced);
    if (m) return { m: monthFromName(m[1]), y: parseInt(m[2], 10) };
    m = /(20\d{2})[-_. ]?(0[1-9]|1[0-2])(?!\d)/.exec(n);
    if (m) return { m: parseInt(m[2], 10) - 1, y: parseInt(m[1], 10) };
    m = /(?:^|[^\d])(0?[1-9]|1[0-2])[-_. ](20\d{2})(?!\d)/.exec(n);
    if (m) return { m: parseInt(m[1], 10) - 1, y: parseInt(m[2], 10) };
    var mm = new RegExp('\\b' + MON_FULL + '\\b', 'i').exec(spaced);
    var yy = /(20\d{2})/.exec(n);
    return { m: mm ? monthFromName(mm[1]) : -1, y: yy ? parseInt(yy[1], 10) : 0 };
  }

  function parsePayslip(lines, fileName) {
    var amount = findNetto(lines);
    if (amount !== null && (isNaN(amount) || amount <= 0 || amount > 1000000)) amount = null;
    var per = detectPeriod(lines);
    var fn = periodFromName(fileName || '');
    return { amount: amount, m: per.m >= 0 ? per.m : fn.m, y: per.y ? per.y : fn.y };
  }
  // PAY-PURE-END

  var pdfJsLoadPromise = null;
  function loadPdfJs() {
    if (location.protocol === 'file:') {
      return Promise.reject(new Error('L’app è aperta da un file locale (file://). Safari blocca i moduli PDF in questa modalità. Apri Wallet-PRO dall’indirizzo HTTPS di GitHub Pages.'));
    }
    if (!pdfJsLoadPromise) {
      pdfJsLoadPromise = (async function () {
        // Diagnostica il problema reale: file assente, pagina HTML al posto del modulo,
        // caricamento non riuscito, incompatibilità del browser o worker.
        for (var item of [{name:'pdf.mjs',url:PDFJS_URL},{name:'pdf.worker.mjs',url:PDFJS_WORKER}]) {
          var response;
          try { response = await fetch(item.url, {cache:'no-store'}); }
          catch (err) { throw new Error('Impossibile raggiungere '+item.name+': '+(err.message||err)); }
          if (!response.ok) throw new Error(item.name+' non accessibile (HTTP '+response.status+'). Verifica il percorso pubblicato su GitHub Pages.');
          var type = response.headers.get('content-type') || '';
          if (/text\/html/i.test(type)) throw new Error(item.name+' restituisce HTML anziché JavaScript. Verifica i percorsi e la pubblicazione GitHub Pages.');
        }
        var pdfjs;
        try { pdfjs = await import(PDFJS_URL); }
        catch (err) { throw new Error('Importazione del modulo PDF non riuscita: '+(err.message||err)+'. Verifica browser e cache del Service Worker.'); }
        if (!pdfjs || !pdfjs.GlobalWorkerOptions || !pdfjs.getDocument) throw new Error('Modulo PDF locale non valido.');
        pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
        return pdfjs;
      })().catch(function(err){pdfJsLoadPromise=null;throw err;});
    }
    return pdfJsLoadPromise;
  }

  function itemsToLines(items) {
    var rows = [];
    items.forEach(function(it) {
      if (!it.str || !it.str.trim()) return;
      var x = it.transform[4], y = it.transform[5], row = null;
      for (var i = 0; i < rows.length; i++) { if (Math.abs(rows[i].y - y) <= 2.5) { row = rows[i]; break; } }
      if (!row) { row = { y: y, parts: [] }; rows.push(row); }
      row.parts.push({ x: x, s: it.str });
    });
    rows.sort(function(a, b) { return b.y - a.y; });
    return rows.map(function(r) {
      r.parts.sort(function(a, b) { return a.x - b.x; });
      return r.parts.map(function(p) { return p.s.trim(); }).join(' ').replace(/\s+/g, ' ');
    });
  }

  function extractPdfLines(pdf) {
    var lines = [];
    var chain = Promise.resolve();
    function addPage(n) {
      chain = chain.then(function() { return pdf.getPage(n); })
        .then(function(page) { return page.getTextContent(); })
        .then(function(tc) { lines = lines.concat(itemsToLines(tc.items)); });
    }
    for (var n = 1; n <= Math.min(pdf.numPages, 4); n++) addPage(n);
    return chain.then(function() { return lines; });
  }

  function ocrPdfPage(pdf) {
    return new Promise(function(resolve,reject) {
      loadOcrLibrary(function() {
        if (typeof Tesseract === 'undefined') { reject(new Error('Libreria OCR locale assente')); return; }
        pdf.getPage(1).then(function(page) {
          var viewport=page.getViewport({scale:2}); var canvas=document.createElement('canvas');
          canvas.width=viewport.width; canvas.height=viewport.height;
          return page.render({canvasContext:canvas.getContext('2d'),viewport:viewport}).promise.then(function(){return canvas;});
        }).then(function(canvas) {
          return Tesseract.recognize(canvas,'ita+eng',{workerPath:new URL('vendor/worker.min.js', document.baseURI).href,corePath:new URL('vendor/tesseract-core.wasm.js', document.baseURI).href,langPath:new URL('vendor/lang', document.baseURI).href,workerBlobURL:false,gzip:true});
        }).then(function(result){resolve(result.data.text);}).catch(reject);
      });
    });
  }

  function askOcr() {
    // Privacy-first: no PDF page is sent to a remote OCR service.
    return Promise.resolve(true);
  }

  function readFileBuffer(file) {
    return new Promise(function(resolve, reject) {
      var r = new FileReader();
      r.onload = function(ev) { resolve(ev.target.result); };
      r.onerror = function() { reject(new Error('read')); };
      r.readAsArrayBuffer(file);
    });
  }

  function makeRow(name, info, note) {
    var ok = info.amount !== null && info.m >= 0 && info.y >= 1990 && info.y <= 2100;
    return {
      name: name, m: info.m, y: info.y || '',
      amount: info.amount !== null ? toDisplayAmount(info.amount).toFixed(2).replace('.', ',') : '',
      ok: ok, note: note || ''
    };
  }

  function readPayFile(pdfjs, file) {
    var loadingTask=null, pdf=null;
    return readFileBuffer(file).then(function(buf){
      loadingTask=pdfjs.getDocument({data:buf,isEvalSupported:false});
      buf=null;
      return loadingTask.promise;
    }).then(function(doc){
      pdf=doc;
      return extractPdfLines(pdf).then(function(lines){
        if(lines.length>=3)return {lines:lines,ocr:false};
        return askOcr().then(function(allowed){
          if(!allowed)return {lines:[],ocr:false};
          return ocrPdfPage(pdf).then(function(txt){
            return {lines:String(txt).split(/\r?\n/).map(function(x){return x.trim();}).filter(Boolean),ocr:true};
          });
        });
      });
    }).then(function(res){
      var note=!res.lines.length?'PDF senza testo: compila a mano':res.ocr?'Letto con OCR locale: controlla i valori':'';
      return makeRow(file.name,parsePayslip(res.lines,file.name),note);
    }).finally(function(){
      // PDF.js trattiene font, immagini e pagine finché il documento non viene distrutto.
      if(loadingTask)return Promise.resolve(loadingTask.destroy()).catch(function(){});
      if(pdf)return Promise.resolve(pdf.destroy()).catch(function(){});
    });
  }

  function rowValid(r) {
    var v = parseNumberInput(r.amount, 'it'), y = parseInt(r.y, 10);
    return !isNaN(v) && v > 0 && r.m >= 0 && r.m <= 11 && !isNaN(y) && y >= 1990 && y <= 2100;
  }

  function markDuplicates() {
    var seen = {};
    payRows.forEach(function(r) {
      if (!r.ok || !rowValid(r)) return;
      var key = parseInt(r.y, 10) + '-' + r.m;
      if (seen[key]) { r.ok = false; r.note = 'Duplicato nel gruppo: stesso mese di ' + seen[key]; }
      else seen[key] = r.name;
    });
  }


  // Indicatori locali: percentuale reale per il numero di PDF elaborati;
  // Excel usa una barra animata perché il parser non espone progressi misurabili.
  function wpImportProgress(kind, message, fraction, done) {
    var el=document.getElementById(kind==='pdf'?'wpPdfImportProgress':'wpExcelImportProgress');
    if(!el)return;
    el.setAttribute('aria-hidden',done?'true':'false');
    el.classList.toggle('indeterminate',fraction==null && !done);
    el.querySelector('.wp-progress-label').textContent=message||'';
    el.querySelector('.wp-progress-percent').textContent=fraction==null?'':Math.round(Math.max(0,Math.min(1,fraction))*100)+'%';
    el.querySelector('.wp-import-progress-fill').style.width=fraction==null?'38%':Math.round(Math.max(0,Math.min(1,fraction))*100)+'%';
  }

  function setPayProgress(msg, busy) {
    var el = document.getElementById('payProgress');
    el.textContent = msg; el.style.display = msg ? 'block' : 'none';
    document.getElementById('btnPayImport').disabled = !!busy;
  }

  // Import PDF: confronta solo gli stipendi, mai il totale delle entrate mensili.
  function pdfSalaryEntries(y, m) {
    var ym = String(y)+'-'+String(Number(m)+1).padStart(2,'0');
    return (state.bankIncomeEntries || []).filter(function(en) {
      return en && String(en.date || '').slice(0,7) === ym && salaryKeyFor(en);
    });
  }
  function pdfSalaryStatus(y, m, amount) {
    var entries = pdfSalaryEntries(y,m);
    var cents = Math.round(Number(amount)*100);
    var same = entries.some(function(en){return Math.round(Number(en.amount)*100)===cents;}) ||
      (state.paySalaryKeys || []).indexOf(paySalaryKey(y,m,amount)) >= 0 ||
      (state.payslips || []).some(function(p){return Number(p.year)===y && Number(p.month)===m && Math.round(Number(p.amount)*100)===cents;});
    return {entries:entries, same:same};
  }

  function updateRowUI(i) {
    var rowEl = document.querySelector('#payRows .pay-row[data-i="' + i + '"]');
    if (!rowEl) return;
    var r = payRows[i], notes = [], color = 'var(--subtext)';
    rowEl.querySelector('[data-f="ok"]').checked = r.ok;
    if (!rowValid(r)) { notes.push('Compila mese, anno e importo'); color = 'var(--orange)'; }
    else {
      var y = parseInt(r.y, 10);
      var amount = toEuroAmount(parseNumberInput(r.amount, 'it'));
      var status = pdfSalaryStatus(y, r.m, amount);
      if (status.same) { notes.push('Stipendio già presente: ' + fmtEur(amount) + ' · duplicato ignorato'); color = 'var(--green)'; }
      else if (status.entries.length) { notes.push('Stipendio già registrato: ' + status.entries.map(function(en){return fmtEur(en.amount);}).join(', ') + ' · importazione bloccata per evitare sostituzioni'); color = 'var(--orange)'; }
      else { notes.push('Nuovo stipendio: ' + fmtEur(amount) + ' · le altre entrate non saranno modificate'); }
    }
    if (r.note) { notes.unshift(r.note); if (r.note.indexOf('Duplicato') === 0 || r.note.indexOf('PDF scansionato') === 0) color = 'var(--orange)'; }
    var noteEl = rowEl.querySelector('.pay-note');
    noteEl.textContent = notes.join(' · '); noteEl.style.color = color;
    noteEl.style.display = notes.length ? 'block' : 'none';
  }

  function updatePayCount() {
    var n = payRows.filter(function(r) { return r.ok && rowValid(r); }).length;
    var b = document.getElementById('btnPayImport');
    // Messaggio esteso soltanto quando la selezione contiene duplicati.
    var hasDuplicates = payRows.some(function(r) {
      if (!r.ok || !rowValid(r)) return false;
      var amount = toEuroAmount(parseNumberInput(r.amount, 'it'));
      return pdfSalaryStatus(parseInt(r.y, 10), Number(r.m), amount).same;
    });
    b.textContent = n === 0 ? 'Nessuna busta selezionata' :
      hasDuplicates ? 'Sei sicuro di importare ' + n + (n === 1 ? ' busta paga?' : ' buste paga?') :
      'Importa ' + n + (n === 1 ? ' busta paga' : ' buste paga');
    b.disabled = n === 0;
  }

  function renderPayRows() {
    var box = document.getElementById('payRows');
    if (!payRows.length) { box.innerHTML = '<div class="empty-state">Nessun file letto</div>'; updatePayCount(); return; }
    box.innerHTML = payRows.map(function(r, i) {
      var opts = MONTHS.map(function(mn, k) { return '<option value="' + k + '"' + (r.m === k ? ' selected' : '') + '>' + mn + '</option>'; }).join('');
      if (r.m < 0) opts = '<option value="-1" selected>Mese?</option>' + opts;
      return '<div class="pay-row" data-i="' + i + '">' +
        '<label class="pay-check"><input type="checkbox" data-f="ok"><span class="pay-name">' + escapeHtml(r.name) + '</span></label>' +
        '<div class="pay-fields">' +
          '<select class="form-input" data-f="m">' + opts + '</select>' +
          '<input class="form-input" data-f="y" type="number" inputmode="numeric" placeholder="Anno" value="' + escapeHtml(String(r.y)) + '">' +
          '<input class="form-input" data-f="amount" type="text" inputmode="decimal" placeholder="Netto €" value="' + escapeHtml(r.amount) + '">' +
        '</div><div class="row-sub pay-note"></div></div>';
    }).join('');
    for (var i = 0; i < payRows.length; i++) updateRowUI(i);
    updatePayCount();
  }

  function closePayModal() { payRun++; wpImportProgress('pdf','',null,true); document.getElementById('payModal').classList.remove('open'); }

  function processPayFiles(fileList) {
    var files = [];
    for (var i = 0; i < fileList.length; i++) {
      var f = fileList[i];
      if (/\.pdf$/i.test(f.name) || f.type === 'application/pdf') files.push(f);
    }
    if (!files.length) { wpImportProgress('pdf','',null,true); showToast('Nessun file PDF trovato'); return; }
    files.sort(function(a, b) { return a.name.localeCompare(b.name); });
    var run = ++payRun;
    payRows = []; payOcrAllowed = null;
    try{sessionStorage.removeItem('walletpro_pdf_preview_v1');}catch(_){}
    document.getElementById('payRows').innerHTML = '';
    document.getElementById('payModal').classList.add('open');
    setPayProgress('Caricamento lettore PDF...', true);
    wpImportProgress('pdf','Preparazione di '+files.length+' PDF…',0,false);
    loadPdfJs().then(function(pdfjs) {
      var chain = Promise.resolve();
      files.forEach(function(file, idx) {
        chain = chain.then(function() {
          if (run !== payRun) return;
          setPayProgress('Lettura ' + (idx + 1) + '/' + files.length + ': ' + file.name, true);
          wpImportProgress('pdf','Analisi PDF '+(idx+1)+' di '+files.length+': '+file.name,idx/files.length,false);
          return new Promise(function(resolve){setTimeout(resolve,25);}).then(function(){return readPayFile(pdfjs,file);}).then(
            function(row) { payRows.push(row); wpImportProgress('pdf','PDF elaborati: '+(idx+1)+' di '+files.length,(idx+1)/files.length,false); },
            function(err) { payRows.push(makeRow(file.name, { amount: null, m: -1, y: 0 }, 'PDF non leggibile: ' + (err && err.message ? err.message : 'errore sconosciuto'))); wpImportProgress('pdf','PDF elaborati: '+(idx+1)+' di '+files.length,(idx+1)/files.length,false); }
          ).then(function(){
            try{sessionStorage.setItem('walletpro_pdf_preview_v1',JSON.stringify(payRows));}catch(_){}
          });
        });
      });
      return chain;
    }).then(function() {
      if (run !== payRun) return;
      markDuplicates(); renderPayRows(); setPayProgress('', false); updatePayCount();
      wpImportProgress('pdf','',null,true);
    }).catch(function(err) {
      if (run !== payRun) return;
      setPayProgress('Importazione PDF: ' + (err && err.message ? err.message : 'errore sconosciuto'), false);
      document.getElementById('btnPayImport').disabled = true;
      wpImportProgress('pdf','Errore durante la lettura',null,true);
    });
  }

  // Recupero locale dell'anteprima dopo un riavvio della PWA, senza salvare stipendi.
  try{var prev=JSON.parse(sessionStorage.getItem('walletpro_pdf_preview_v1')||'[]');
    if(Array.isArray(prev)&&prev.length){payRows=prev.filter(function(r){return r&&typeof r.name==='string'&&typeof r.amount==='string';});}
  }catch(_){}
  document.getElementById('btnPayFiles').addEventListener('click', function() { wpImportProgress('pdf','Seleziona i PDF da importare…',null,false); document.getElementById('payFilesInput').click(); });
  document.getElementById('btnPayFolder').addEventListener('click', function() { wpImportProgress('pdf','Seleziona una cartella di PDF…',null,false); document.getElementById('payFolderInput').click(); });
  ['payFilesInput', 'payFolderInput'].forEach(function(id) {
    document.getElementById(id).addEventListener('change', function() {
      if (this.files && this.files.length) processPayFiles(this.files);
      else wpImportProgress('pdf','',null,true);
      this.value = '';
    });
  });
  ['payFilesInput','payFolderInput'].forEach(function(id){document.getElementById(id).addEventListener('cancel',function(){wpImportProgress('pdf','',null,true);});});
  document.getElementById('bankExcelInput').addEventListener('cancel',function(){wpImportProgress('excel','',null,true);});
  document.getElementById('closePayBtn').addEventListener('click', closePayModal);
  document.getElementById('payRows').addEventListener('change', function(e) {
    var el = e.target, rowEl = el.closest('.pay-row');
    if (!rowEl) return;
    var i = parseInt(rowEl.getAttribute('data-i'), 10), f = el.getAttribute('data-f'), r = payRows[i];
    var wasValid = rowValid(r);
    if (f === 'ok') r.ok = el.checked;
    else {
      if (f === 'm') r.m = parseInt(el.value, 10);
      else if (f === 'y') r.y = el.value;
      else if (f === 'amount') r.amount = el.value;
      r.note = '';
      if (!wasValid && rowValid(r)) r.ok = true;
    }
    updateRowUI(i); updatePayCount();
  });
  document.getElementById('btnPayImport').addEventListener('click', function() {
    var imported = 0, duplicates = 0, conflicts = 0, last = 0;
    payRows.forEach(function(r) {
      if (!r.ok || !rowValid(r)) return;
      var y = parseInt(r.y, 10), m = Number(r.m);
      var payAmount = toEuroAmount(parseNumberInput(r.amount, 'it'));
      var status = pdfSalaryStatus(y, m, payAmount);
      if (status.same) { duplicates++; return; }
      // Se esiste uno stipendio diverso, non sostituire né sommare senza verifica.
      if (status.entries.length) { conflicts++; return; }
      if (!state.monthly[y]) state.monthly[y] = makeZeroYear();
      if (!Array.isArray(state.bankIncomeEntries)) state.bankIncomeEntries = [];
      if (!Array.isArray(state.paySalaryKeys)) state.paySalaryKeys = [];
      if (!Array.isArray(state.payslips)) state.payslips = [];
      var payDate = String(y)+'-'+String(m+1).padStart(2,'0')+'-01';
      state.bankIncomeEntries.push({date:payDate, amount:payAmount, desc:'Busta paga', category:'Stipendio', source:'payslip'});
      // monthly rappresenta TUTTE le entrate; aggiungere soltanto un nuovo stipendio.
      state.monthly[y][m] = Math.round(((Number(state.monthly[y][m]) || 0) + payAmount) * 100) / 100;
      if (!state.monthlyIncomeCategories) state.monthlyIncomeCategories = {};
      // Non classificare l'intero totale del mese come stipendio.
      state.payslips.push({year:y,month:m,amount:payAmount});
      state.paySalaryKeys.push(paySalaryKey(y,m,payAmount));
      last = y; imported++;
    });
    if (imported) {
      currentYear = last;
      saveState(); syncYearDropdown(); renderDashboard(); renderEntrate(); renderStorico();
      try{sessionStorage.removeItem('walletpro_pdf_preview_v1');}catch(_){}
      closePayModal();
    }
    var summary = 'PDF: ' + imported + ' nuovi stipendi, ' + duplicates + ' duplicati ignorati, ' + conflicts + ' importi diversi non modificati.';
    if (conflicts) window.alert(summary + '\nVerifica gli stipendi esistenti nel menu Entrate prima di correggerli.');
    else showToast(summary);
  });

  // ===== IMPORTAZIONE INTELLIGENTE ESTRATTO CONTO EXCEL =====
  function loadXlsxLibrary() {
    return new Promise(function(resolve, reject) {
      if (window.XLSX) { resolve(window.XLSX); return; }
      var script = document.createElement('script');
      script.src = './vendor/xlsx.full.min.js';
      script.onload = function() { window.XLSX ? resolve(window.XLSX) : reject(new Error('Libreria Excel non disponibile')); };
      script.onerror = function() { reject(new Error('Libreria Excel locale mancante: vendor/xlsx.full.min.js')); };
      document.head.appendChild(script);
    });
  }
  function bankNorm(v) {
    return String(v == null ? '' : v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[_\-./]+/g,' ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  }
  function bankDate(v, XLSX) {
    if (v instanceof Date && !isNaN(v.getTime())) return v.getFullYear()+'-'+String(v.getMonth()+1).padStart(2,'0')+'-'+String(v.getDate()).padStart(2,'0');
    if (typeof v === 'number' && v > 20000 && v < 80000) {
      var d = XLSX && XLSX.SSF ? XLSX.SSF.parse_date_code(v) : null;
      if (!d) { var serialDate = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86400000); d = { y: serialDate.getUTCFullYear(), m: serialDate.getUTCMonth() + 1, d: serialDate.getUTCDate() }; }
      if (d) return d.y+'-'+String(d.m).padStart(2,'0')+'-'+String(d.d).padStart(2,'0');
    }
    var t = String(v == null ? '' : v).trim();
    var m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/.exec(t);
    if (m) { var y = Number(m[3]); if (y < 100) y += y < 50 ? 2000 : 1900; var dd=Number(m[1]),mm=Number(m[2]); if(mm<1||mm>12||dd<1||dd>31)return ''; return y+'-'+String(mm).padStart(2,'0')+'-'+String(dd).padStart(2,'0'); }
    m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(t);
    if (m) return m[1]+'-'+String(Number(m[2])).padStart(2,'0')+'-'+String(Number(m[3])).padStart(2,'0');
    return '';
  }
  function bankNumber(v, locale) {
    return window.walletProParseAmount(v, locale);
  }

  // Categorie intelligenti condivise fra inserimento, OCR, voce e importazioni.
  // Tutto rimane in localStorage; non modifica i movimenti esistenti.
  var SMART_CAT_KEY='walletpro_smart_categories_v1';
  function smartWords(value){
    var stop={pagamento:1,acquisto:1,operazione:1,bonifico:1,addebito:1,credito:1,carta:1,bancomat:1,transazione:1,esercente:1,negozio:1,terminale:1,rif:1,pos:1,del:1,della:1,per:1,con:1,via:1,spa:1,srl:1,italia:1};
    return bankNorm(value).split(' ').filter(function(w){return w.length>=3&&!stop[w]&&!/^\d+$/.test(w)&&!/^\d{4,}$/.test(w);});
  }
  function smartKey(value){return smartWords(value).slice(0,5).join(' ');}
  function smartRead(){try{var x=JSON.parse(localStorage.getItem(SMART_CAT_KEY)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch(e){return {}}}
  function smartRemember(desc,cat){
    var key=smartKey(desc);if(!key||!cat||/^altro$/i.test(cat))return;
    var m=smartRead();m[key]={category:cat,updated:Date.now()};
    var keys=Object.keys(m);if(keys.length>450){keys.sort(function(a,b){return (m[a].updated||0)-(m[b].updated||0)});keys.slice(0,keys.length-400).forEach(function(k){delete m[k]})}
    try{localStorage.setItem(SMART_CAT_KEY,JSON.stringify(m))}catch(e){}
  }
  function smartLearned(desc){
    var key=smartKey(desc);if(!key)return null;
    var m=smartRead(), exact=m[key];if(exact&&allCategories().indexOf(exact.category)>=0)return exact.category;
    // Variante dello stesso negozio con numero terminale, località o identificativo.
    var words=smartWords(desc), candidates={};
    Object.keys(m).forEach(function(k){
      var entry=m[k],c=entry&&entry.category;
      if(allCategories().indexOf(c)<0)return;
      var known=k.split(' '),common=known.filter(function(w){return words.indexOf(w)>=0&&w.length>=5});
      if(common.length<1)return;
      var overlap=common.length/Math.max(known.length,words.length);
      if(overlap<0.5 && common.length<2)return;
      var score=common.length*10+overlap*10;
      if(!candidates[c]||candidates[c]<score)candidates[c]=score;
    });
    var ranked=Object.keys(candidates).sort(function(a,b){return candidates[b]-candidates[a]});
    return ranked.length && (ranked.length===1||candidates[ranked[0]]>candidates[ranked[1]]+5)?ranked[0]:null;
  }
  function smartSuggestExpense(force){
    var d=document.getElementById('expDesc'),c=document.getElementById('expCategory');if(!d||!c||!d.value.trim())return;
    if(!force&&d.dataset.smartManual==='1')return;
    var cat=smartLearned(d.value)||learnedExpenseCategory(d.value);
    if(!cat){var fallback=bankCategory(d.value);if(fallback!=='Altro')cat=fallback;}
    if(cat&&Array.from(c.options).some(function(o){return o.value===cat}))c.value=cat;
  }
  window.walletproSmartSuggest=function(){smartSuggestExpense(false)};
  document.getElementById('expDesc').addEventListener('input',function(){smartSuggestExpense(false)});
  document.getElementById('expCategory').addEventListener('change',function(){document.getElementById('expDesc').dataset.smartManual='1'});
  // Apprende le categorie dalle uscite già salvate, senza server o servizi esterni.
  // Preferisce causali uguali; poi prefissi e sequenze di parole significative.
  function learnedExpenseCategory(desc) {
    var target=bankNorm(desc);
    if(!target || target.length<4) return null;
    var stop={bonifico:1,pagamento:1,addebito:1,operazione:1,carta:1,pos:1,sep:1,disposizione:1,acquisto:1,del:1,della:1,con:1,per:1,da:1,il:1,di:1,iban:1,rif:1,numero:1};
    function significantWords(v) {return bankNorm(v).split(' ').filter(function(w){return w.length>=4&&!stop[w]&&!/^\d+$/.test(w);});}
    var words=significantWords(desc), best=null, score=0;
    state.expenses.forEach(function(ex){
      var known=bankNorm(ex.desc), cat=ex.category;
      if(!known||!cat||known.length<4) return;
      var points=0;
      if(target===known) points=1000;
      else {
        var a=significantWords(ex.desc);
        // Il testo di una causale può iniziare allo stesso modo, anche se termina con un codice differente.
        var prefix=0;
        while(prefix<words.length&&prefix<a.length&&words[prefix]===a[prefix]) prefix++;
        if(prefix && words[0].length>=5 && a[0].length>=5) points=Math.max(points,100+prefix*20);
        // Cerca una parola distintiva o una frase in comune anche all'interno della causale.
        for(var i=0;i<words.length;i++) for(var j=0;j<a.length;j++) {
          var run=0;
          while(i+run<words.length&&j+run<a.length&&words[i+run]===a[j+run])run++;
          if(run>=2) points=Math.max(points,80+run*20);
          else if(run===1&&words[i].length>=6) points=Math.max(points,60+words[i].length);
        }
      }
      if(points>score){score=points;best=cat;}
    });
    return score>=60 ? best : null;
  }
  function bankCategory(desc) {
    var learned=smartLearned(desc)||learnedExpenseCategory(desc);
    if(learned) return learned;
    var d = bankNorm(desc);
    if (/supermerc|alimentari|conad|lidl|coop|carrefour|esselunga|spesa/.test(d)) return 'Alimentari';
    if (/enel|energia|luce|gas|acqua|utenze|telefon|internet|affitto|condominio/.test(d)) return 'Casa & Utenze';
    if (/benzina|carburante|autostrada|parcheggio|treno|trenitalia|italo|taxi|trasport/.test(d)) return 'Auto & Trasporti';
    if (/farmac|medic|ospedale|salute/.test(d)) return 'Salute';
    if (/ristor|bar |pizzeria|cinema|netflix|spotify|svago/.test(d)) return 'Tempo Libero';
    if (/mutuo|prestito|finanziament|rata/.test(d)) return 'Rate & Finanziamenti';
    return 'Altro';
  }
  function bankFindColumn(headers, aliases, partial) {
    // Priorità alle corrispondenze esatte, poi alle parole chiave contenute nell'intestazione.
    for (var a=0;a<aliases.length;a++) for (var c=0;c<headers.length;c++) if(headers[c]===aliases[a]) return c;
    for (var c2=0;c2<headers.length;c2++) for(var a2=0;a2<aliases.length;a2++) if(aliases[a2].length>=5 && headers[c2].indexOf(aliases[a2])>=0) return c2;
    return -1;
  }
  function bankDetectColumns(row) {
    var h=row.map(bankNorm);
    var date=bankFindColumn(h,['data operazione','data movimento','data contabilizzazione','data registrazione','booking date','transaction date','operation date','data'],true);
    if(date<0) date=bankFindColumn(h,['data valuta','value date','date valuta'],true);
    var debit=bankFindColumn(h,['uscite','addebito','addebiti','dare','debit','debits','withdrawal','withdrawals','importo dare','amount debit'],true);
    var credit=bankFindColumn(h,['entrate','accredito','accrediti','avere','credit','credits','deposit','deposits','importo avere','amount credit'],true);
    var amount=bankFindColumn(h,['importo','amount','transaction amount','importo movimento','valore movimento','valore','somma','totale operazione'],true);
    // Non confondere il saldo del conto con l'importo del singolo movimento.
    if(amount>=0 && /saldo|balance/.test(h[amount])) amount=-1;
    var descCols=[];
    ['descrizione completa','causale completa','dettaglio operazione','descrizione','causale','operazione','dettaglio','description','details','beneficiario','controparte','merchant','payee','ordinante'].forEach(function(a){var ix=bankFindColumn(h,[a],true);if(ix>=0&&descCols.indexOf(ix)<0)descCols.push(ix);});
    var status=bankFindColumn(h,['stato','status','stato movimento','esito','booking status'],true);
    var type=bankFindColumn(h,['tipo movimento','tipo operazione','tipologia','segno','movimento dare avere','transaction type','type'],true);
    descCols=descCols.filter(function(ix){return ix!==date&&ix!==debit&&ix!==credit&&ix!==amount&&ix!==status&&ix!==type;});
    var score=(date>=0?3:0)+((debit>=0||credit>=0)?3:0)+(amount>=0?2:0)+(descCols.length?1:0)+(status>=0?1:0);
    if(date<0 || (debit<0&&credit<0&&amount<0)) return null;
    return {date:date,debit:debit,credit:credit,amount:amount,descCols:descCols,status:status,type:type,score:score,headers:h};
  }
  function bankIsPending(status) {
    var s=bankNorm(status);
    if(!s) return false;
    return /autorizzat|pending|in attesa|prenotat|non contabilizzat|da contabilizzare|in lavorazione|sospes|annullat|rifiutat|declined|cancelled|canceled|processing/.test(s);
  }
  function bankDescribe(line, cols) {
    var out=[];
    cols.descCols.forEach(function(ix){var v=String(line[ix]==null?'':line[ix]).trim();if(v&&out.indexOf(v)<0)out.push(v);});
    return out.join(' — ') || 'Movimento bancario';
  }

  // Lettore XLSX locale: non invia il file bancario a server o servizi esterni.
  function bankZipEntryMap(buffer) {
    var bytes = new Uint8Array(buffer), view = new DataView(buffer), eocd = -1;
    for (var p = bytes.length - 22; p >= Math.max(0, bytes.length - 65558); p--) {
      if (view.getUint32(p, true) === 0x06054b50) { eocd = p; break; }
    }
    if (eocd < 0) throw new Error('Il file non sembra un archivio Excel .xlsx valido.');
    var count = view.getUint16(eocd + 10, true), offset = view.getUint32(eocd + 16, true), entries = {};
    for (var i = 0; i < count; i++) {
      if (view.getUint32(offset, true) !== 0x02014b50) throw new Error('Struttura interna Excel non valida.');
      var method = view.getUint16(offset + 10, true), size = view.getUint32(offset + 20, true);
      var nameLen = view.getUint16(offset + 28, true), extraLen = view.getUint16(offset + 30, true);
      var commentLen = view.getUint16(offset + 32, true), localOffset = view.getUint32(offset + 42, true);
      var name = new TextDecoder().decode(bytes.slice(offset + 46, offset + 46 + nameLen));
      var localNameLen = view.getUint16(localOffset + 26, true), localExtraLen = view.getUint16(localOffset + 28, true);
      var dataStart = localOffset + 30 + localNameLen + localExtraLen;
      entries[name] = { method: method, data: bytes.slice(dataStart, dataStart + size) };
      offset += 46 + nameLen + extraLen + commentLen;
    }
    return entries;
  }
  function bankUnzipText(entry) {
    if (!entry) return Promise.resolve('');
    if (entry.method === 0) return Promise.resolve(new TextDecoder('utf-8').decode(entry.data));
    if (entry.method !== 8) return Promise.reject(new Error('Compressione Excel non supportata.'));
    if (typeof DecompressionStream === 'undefined') return Promise.reject(new Error('Questo browser non supporta la lettura Excel offline. Aggiorna Safari o usa Chrome.'));
    var stream = new Blob([entry.data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Response(stream).arrayBuffer().then(function(buf) { return new TextDecoder('utf-8').decode(buf); });
  }
  function bankXml(text) {
    var doc = new DOMParser().parseFromString(text, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('Un foglio Excel contiene XML non valido.');
    return doc;
  }
  function bankNormalizePath(base, target) {
    if (target.charAt(0) === '/') return target.slice(1);
    var parts = base.split('/'); parts.pop();
    target.split('/').forEach(function(part) {
      if (!part || part === '.') return;
      if (part === '..') parts.pop(); else parts.push(part);
    });
    return parts.join('/');
  }
  function readXlsxLocally(buffer) {
    var entries = bankZipEntryMap(buffer);
    return Promise.all([
      bankUnzipText(entries['xl/workbook.xml']),
      bankUnzipText(entries['xl/_rels/workbook.xml.rels']),
      bankUnzipText(entries['xl/sharedStrings.xml'])
    ]).then(function(xmls) {
      if (!xmls[0] || !xmls[1]) throw new Error('Il file Excel non contiene un foglio di lavoro leggibile.');
      var bookDoc = bankXml(xmls[0]), relDoc = bankXml(xmls[1]), shared = [];
      if (xmls[2]) {
        var si = bankXml(xmls[2]).getElementsByTagNameNS('*', 'si');
        for (var siIdx = 0; siIdx < si.length; siIdx++) {
          var ts = si[siIdx].getElementsByTagNameNS('*', 't'), st = '';
          for (var ti = 0; ti < ts.length; ti++) st += ts[ti].textContent || '';
          shared.push(st);
        }
      }
      var rels = {}, relNodes = relDoc.getElementsByTagNameNS('*', 'Relationship');
      for (var ri = 0; ri < relNodes.length; ri++) rels[relNodes[ri].getAttribute('Id')] = relNodes[ri].getAttribute('Target');
      var sheetNodes = bookDoc.getElementsByTagNameNS('*', 'sheet'), jobs = [];
      for (var sh = 0; sh < sheetNodes.length; sh++) {
        var node = sheetNodes[sh], sheetName = node.getAttribute('name') || ('Foglio ' + (sh + 1));
        var rid = node.getAttribute('r:id') || node.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
        var target = rels[rid]; if (!target) continue;
        var path = bankNormalizePath('xl/workbook.xml', target);
        jobs.push(bankUnzipText(entries[path]).then(function(sheetXml) {
          var doc = bankXml(sheetXml), rowNodes = doc.getElementsByTagNameNS('*', 'row'), matrix = [];
          for (var r = 0; r < rowNodes.length; r++) {
            var cells = rowNodes[r].getElementsByTagNameNS('*', 'c'), row = [];
            for (var c = 0; c < cells.length; c++) {
              var cell = cells[c], ref = cell.getAttribute('r') || '', letters = (ref.match(/[A-Z]+/i) || ['A'])[0].toUpperCase(), col = 0;
              for (var li = 0; li < letters.length; li++) col = col * 26 + letters.charCodeAt(li) - 64;
              col--;
              var type = cell.getAttribute('t'), value = '', vNode = cell.getElementsByTagNameNS('*', 'v')[0];
              if (type === 'inlineStr') {
                var inlineTs = cell.getElementsByTagNameNS('*', 't');
                for (var it = 0; it < inlineTs.length; it++) value += inlineTs[it].textContent || '';
              } else if (vNode) {
                value = vNode.textContent || '';
                if (type === 's') value = shared[Number(value)] == null ? '' : shared[Number(value)];
                else if (type !== 'str' && type !== 'b' && value !== '') {
                  var n = Number(value); if (isFinite(n)) value = n;
                }
              }
              row[col] = value;
            }
            matrix.push(row);
          }
          return { name: sheetName, data: matrix };
        }));
      }
      return Promise.all(jobs);
    });
  }
  function importBankSheets(sheetData) {
    var rows = [], diagnostics = [], sheets = 0, amountErrors = [];
    (sheetData || []).forEach(function(sheetInfo) {
      var sheetName = sheetInfo.name, data = sheetInfo.data;
      if (!data || data.length < 2) return;
      var headerAt = -1, cols = null, bestScore = 0;
      for (var ri = 0; ri < Math.min(data.length, 100); ri++) {
        var candidate = bankDetectColumns(data[ri] || []);
        if (candidate && candidate.score > bestScore) { headerAt = ri; cols = candidate; bestScore = candidate.score; }
        if (candidate && candidate.score >= 6) break;
      }
      if (headerAt < 0) { diagnostics.push(sheetName + ': intestazioni non riconosciute'); return; }
      sheets++;
      var amountColumns=[cols.debit,cols.credit,cols.amount].filter(function(c){return c>=0;});
      var locales={};
      amountColumns.forEach(function(c){locales[c]=window.walletProAmountLocale(data.slice(headerAt+1).map(function(row){return row&&row[c];}));});
      for (var r = headerAt + 1; r < data.length; r++) {
        var line = data[r]; if (!line || !line.length) continue;
        var dt = bankDate(line[cols.date], null); if (!dt) continue;
        if (cols.status >= 0 && bankIsPending(line[cols.status])) continue;
        var val = NaN;
        if (cols.debit >= 0 || cols.credit >= 0) {
          var deb = cols.debit >= 0 ? bankNumber(line[cols.debit],locales[cols.debit]) : NaN;
          var cre = cols.credit >= 0 ? bankNumber(line[cols.credit],locales[cols.credit]) : NaN;
          if (isFinite(cre) && Math.abs(cre) > 0) val = Math.abs(cre);
          else if (isFinite(deb) && Math.abs(deb) > 0) val = -Math.abs(deb);
        }
        if (!isFinite(val) && cols.amount >= 0) {
          val = bankNumber(line[cols.amount],locales[cols.amount]);
          if (isFinite(val) && cols.type >= 0) {
            var typ = bankNorm(line[cols.type]);
            if (/uscit|addeb|dare|debit|pagament|withdraw/.test(typ)) val = -Math.abs(val);
            else if (/entrat|accredit|avere|credit|deposit|incass/.test(typ)) val = Math.abs(val);
          }
        }
        if (!isFinite(val) || val === 0) {
          var nonempty=amountColumns.some(function(c){var v=line[c];return v!=null&&String(v).trim()!==''&&String(v).trim()!=='-';});
          if(nonempty && !isFinite(val))amountErrors.push(sheetName+' riga '+(r+1));
          continue;
        }
        rows.push({ date: dt, desc: bankDescribe(line, cols), amount: Math.abs(val), type: val > 0 ? 'income' : 'expense', sheet: sheetName, row: r + 1 });
      }
    });
    if(amountErrors.length){
      bankImportStatus('Importazione bloccata: '+amountErrors.length+' importi non interpretabili con sicurezza ('+amountErrors.slice(0,5).join(', ')+'). Nessun dato modificato.');
      showToast('Importazione Excel bloccata: importi ambigui o non validi.');return;
    }
    if (!rows.length) {
      bankImportStatus('Non ho trovato movimenti. Fogli analizzati: ' + (sheetData || []).length + '. Verifica intestazioni e date.');
      showToast('Nessun movimento riconosciuto nel file Excel.'); return;
    }
    var modeControl = document.getElementById('bankImportMode');
    var mode = modeControl ? modeControl.value : 'both';
    var modeLabel = mode === 'income' ? 'solo entrate' : mode === 'expense' ? 'solo uscite' : 'entrate e uscite';
    var matchingRows = rows.filter(function(x) { return mode === 'both' || (mode === 'income' ? x.type === 'income' : x.type === 'expense'); });
    if (!matchingRows.length) {
      bankImportStatus('Nessun movimento del tipo selezionato (' + modeLabel + ') trovato nel file. Nessun dato modificato.');
      showToast('Nessun movimento da importare per la selezione effettuata.');
      return;
    }
    var keys = Array.isArray(state.bankImportKeys) ? state.bankImportKeys : [], seen = registeredMovementKeys(), duplicatesSkipped = 0;
    matchingRows.forEach(function(x){
      if (x.type === 'income' && salaryKeyFor(x)) {
        var y=Number(x.date.slice(0,4)),m=Number(x.date.slice(5,7))-1;
        if (Math.round(Number((state.monthly[y]||[])[m]||0)*100) === Math.round(x.amount*100) && !(state.bankIncomeEntries||[]).some(function(en){return en.date.slice(0,7)===x.date.slice(0,7);})) seen.add(salaryKeyFor(x));
      }
    });
    var fresh = matchingRows.filter(function(x) {
      var key = [x.date, bankNorm(x.desc), x.amount.toFixed(2), x.type].join('|');
      if (keys.indexOf(key) >= 0 || isRegisteredMovement(x,x.type,seen)) { duplicatesSkipped++; return false; }
      movementKeys(x,x.type).forEach(function(k){seen.add(k);});
      x._key = key; return true;
    });
    if (!fresh.length) { bankImportStatus('0 movimenti aggiunti, ' + duplicatesSkipped + ' duplicati ignorati.'); showToast('0 aggiunti, ' + duplicatesSkipped + ' duplicati ignorati.'); return; }
    var inc = fresh.filter(function(x) { return x.type === 'income'; }), exp = fresh.filter(function(x) { return x.type === 'expense'; });
    var totalIn = inc.reduce(function(a, x) { return a + x.amount; }, 0), totalOut = exp.reduce(function(a, x) { return a + x.amount; }, 0);
    var preview = fresh.slice(0, 10).map(function(x) { return x.date + ' · ' + (x.type === 'income' ? '+' : '-') + fmtEur(x.amount) + ' · ' + (x.type === 'expense' ? bankCategory(x.desc) : (/stipendi|retribuzion|busta paga/i.test(x.desc)?'Stipendio':'Bonifici')) + ' · ' + x.desc; }).join('\n');
    var more = fresh.length > 10 ? '\n… e altri ' + (fresh.length - 10) + ' movimenti' : '';
    var msg = 'Modalità: ' + modeLabel + '.\nAnalisi completata: ' + fresh.length + ' nuovi movimenti riconosciuti in ' + sheets + ' fogli.\nDoppioni esclusi (stessa data, tipo e importo): ' + duplicatesSkipped + '.\nEntrate: ' + inc.length + ' (' + fmtEur(totalIn) + ')\nUscite: ' + exp.length + ' (' + fmtEur(totalOut) + ')\n\n' + preview + more + '\n\nConfermi l’importazione?\nI movimenti in attesa/autorizzati sono esclusi. Le entrate saranno sommate ai totali mensili; le uscite saranno registrate singolarmente.';
    bankShowImportConfirm(msg, async function(accepted, progress) {
      if (!accepted) { bankImportStatus('Importazione annullata: nessun dato modificato.'); return; }
      try {
        var monthlyTotals = {}, newExpenses = [], newIncomes = [], newKeys = [];
        var done=0, total=fresh.length, chunkSize=40;
        // Prepara i movimenti in piccoli blocchi, lasciando Safari libero di aggiornare la barra.
        for(var start=0;start<total;start+=chunkSize){
          fresh.slice(start,start+chunkSize).forEach(function(x){
            if(x.type==='income'){
              var y=Number(x.date.slice(0,4)),m=Number(x.date.slice(5,7))-1,k=y+'-'+m;
              monthlyTotals[k]=(monthlyTotals[k]||0)+x.amount;
              newIncomes.push({date:x.date,amount:x.amount,desc:x.desc,category:/stipendi|retribuzion|busta paga/i.test(x.desc)?'Stipendio':'Bonifici'});
            }else newExpenses.push({date:x.date,category:bankCategory(x.desc),desc:x.desc,amount:x.amount});
            newKeys.push(x._key);
          });
          done=Math.min(start+chunkSize,total);
          progress(done,total,'Elaborazione movimenti');
          await new Promise(function(resolve){setTimeout(resolve,0);});
        }
        progress(total,total,'Salvataggio dati locali');
        await new Promise(function(resolve){setTimeout(resolve,30);});
        // Il salvataggio resta unico: nessun movimento viene inserito durante l'anteprima.
        Object.keys(monthlyTotals).forEach(function(k){var a=k.split('-'),y=Number(a[0]),m=Number(a[1]);if(!state.monthly[y])state.monthly[y]=makeZeroYear();state.monthly[y][m]=(Number(state.monthly[y][m])||0)+monthlyTotals[k];});
        state.expenses.push.apply(state.expenses,newExpenses);
        state.bankIncomeEntries.push.apply(state.bankIncomeEntries,newIncomes);
        state.bankImportKeys=keys.concat(newKeys);
        currentYear=Number(fresh[fresh.length-1].date.slice(0,4));
        saveState();
        progress(total,total,'Aggiornamento schermate');
        await new Promise(function(resolve){setTimeout(resolve,30);});
        syncYearDropdown();renderDashboard();renderSpese();renderEntrate();renderStorico();
        bankImportStatus('Importazione completata ('+modeLabel+'): '+fresh.length+' movimenti aggiunti, '+duplicatesSkipped+' duplicati ignorati.');
        showToast('Importati '+fresh.length+' movimenti; ignorati '+duplicatesSkipped+' duplicati.');
        return true;
      }catch(err){
        bankImportStatus('Errore durante l’importazione: '+(err&&err.message||err));
        showToast('Errore importazione Excel: verifica i dati.');
        throw err;
      }
    });
  }
  // Conferma integrata nell'app: evita popup nativi bloccati da Safari o dal contesto di hosting.
  function bankShowImportConfirm(message, callback) {
    var old = document.getElementById('bankImportConfirmOverlay');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var overlay = document.createElement('div');
    overlay.id = 'bankImportConfirmOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center;padding:18px;';
    var panel = document.createElement('div');
    panel.style.cssText = 'width:min(560px,100%);max-height:85vh;overflow:auto;background:var(--card,#fff);color:var(--text,#222);border:1px solid var(--border,#ddd);border-radius:16px;padding:22px;box-shadow:0 18px 60px rgba(0,0,0,.3);';
    var heading = document.createElement('h3'); heading.textContent = 'Conferma importazione';
    heading.style.cssText = 'margin:0 0 14px;font-size:18px;';
    var body = document.createElement('div'); body.textContent = message;
    body.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;line-height:1.55;';
    var actions = document.createElement('div'); actions.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:20px;';
    var cancel = document.createElement('button'); cancel.type='button'; cancel.textContent='Annulla';
    cancel.style.cssText = 'padding:11px 16px;border:1px solid var(--border,#ccc);border-radius:10px;background:transparent;color:inherit;font-weight:600;cursor:pointer;';
    var accept = document.createElement('button'); accept.type='button'; accept.textContent='Conferma importazione';
    accept.style.cssText = 'padding:11px 16px;border:0;border-radius:10px;background:var(--accent,#2563eb);color:white;font-weight:700;cursor:pointer;';
    var progressWrap=document.createElement('div');
    progressWrap.style.cssText='display:none;margin-top:18px;padding:14px;border-radius:12px;background:var(--pill-bg,#e9f2ff);';
    var progressLabel=document.createElement('div');progressLabel.style.cssText='font-size:14px;font-weight:650;margin-bottom:9px;';
    var progressTrack=document.createElement('div');progressTrack.style.cssText='height:10px;background:var(--border,#ddd);border-radius:12px;overflow:hidden;';
    var progressFill=document.createElement('div');progressFill.style.cssText='height:100%;width:0%;background:var(--blue,#007aff);border-radius:12px;transition:width .1s;';
    progressTrack.appendChild(progressFill);progressWrap.appendChild(progressLabel);progressWrap.appendChild(progressTrack);
    var finished=false;
    function close(result){if(finished)return;finished=true;if(overlay.parentNode)overlay.parentNode.removeChild(overlay);callback(result);}
    function updateProgress(done,total,stage){
      var pct=total?Math.round(done/total*100):0;
      progressLabel.textContent=stage+': '+done+' / '+total+' ('+pct+'%)';
      progressFill.style.width=pct+'%';
    }
    cancel.addEventListener('click',function(){close(false);});
    accept.addEventListener('click',async function(){
      if(finished)return;finished=true;
      accept.disabled=true;cancel.disabled=true;accept.textContent='Importazione in corso…';
      accept.style.opacity='.65';progressWrap.style.display='block';
      updateProgress(0,1,'Preparazione');
      await new Promise(function(resolve){setTimeout(resolve,35);});
      try{await callback(true,updateProgress);}catch(e){console.error('Importazione Excel:',e);}
      if(overlay.parentNode)overlay.parentNode.removeChild(overlay);
    });
    overlay.addEventListener('click',function(ev){if(ev.target===overlay&&!finished)close(false);});
    panel.appendChild(heading);panel.appendChild(body);panel.appendChild(progressWrap);
    actions.appendChild(cancel);actions.appendChild(accept);panel.appendChild(actions);
    overlay.appendChild(panel);document.body.appendChild(overlay);accept.focus();
  }

  function bankImportStatus(message) {
    var el = document.getElementById('bankExcelStatus');
    if (el) { el.textContent = message; el.style.display = 'block'; }
  }

  document.getElementById('btnImportBankExcel').addEventListener('click', function() {
    var picker = document.getElementById('bankExcelInput');
    if (picker) { wpImportProgress('excel','Seleziona il file Excel…',null,false); picker.click(); }
  });
  document.getElementById('bankExcelInput').addEventListener('change', function(e) {
    var file = e.target.files && e.target.files.item(0), input = this;
    if (!file) { wpImportProgress('excel','',null,true); return; }
    wpImportProgress('excel','Lettura e analisi di '+file.name+'…',null,false);
    // Lascia al browser un frame per disegnare la barra prima del parsing.
    var excelStarted=Date.now();
    bankImportStatus('File selezionato: ' + file.name + '. Lettura in corso…');
    new Promise(function(resolve){ requestAnimationFrame(function(){ setTimeout(resolve, 30); }); }).then(function(){ return readFileBuffer(file); }).then(function(buffer) {
      function parseWithSheetJS() {
        return loadXlsxLibrary().then(function(XLSX) {
          // Il file resta nella memoria del browser: SheetJS viene usato solo come lettore di riserva.
          var wb = XLSX.read(buffer, { type: 'array', cellDates: true });
          return (wb.SheetNames || []).map(function(name) {
            return { name: name, data: XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '', raw: true, blankrows: false }) };
          });
        });
      }
      if (/\.xlsx$/i.test(file.name)) {
        bankImportStatus('Lettura locale del file Excel…');
        return readXlsxLocally(buffer).catch(function(localError) {
          bankImportStatus('Lettura locale non supportata da questo browser. Attivo il lettore di compatibilità; i dati restano sul dispositivo…');
          return parseWithSheetJS().catch(function(fallbackError) {
            throw new Error('Lettura Excel non riuscita. Lettore locale: ' +
              (localError && localError.message ? localError.message : 'errore') +
              '. Lettore compatibile: ' +
              (fallbackError && fallbackError.message ? fallbackError.message : 'errore'));
          });
        }).then(function(sheets) {
          wpImportProgress('excel','Analisi di '+sheets.length+' fogli Excel…',null,false);
          bankImportStatus('File letto correttamente. Analisi di ' + sheets.length + ' fogli…');
          importBankSheets(sheets);
        });
      }
      return parseWithSheetJS().then(function(sheets) {
        importBankSheets(sheets);
      });
    }).then(function(){
      wpImportProgress('excel','Lettura Excel completata',1,false);
    }).catch(function(err) {
      wpImportProgress('excel','Errore nella lettura Excel',null,false);
      var message = err && err.message ? err.message : 'Errore durante la lettura del file Excel.';
      bankImportStatus('Errore: ' + message);
      showToast(message);
    }).then(function() {
      input.value = '';
      // Mostra il risultato almeno per un istante, senza bloccare l'anteprima.
      var elapsed=Date.now()-excelStarted;
      setTimeout(function(){ wpImportProgress('excel','',null,true); }, Math.max(1000, 1300-elapsed));
    });
  });

  document.getElementById('btnImportCsv').addEventListener('click', function() { document.getElementById('csvFileInput').click(); });
  document.getElementById('csvFileInput').addEventListener('change', function(e) {
    var f = e.target.files && e.target.files.item(0);
    if (!f) return;
    var r = new FileReader(); r.onload = function(ev) { importIncomeCsvText(ev.target.result || ''); }; r.readAsText(f, 'UTF-8'); this.value = '';
  });

  document.getElementById('btnImportExpCsv').addEventListener('click', function() { document.getElementById('expCsvFileInput').click(); });
  document.getElementById('expCsvFileInput').addEventListener('change', function(e) {
    var f = e.target.files && e.target.files.item(0);
    if (!f) return;
    var r = new FileReader(); r.onload = function(ev) { importExpenseCsvText(ev.target.result || ''); }; r.readAsText(f, 'UTF-8'); this.value = '';
  });

  document.getElementById('btnExportAllCsv').addEventListener('click', function() {
    var lines = ['Tipo;Data;Categoria;Descrizione;Importo'];
    function csvCell(value) {
      var v = String(value == null ? '' : value);
      return /[;\r\n"]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    }
    Object.keys(state.monthly).map(Number).sort().forEach(function(y) {
      (state.monthly[y] || []).forEach(function(v, i) {
        if ((Number(v) || 0) > 0) lines.push(['Entrata', y + '-' + String(i + 1).padStart(2, '0'), 'Stipendio', 'Entrata mensile', Number(v).toFixed(2)].map(csvCell).join(';'));
      });
    });
    state.expenses.forEach(function(ex) {
      lines.push(['Uscita', ex.date, ex.category, ex.desc, Number(ex.amount).toFixed(2)].map(csvCell).join(';'));
    });
    downloadFile('Export_Entrate_Uscite.csv', '\ufeff' + lines.join('\n'), 'text/csv;charset=utf-8;');
  });
  document.getElementById('btnExportCsv').addEventListener('click', function() {
    var lines = ['Anno;Mese;Netto'];
    Object.keys(state.monthly).map(Number).sort().forEach(function(y) {
      (state.monthly[y] || []).forEach(function(v, i) { if ((Number(v) || 0) > 0) lines.push(y + ';' + MONTHS[i] + ';' + Number(v).toFixed(2)); });
    });
    downloadFile('Export_Entrate.csv', lines.join('\n'), 'text/csv;charset=utf-8;');
  });
  document.getElementById('btnExportExpCsv').addEventListener('click', function() {
    var lines = ['Data;Categoria;Descrizione;Importo'];
    state.expenses.forEach(function(ex) { lines.push(ex.date + ';' + ex.category + ';' + ex.desc + ';' + Number(ex.amount).toFixed(2)); });
    downloadFile('Export_Uscite.csv', lines.join('\n'), 'text/csv;charset=utf-8;');
  });

  document.getElementById('btnExportJson').addEventListener('click', function() {
    try { var keys=window.walletProBackup22.snapshot(); window.walletProBackup22.validateKeys(keys); downloadFile('Backup_Wallet_PRO.json',JSON.stringify({format:'walletpro-complete-backup',version:2,createdAt:new Date().toISOString(),keys:keys},null,2),'application/json'); } catch(e){showToast('Backup non riuscito: controlla i dati locali.');}
  });
  document.getElementById('btnImportJson').addEventListener('keydown', function(e) { if(e.key==='Enter'||e.key===' '){e.preventDefault();document.getElementById('jsonFileInput').click();} });
  document.getElementById('jsonFileInput').addEventListener('change', function(e) {
    var f = e.target.files && e.target.files.item(0);
    if (!f) return;
    var r = new FileReader();
    r.onload = function(ev) {
      try {
        var p = JSON.parse(ev.target.result || '{}');
        var keys;
        if(p&&p.format==='walletpro-complete-backup'&&p.version===2&&p.keys){keys=p.keys;}
        else if(window.walletProBackup22.validMain(p)){keys={};keys[STORAGE_KEY]=JSON.stringify(p);}
        else throw Error('Struttura JSON non valida');
        window.walletProBackup22.validateKeys(keys);
        if(!window.confirm('Ripristinare il backup? I dati attuali saranno sostituiti.'))return;
        window.walletProBackup22.restore(keys);
        window.alert('Backup ripristinato. Wallet-PRO verrà ricaricato.');location.reload();
      } catch (err) { showToast('File JSON non valido'); }
    };
    r.readAsText(f, 'UTF-8'); this.value = '';
  });

  // Conferma reset limitata a 15 secondi: nessun pulsante resta armato.
  (function(){
    var trigger=document.getElementById('btnResetAll');
    var overlay=document.getElementById('wpResetOverlay');
    var cancel=document.getElementById('wpResetCancel');
    var confirm=document.getElementById('wpResetConfirm');
    var countdown=document.getElementById('wpResetCountdown');
    var timer=null, deadline=0, armed=false, busy=false;
    function disarm(){
      armed=false;deadline=0;
      if(timer!==null){clearInterval(timer);timer=null;}
      overlay.hidden=true;
      confirm.disabled=false;
    }
    function tick(){
      var left=Math.ceil((deadline-Date.now())/1000);
      if(!armed||left<=0){disarm();return;}
      countdown.textContent='Conferma entro '+left+' secondi, altrimenti l’operazione viene annullata.';
    }
    trigger.addEventListener('click',function(){
      if(busy)return;
      disarm();armed=true;deadline=Date.now()+15000;overlay.hidden=false;tick();
      timer=setInterval(tick,200);cancel.focus();
    });
    cancel.addEventListener('click',disarm);
    overlay.addEventListener('click',function(e){if(e.target===overlay)disarm();});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&armed)disarm();});
    document.addEventListener('visibilitychange',function(){if(document.hidden)disarm();});
    window.addEventListener('pagehide',disarm);
    document.addEventListener('click',function(e){
      if(armed&&e.target.closest&&e.target.closest('.nav-item,.tab-item,[data-view]'))disarm();
    },true);
    confirm.addEventListener('click',function(){
      if(!armed||busy||Date.now()>=deadline){disarm();return;}
      busy=true;confirm.disabled=true;
      try{
        // Solo le chiavi finanziarie di Wallet-PRO, senza cache, SW o push.
        var keys=Object.keys(window.walletProBackup22.snapshot());
        keys.forEach(function(k){localStorage.removeItem(k);});
        if(keys.some(function(k){return localStorage.getItem(k)!==null}))throw Error('Alcuni dati non sono stati cancellati');
        disarm();
        try{sessionStorage.setItem('wp_reset_success_once','1');}catch(e){}
        window.alert('Dati locali azzerati. Wallet-PRO verrà ricaricato.');
        location.reload();
      }catch(err){
        disarm();busy=false;
        window.alert('Azzeramento non completato: '+err.message);
      }
    });
    try{
      if(sessionStorage.getItem('wp_reset_success_once')==='1'){
        sessionStorage.removeItem('wp_reset_success_once');
        setTimeout(function(){showToast('Dati locali Wallet-PRO azzerati correttamente');},600);
      }
    }catch(e){}
  })();
  if ('serviceWorker' in navigator) { navigator.serviceWorker.register('./sw.js').then(function(reg) { return reg.update(); }).catch(function() {}); }

  var _renderDashboard = renderDashboard, _renderSpese = renderSpese, _renderStorico = renderStorico;
  renderDashboard = function(){ _renderDashboard(); translatePage(); };
  renderSpese = function(){ _renderSpese(); translatePage(); };
  renderStorico = function(){ _renderStorico(); translatePage(); };

  loadAll();
  migrateLegacyIncomeRows();
  saveState(); // ripulisce automaticamente i doppioni già presenti
  applyPrefsUI();
  syncYearDropdown();
  renderDashboard();
  renderEntrate();
  refreshExchangeRates();
  translatePage();

  (function checkUrlShortcut() {
    try {
      var params = new URLSearchParams(window.location.search);
      var smsText = params.get('sms');
      var rawUscita = params.get('uscita');
      if (!smsText && !rawUscita) return;

      var amount = NaN;
      var negozio = params.get('negozio') || 'Carta Fineco';
      var categoria = params.get('cat') || 'Altro';

      if (smsText) {
        var impMatch = smsText.match(/Importo:\s*([0-9.,]+)\s*EUR/i);
        if (impMatch && impMatch.length > 1) amount = parseNumberInput(impMatch.pop());
        var perMatch = smsText.match(/per:\s*(.+?)(?:\.\s*Info:|$)/i);
        if (perMatch && perMatch.length > 1) negozio = perMatch.pop().trim();
        var up = negozio.toUpperCase();
        if (/PICCOLO|SI\.DI|CONAD|LIDL|DECO|SUPERMERCATO|IPERCOOP|AUCHAN|CARREFOUR|PENNY|EUROSPIN|MD |DOK|FAMILA|CRAI|SIGMA|SIMPLY|ALIMENTARI/.test(up)) categoria = 'Alimentari';
        else if (/ENEL|FASTWEB|TIM|VODAFONE|WIND|SKY|GAS|ACQUA|TELEPASS|ENI GAS|PLENITUDE|A2A|ACEA|IREN/.test(up)) categoria = 'Casa & Utenze';
        else if (/AGIP|ENI|Q8|ESSO|TAMOIL|IP |DISTRIBUTORE|AUTOSTRADE|TRENITALIA|ITALO|ANAS|PARCHEGGIO/.test(up)) categoria = 'Auto & Trasporti';
        else if (/FARMACIA|PARAFARMACIA|ANALISI|MEDICO|DENTISTA|OSPEDALE/.test(up)) categoria = 'Salute';
        else if (/RISTORANTE|PIZZERIA|MC DONALD|BAR |CAFFE|CINEMA|PUB|TRATTORIA/.test(up)) categoria = 'Tempo Libero';
      } else if (rawUscita) {
        amount = parseNumberInput(rawUscita);
      }

      openModal('uscita');
      if (!isNaN(amount) && amount > 0) document.getElementById('expAmount').value = toDisplayAmount(amount).toFixed(2).replace('.', ',');
      document.getElementById('expDesc').value = negozio;

      var catSelect = document.getElementById('expCategory');
      for (var i = 0; i < catSelect.options.length; i++) {
        if (catSelect.options[i].value.toLowerCase() === categoria.toLowerCase()) { catSelect.selectedIndex = i; break; }
      }

      if (window.history && window.history.replaceState) window.history.replaceState({}, document.title, window.location.pathname);
      showToast('Spesa Fineco rilevata: verifica e salva');
    } catch (e) {}
  })();
})();
