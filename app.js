
const BT = (() => {
  const products = window.BT_PRODUCTS || [];
  const fmt = new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'});
  const cartKey = 'bt_cart_v2';
  let cart = JSON.parse(localStorage.getItem(cartKey)||'[]');

  const iconMap = {
    'Arbeitsbühnen':'🧰','Baggerlöffel & Schaufeln':'🏗️','Betonmischer':'🌀','Business & Industrie':'⚙️',
    'Fahrzeugteile':'🔩','Fördertechnik':'↗️','Gabeln & Greifer':'🦾','Garten & Sonstiges':'🌿',
    'Kommunaltechnik':'🧹','Mähwerke & Mulcher':'🌾','Tanktechnik':'⛽','Tanktechnik / Heimwerker':'🛢️','Tierbedarf':'🐄'
  };

  function priceText(p){
    if(p.priceMin==null) return 'Preis auf Anfrage';
    if(p.priceMax && p.priceMax>p.priceMin) return `${fmt.format(p.priceMin)} – ${fmt.format(p.priceMax)}`;
    return fmt.format(p.priceMin);
  }
  function productVisual(p){
    if(p.image){
      return `<div class="product-visual has-image"><small>Nr. ${p.id}</small><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="fallback-icon" style="display:none">${iconMap[p.category]||'⚙️'}</span></div>`;
    }
    return `<div class="product-visual"><small>Nr. ${p.id}</small><span>${iconMap[p.category]||'⚙️'}</span></div>`;
  }
  function card(p){
    return `<article class="product-card">
      ${productVisual(p)}
      <div class="product-info">
        <span class="product-cat">${esc(p.category)}</span>
        <h3>${esc(p.name)}</h3>
        ${p.description ? `<p class="product-desc">${esc(p.description)}</p>` : ''}
        <div class="price">${priceText(p)}<small>Preisangabe freibleibend</small></div>
        <div class="product-actions">
          <button class="btn ghost" onclick="BT.openProduct(${p.id})">Details</button>
          <button class="btn primary" onclick="BT.add(${p.id})">Merken</button>
        </div>
      </div>
    </article>`;
  }
  function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
  function save(){localStorage.setItem(cartKey,JSON.stringify(cart));renderCart();}
  function add(id){if(!cart.includes(id))cart.push(id);save();openCart();}
  function remove(id){cart=cart.filter(x=>x!==id);save();}
  function clearCart(){cart=[];save();}
  function openCart(){document.getElementById('cartDrawer')?.classList.add('open');document.getElementById('backdrop')?.classList.add('show');}
  function closeCart(){document.getElementById('cartDrawer')?.classList.remove('open');document.getElementById('backdrop')?.classList.remove('show');}
  function renderCart(){
    const count=document.getElementById('cartCount'); if(count)count.textContent=cart.length;
    const box=document.getElementById('cartItems'); if(!box)return;
    const chosen=cart.map(id=>products.find(p=>p.id===id)).filter(Boolean);
    box.innerHTML=chosen.length?chosen.map(p=>`<div class="cart-item"><b>${esc(p.name)}</b><small>${esc(p.category)} · ${priceText(p)}</small><button onclick="BT.remove(${p.id})">Entfernen</button></div>`).join(''):'<p>Noch keine Produkte vorgemerkt.</p>';
    const total=chosen.reduce((s,p)=>s+(p.priceMin||0),0);
    const totalEl=document.getElementById('cartTotal'); if(totalEl)totalEl.textContent=fmt.format(total)+(chosen.length?' ab':'');
    const area=document.getElementById('selectedProducts');
    if(area) area.value=chosen.map(p=>`Nr. ${p.id}: ${p.name} (${priceText(p)})`).join('\n');
  }
  function openProduct(id){
    const p=products.find(x=>x.id===id); if(!p)return;
    const modal=document.getElementById('productModal'), content=document.getElementById('modalContent'); if(!modal||!content)return;
    const modalVisual = p.image
      ? `<div class="modal-product-image"><img src="${esc(p.image)}" alt="${esc(p.name)}"></div>`
      : `<div class="modal-product-icon">${iconMap[p.category]||'⚙️'}</div>`;
    const details = p.technicalDetails
      ? `<div class="tech-text">${esc(p.technicalDetails).replace(/\n/g,'<br>')}</div>`
      : `<p>Für technische Daten, Aufnahme, Lieferzeit und Versandkosten erstellen wir Ihnen ein konkretes Angebot für die gewünschte Ausführung.</p>`;
    content.innerHTML=`${modalVisual}
      <span class="product-cat">${esc(p.category)}</span><h2>${esc(p.name)}</h2>
      ${p.description ? `<p class="modal-description">${esc(p.description)}</p>` : ''}
      <div class="price">${priceText(p)}</div>
      <div class="spec-list">
        <div><small>Produkt-Nr.</small><b>${p.id}</b></div>
        <div><small>Kategorie</small><b>${esc(p.category)}</b></div>
        <div><small>Preis von</small><b>${p.priceMin!=null?fmt.format(p.priceMin):'auf Anfrage'}</b></div>
        <div><small>Preis bis</small><b>${p.priceMax!=null?fmt.format(p.priceMax):'auf Anfrage'}</b></div>
      </div>
      ${details}
      <button class="btn primary large" onclick="BT.add(${p.id});BT.closeProduct()">Zur Anfrage hinzufügen</button>`;
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
  }
  function closeProduct(){const m=document.getElementById('productModal');if(m){m.classList.remove('open');m.setAttribute('aria-hidden','true');}}
  function toggleMenu(){document.getElementById('mainMenu')?.classList.toggle('open');}
  function prepareMail(e){
    e.preventDefault();
    const d=new FormData(e.target);
    const subject=encodeURIComponent('Anfrage über btmaschinenwelt.de');
    const body=encodeURIComponent(
      `Firma: ${d.get('company')||''}\nName: ${d.get('name')||''}\nE-Mail: ${d.get('email')||''}\nTelefon: ${d.get('phone')||''}\nLieferort: ${d.get('location')||''}\nTrägerfahrzeug: ${d.get('carrier')||''}\nAufnahme: ${d.get('mount')||''}\n\nProdukte:\n${d.get('products')||'keine Auswahl'}\n\nNachricht:\n${d.get('message')||''}`
    );
    location.href=`mailto:btmaschinenwelt@gmail.com?subject=${subject}&body=${body}`;
  }

  function initShop(){
    const grid=document.getElementById('shopGrid'); if(!grid)return;
    const cat=document.getElementById('categoryFilter'), search=document.getElementById('searchInput'), sort=document.getElementById('sortSelect');
    [...new Set(products.map(p=>p.category))].sort().forEach(c=>cat.insertAdjacentHTML('beforeend',`<option value="${esc(c)}">${esc(c)}</option>`));
    const params=new URLSearchParams(location.search); if(params.get('cat'))cat.value=params.get('cat');
    let page=1; const perPage=24;
    function render(){
      let arr=products.filter(p=>p.active!==false);
      const q=(search.value||'').trim().toLowerCase();
      if(q)arr=arr.filter(p=>(p.name+' '+p.category).toLowerCase().includes(q));
      if(cat.value)arr=arr.filter(p=>p.category===cat.value);
      if(sort.value==='priceAsc')arr.sort((a,b)=>(a.priceMin??Infinity)-(b.priceMin??Infinity));
      else if(sort.value==='priceDesc')arr.sort((a,b)=>(b.priceMin??-1)-(a.priceMin??-1));
      else arr.sort((a,b)=>a.name.localeCompare(b.name,'de'));
      const maxPage=Math.max(1,Math.ceil(arr.length/perPage)); if(page>maxPage)page=maxPage;
      const chunk=arr.slice((page-1)*perPage,page*perPage); grid.innerHTML=chunk.map(card).join('');
      document.getElementById('resultCount').textContent=`${arr.length} Produkte`;
      const pag=document.getElementById('pagination'); pag.innerHTML='';
      if(maxPage>1){
        for(let i=1;i<=maxPage;i++){const b=document.createElement('button');b.textContent=i;b.className=i===page?'active':'';b.onclick=()=>{page=i;render();scrollTo({top:grid.offsetTop-130,behavior:'smooth'})};pag.appendChild(b);}
      }
    }
    [search,cat,sort].forEach(el=>el.addEventListener(el===search?'input':'change',()=>{page=1;render()})); render();
  }
  function initFeatured(){
    const el=document.getElementById('featuredProducts'); if(!el)return;
    const featuredIds=[5,158,163,185,188,190,194,197];
    el.innerHTML=featuredIds.map(id=>products.find(p=>p.id===id && p.active!==false)).filter(Boolean).slice(0,8).map(card).join('');
  }
  document.addEventListener('DOMContentLoaded',()=>{renderCart();initShop();initFeatured();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeCart();closeProduct();}});
  return {add,remove,clearCart,openCart,closeCart,openProduct,closeProduct,toggleMenu,prepareMail};
})();
