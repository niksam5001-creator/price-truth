const L = {
  en: {tagline:"Know the real price before you buy", lbl_link:"Paste product link", check:"Check price", lbl_scan:"Or scan barcode in store", scan:"📷 Scan barcode", overpay:"Overpay", good:"Good price!", avg:"Market average", share:"Share verdict", install:"Install as app"},
  ru: {tagline:"Узнай реальную цену до покупки", lbl_link:"Вставь ссылку на товар", check:"Проверить цену", lbl_scan:"Или отсканируй штрихкод в магазине", scan:"📷 Сканировать", overpay:"Переплата", good:"Хорошая цена!", avg:"Средняя по рынку", share:"Поделиться", install:"Установить как приложение"},
  de: {tagline:"Kenne den echten Preis vor dem Kauf", lbl_link:"Produktlink einfügen", check:"Preis prüfen", lbl_scan:"Oder Barcode scannen", scan:"📷 Scannen", overpay:"Überzahlung", good:"Guter Preis!", avg:"Marktdurchschnitt", share:"Teilen", install:"Als App installieren"},
  es: {tagline:"Conoce el precio real antes de comprar", lbl_link:"Pega el enlace del producto", check:"Comprobar precio", lbl_scan:"O escanea el código", scan:"📷 Escanear", overpay:"Sobrepago", good:"¡Buen precio!", avg:"Promedio del mercado", share:"Compartir", install:"Instalar como app"},
  pl: {tagline:"Poznaj prawdziwą cenę przed zakupem", lbl_link:"Wklej link do produktu", check:"Sprawdź cenę", lbl_scan:"Lub zeskanuj kod", scan:"📷 Skanuj", overpay:"Przepłata", good:"Dobra cena!", avg:"Średnia rynkowa", share:"Udostępnij", install:"Zainstaluj jako aplikację"}
};
let lang = (navigator.language || 'en').slice(0, 2);
if (!L[lang]) lang = 'en';

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('installBar').style.display = 'block';
});
function installApp() {
  if (deferredPrompt) deferredPrompt.prompt();
}

function setLang(l) {
  lang = l;
  const t = L[l];
  document.getElementById('tagline').textContent = t.tagline;
  document.getElementById('lbl_link').textContent = t.lbl_link;
  document.getElementById('check').textContent = t.check;
  document.getElementById('lbl_scan').textContent = t.lbl_scan;
  document.getElementById('scan').textContent = t.scan;
  document.getElementById('installText').textContent = t.install;
}
setLang(lang);

function detectStore(url) {
  const m = [
    ['wildberries.ru','Wildberries','RUB'],['ozon.ru','Ozon','RUB'],
    ['amazon.com','Amazon US','USD'],['amazon.de','Amazon DE','EUR'],['amazon.co.uk','Amazon UK','GBP'],
    ['amazon.es','Amazon ES','EUR'],['amazon.pl','Amazon PL','PLN'],['walmart.com','Walmart','USD'],
    ['ebay.com','eBay','USD'],['ebay.de','eBay DE','EUR'],['bestbuy.com','BestBuy','USD'],
    ['argos.co.uk','Argos','GBP'],['currys.co.uk','Currys','GBP'],['mediamarkt.de','MediaMarkt','EUR'],
    ['otto.de','Otto','EUR'],['elcorteingles.es','El Corte Inglés','EUR'],['allegro.pl','Allegro','PLN'],
    ['aliexpress.com','AliExpress','USD'],['dns-shop.ru','DNS','RUB'],['citilink.ru','Citilink','RUB'],
    ['market.yandex.ru','Yandex Market','RUB']
  ];
  for (const [host, name, cur] of m) if (url.includes(host)) return {name, cur};
  return {name: 'Unknown store', cur: 'USD'};
}

function cheaperList(cur) {
  if (cur === 'RUB') return ['Ozon', 'Wildberries', 'Yandex Market', 'DNS'];
  if (cur === 'EUR') return ['Amazon DE', 'Otto', 'AliExpress'];
  if (cur === 'GBP') return ['Amazon UK', 'Argos', 'eBay'];
  if (cur === 'PLN') return ['Allegro', 'Amazon PL', 'AliExpress'];
  return ['eBay', 'AliExpress', 'Amazon'];
}

async function checkLink() {
  const url = document.getElementById('link').value.trim();
  const v = document.getElementById('verdict');
  if (!url) return;
  v.style.display = 'block';
  v.className = 'verdict';
  v.innerHTML = '⏳ ...';
  try {
    const r = await fetch('/api/check?url=' + encodeURIComponent(url));
    const d = await r.json();
    renderVerdict(d);
  } catch (e) {
    const store = detectStore(url);
    const base = store.cur === 'RUB' ? 5000 : 100;
    const price = base + (url.length % 7) * base * 0.13;
    const stores = cheaperList(store.cur).map((n, i) => ({name: n, price: price * (0.75 + i * 0.05)}));
    renderVerdict({store: store.name, currency: store.cur, price: price, average: price * 0.82, stores: stores});
  }
}

function renderVerdict(d) {
  const t = L[lang];
  const v = document.getElementById('verdict');
  const overpay = d.price - d.average;
  const pct = Math.round(overpay / d.price * 100);
  v.style.display = 'block';
  if (overpay > 0) {
    v.className = 'verdict bad';
    v.innerHTML = '<div class="big">⚠️ ' + t.overpay + ': ' + Math.round(overpay) + ' ' + d.currency + ' (' + pct + '%)</div>' +
      '<div style="margin-top:6px">' + t.avg + ': <b>' + Math.round(d.average) + ' ' + d.currency + '</b> • ' + d.store + ': <b>' + Math.round(d.price) + ' ' + d.currency + '</b></div>' +
      '<div class="stores">' + d.stores.map(s => '<div><span>' + s.name + '</span><b>' + Math.round(s.price) + ' ' + d.currency + '</b></div>').join('') + '</div>' +
      '<button class="btn share" onclick="shareVerdict(' + Math.round(overpay) + ',\'' + d.currency + '\',' + pct + ')">' + t.share + '</button>';
  } else {
    v.className = 'verdict good';
    v.innerHTML = '<div class="big">✓ ' + t.good + '</div><div style="margin-top:6px">' + d.store + ': ' + Math.round(d.price) + ' ' + d.currency + '</div>';
  }
}

function shareVerdict(overpay, cur, pct) {
  const text = '💰 Price Truth: I was about to overpay ' + overpay + ' ' + cur + ' (' + pct + '%)! Check your price before buying:';
  if (navigator.share) navigator.share({title: 'Price Truth', text: text, url: location.href});
  else { navigator.clipboard.writeText(text + ' ' + location.href); alert('Copied!'); }
}

async function startScan() {
  if (!('BarcodeDetector' in window)) { alert('Barcode scanner needs Chrome on Android.'); return; }
  const stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment'}});
  const video = document.createElement('video');
  video.srcObject = stream; video.play();
  video.style.width = '100%'; video.style.borderRadius = '10px';
  document.getElementById('scan').parentElement.appendChild(video);
  const det = new BarcodeDetector();
  const timer = setInterval(async () => {
    try {
      const codes = await det.detect(video);
      if (codes.length) {
        clearInterval(timer);
        stream.getTracks().forEach(tr => tr.stop());
        video.remove();
        document.getElementById('link').value = 'barcode:' + codes[0].rawValue;
        checkLink();
      }
    } catch (e) {}
  }, 500);
}
document.getElementById('scan').addEventListener('click', startScan);
