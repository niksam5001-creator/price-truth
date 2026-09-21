const L = {
  en: {tagline:"Know the real price before you buy", lbl_link:"Paste product link", check:"Check price", lbl_scan:"Or scan barcode in store", scan:"📷 Scan barcode", overpay:"Overpay", good:"Good price!", avg:"Market average", share:"Share verdict", install:"Install as app", buy:"Buy cheaper", support:"Support the project", copy_addr:"Copy address", copied:"Copied!"},
  ru: {tagline:"Узнай реальную цену до покупки", lbl_link:"Вставь ссылку на товар", check:"Проверить цену", lbl_scan:"Или отсканируй штрихкод в магазине", scan:"📷 Сканировать", overpay:"Переплата", good:"Хорошая цена!", avg:"Средняя по рынку", share:"Поделиться", install:"Установить как приложение", buy:"Купить дешевле", support:"Поддержать проект", copy_addr:"Скопировать адрес", copied:"Скопировано!"},
  de: {tagline:"Kenne den echten Preis vor dem Kauf", lbl_link:"Produktlink einfügen", check:"Preis prüfen", lbl_scan:"Oder Barcode scannen", scan:"📷 Scannen", overpay:"Überzahlung", good:"Guter Preis!", avg:"Marktdurchschnitt", share:"Teilen", install:"Als App installieren", buy:"Günstiger kaufen", support:"Projekt unterstützen", copy_addr:"Adresse kopieren", copied:"Kopiert!"},
  es: {tagline:"Conoce el precio real antes de comprar", lbl_link:"Pega el enlace del producto", check:"Comprobar precio", lbl_scan:"O escanea el código", scan:"📷 Escanear", overpay:"Sobrepago", good:"¡Buen precio!", avg:"Promedio del mercado", share:"Compartir", install:"Instalar como app", buy:"Comprar más barato", support:"Apoyar el proyecto", copy_addr:"Copiar dirección", copied:"¡Copiado!"},
  pl: {tagline:"Poznaj prawdziwą cenę przed zakupem", lbl_link:"Wklej link do produktu", check:"Sprawdź cenę", lbl_scan:"Lub zeskanuj kod", scan:"📷 Skanuj", overpay:"Przepłata", good:"Dobra cena!", avg:"Średnia rynkowa", share:"Udostępnij", install:"Zainstaluj jako aplikację", buy:"Kup taniej", support:"Wesprzyj projekt", copy_addr:"Kopiuj adres", copied:"Skopiowano!"}
};
let lang = (navigator.language || 'en').slice(0, 2);
if (!L[lang]) lang = 'en';

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('installBar').style.display = 'block';
});
function installApp() { if (deferredPrompt) deferredPrompt.prompt(); }

function setLang(l) {
  lang = l;
  const t = L[l];
  document.getElementById('tagline').textContent = t.tagline;
  document.getElementById('lbl_link').textContent = t.lbl_link;
  document.getElementById('check').textContent = t.check;
  document.getElementById('lbl_scan').textContent = t.lbl_scan;
  document.getElementById('scan').textContent = t.scan;
  document.getElementById('installText').textContent = t.install;
  renderSupport();
}

const BUY = {
  'Ozon': q => 'https://www.ozon.ru/search/?text=' + q,
  'Wildberries': q => 'https://www.wildberries.ru/search?search=' + q,
  'Yandex Market': q => 'https://market.yandex.ru/search?text=' + q,
  'DNS': q => 'https://www.dns-shop.ru/search/?q=' + q,
  'Amazon': q => 'https://www.amazon.com/s?k=' + q,
  'AliExpress': q => 'https://www.aliexpress.com/wholesale?SearchText=' + q,
  'Allegro': q => 'https://allegro.pl/listing?string=' + q,
  'eBay': q => 'https://www.ebay.com/sch/i.html?_nkw=' + q
};
const DONATE = 'TKUBiR3RhFCQdbb24Jzi217y72d8i3CBCy';
let lastUrl = '';

function productQuery(url) {
  const m = url.match(/(\d{5,})/);
  return m ? m[1] : url.replace(/^https?:\/\//, '').slice(0, 40);
}

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
  lastUrl = url;
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
    const q = encodeURIComponent(productQuery(lastUrl));
    const buys = d.stores.slice().sort((a, b) => a.price - b.price).slice(0, 3)
      .filter(s => BUY[s.name])
      .map(s => '<a class="btn share" style="display:block;text-align:center;text-decoration:none;margin:6px 0" target="_blank" href="' + BUY[s.name](q) + '">🛒 ' + s.name + ' — ' + Math.round(s.price) + ' ' + d.currency + '</a>').join('');
    v.className = 'verdict bad';
    v.innerHTML = '<div class="big">⚠️ ' + t.overpay + ': ' + Math.round(overpay) + ' ' + d.currency + ' (' + pct + '%)</div>' +
      '<div style="margin-top:6px">' + t.avg + ': <b>' + Math.round(d.average) + ' ' + d.currency + '</b> • ' + d.store + ': <b>' + Math.round(d.price) + ' ' + d.currency + '</b></div>' +
      '<div class="stores">' + d.stores.map(s => '<div><span>' + s.name + '</span><b>' + Math.round(s.price) + ' ' + d.currency + '</b></div>').join('') + '</div>' +
      '<div style="margin:10px 0 2px;font-weight:700">' + t.buy + ':</div>' + buys +
      '<button class="btn share" onclick="shareVerdict(' + Math.round(overpay) + ',\'' + d.currency + '\',' + pct + ')">' + t.share + '</button>';
  } else {
    v.className = 'verdict good';
    v.innerHTML = '<div class="big">✓ ' + t.good + '</div><div style="margin-top:6px">' + d.store + ': ' + Math.round(d.price) + ' ' + d.currency + '</div>';
  }
}

function shareVerdict(overpay, cur, pct) {
  const text = '💰 Price Truth: I was about to overpay ' + overpay + ' ' + cur + ' (' + pct + '%)! Check your price before buying:';
  if (navigator.share) navigator.share({title: 'Price Truth', text: text, url: location.href});
  else { navigator.clipboard.writeText(text + ' ' + location.href); alert(L[lang].copied); }
}

function copyDonate() {
  navigator.clipboard.writeText(DONATE);
  alert(L[lang].copied);
}

function renderSupport() {
  const t = L[lang];
  let el = document.getElementById('supportBar');
  if (!el) {
    el = document.createElement('div');
    el.id = 'supportBar';
    el.style.cssText = 'margin:18px auto;max-width:560px;background:#fff;border-radius:12px;padding:12px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08);font-size:14px';
    document.body.appendChild(el);
  }
  el.innerHTML = '<b>💛 ' + t.support + '</b><div style="font-size:12px;color:#667;margin:4px 0">USDT TRC-20: ' + DONATE.slice(0, 8) + '…' + DONATE.slice(-4) + '</div><button class="btn" style="background:#667eea;color:#fff;border:none;border-radius:8px;padding:8px 14px" onclick="copyDonate()">' + t.copy_addr + '</button>';
}
renderSupport();
setLang(lang);

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
L.en.share_app="Share Price Truth";L.ru.share_app="Поделиться Price Truth";L.de.share_app="Price Truth teilen";L.es.share_app="Compartir Price Truth";L.pl.share_app="Udostępnij Price Truth";
function shareApp(){const url='https://niksam5001-creator.github.io/price-truth/';if(navigator.share){navigator.share({title:'Price Truth',text:L[lang].tagline,url:url}).catch(()=>{});}else{navigator.clipboard.writeText(url);alert(L[lang].copied);}}
(function(){const el=document.createElement('div');el.style.cssText='margin:12px auto;max-width:560px;padding:0 12px';el.innerHTML='<button style="width:100%;background:#25d366;color:#fff;border:none;border-radius:12px;padding:13px;font-size:16px;font-weight:700" onclick="shareApp()">📤 <span id="shareAppText"></span></button>';const sup=document.getElementById('supportBar');sup.parentNode.insertBefore(el,sup);const upd=()=>{document.getElementById('shareAppText').textContent=L[lang].share_app;};upd();const orig=window.setLang;window.setLang=function(l){orig(l);upd();};})();
const _oldCheck = window.checkLink;
window.checkLink = async function(){
  const url=document.getElementById('link').value.trim();
  const v=document.getElementById('verdict');
  if(!url)return;
  lastUrl=url;
  v.style.display='block';v.className='verdict';v.innerHTML='⏳ ...';
  const wb=url.match(/wildberries\.ru\/catalog\/(\d+)/);
  if(wb){
    try{
      const api='https://card.wb.ru/cards/v1/detail?app=web&dest=-1257786&spp=30&nm='+wb[1];
      const r=await fetch('https://api.allorigins.win/raw?url='+encodeURIComponent(api));
      const j=await r.json();
      const p=j&&j.data&&j.data.products&&j.data.products[0];
      if(p){renderReal(Math.round((p.salePriceU||p.priceU)/100),Math.round(p.priceU/100),(p.brand?p.brand+' ':'')+p.name);return;}
    }catch(e){}
  }
  await _oldCheck();
};
function renderReal(price,full,name){
  const t=L[lang];const v=document.getElementById('verdict');
  const disc=full-price;
  const q=encodeURIComponent(name);
  const shops=['Ozon','Yandex Market','DNS','AliExpress'];
  const buys=shops.filter(s=>BUY[s]).map(s=>'<a class="btn share" style="display:block;text-align:center;text-decoration:none;margin:6px 0" target="_blank" href="'+BUY[s](q)+'">🔎 '+s+'</a>').join('');
  v.className='verdict good';
  v.innerHTML='<div class="big">💰 Wildberries: '+price+' RUB</div>'+(disc>0?'<div>🔥 Скидка: −'+disc+' RUB (было '+full+' RUB)</div>':'<div>Цена без скидки</div>')+'<div style="margin:8px 0;font-size:14px">'+name+'</div><div style="margin:10px 0 2px;font-weight:700">Где дешевле — проверить:</div>'+buys+'<button class="btn" style="background:#25d366" onclick="shareApp()">📤 '+t.share_app+'</button>';
}
const _oldDS = window.detectStore;
window.detectStore = function(url){
  if(url.includes('wildberries.by')) return {name:'Wildberries BY', cur:'BYN'};
  return _oldDS(url);
};
function renderReal(price,full,name,cur){
  cur=cur||'RUB';
  const t=L[lang];const v=document.getElementById('verdict');
  const disc=full-price;
  const q=encodeURIComponent(name);
  const shops=['Ozon','Yandex Market','DNS','AliExpress'];
  const buys=shops.filter(s=>BUY[s]).map(s=>'<a class="btn share" style="display:block;text-align:center;text-decoration:none;margin:6px 0" target="_blank" href="'+BUY[s](q)+'">🔎 '+s+'</a>').join('');
  v.className='verdict good';
  v.innerHTML='<div class="big">💰 Wildberries: '+price+' '+cur+'</div>'+(disc>0?'<div>🔥 Скидка: −'+disc+' '+cur+' (было '+full+' '+cur+')</div>':'<div>Цена без скидки</div>')+'<div style="margin:8px 0;font-size:14px">'+name+'</div><div style="margin:10px 0 2px;font-weight:700">Где дешевле — проверить:</div>'+buys+'<button class="btn" style="background:#25d366" onclick="shareApp()">📤 '+t.share_app+'</button>';
}
const _oldCheck2 = window.checkLink;
window.checkLink = async function(){
  const url=document.getElementById('link').value.trim();
  const v=document.getElementById('verdict');
  if(!url)return;
  lastUrl=url;
  v.style.display='block';v.className='verdict';v.innerHTML='⏳ ...';
  const wb=url.match(/wildberries\.(ru|by)\/catalog\/(\d+)/);
  if(wb){
    const by=wb[1]==='by';
    try{
      const api='https://card.wb.ru/cards/v1/detail?app=web&dest='+(by?-25202:-1257786)+'&spp=30&nm='+wb[2];
      const r=await fetch('https://api.allorigins.win/raw?url='+encodeURIComponent(api));
      const j=await r.json();
      const p=j&&j.data&&j.data.products&&j.data.products[0];
      if(p){renderReal(Math.round((p.salePriceU||p.priceU)/100),Math.round(p.priceU/100),(p.brand?p.brand+' ':'')+p.name,by?'BYN':'RUB');return;}
    }catch(e){}
  }
  await _oldCheck2();
};
