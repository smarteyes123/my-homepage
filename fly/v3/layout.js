/* Deterministic layouts: floorplans remain intact; photos prefer compatible frames. */
window.Flyer = (() => {
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = (value) => Number(value || 0).toLocaleString('ja-JP');
  const definitions = [
    {id:'classic',layout:'balanced',name:'日式销售图面',description:'蓝色标题、红色售价、带底色的规格表，适合信息完整的销售资料。',count:4},
    {id:'noir',layout:'hero',name:'黑金私邸',description:'深色底、金色细线与明朝体标题，突出高级住宅气质。',count:3},
    {id:'editorial',layout:'minimal',name:'奶油杂志',description:'暖白纸色、衬线大标题、宽留白与叙述式卖点。',count:1},
    {id:'architecture',layout:'portrait',name:'现代建筑',description:'大号无衬线标题、竖向画廊、灰褐色分区与不对称构图。',count:2},
    {id:'renovation',layout:'balanced',name:'清新翻新',description:'青绿标题横幅、珊瑚色价格卡、分区设备清单，明亮鲜活。',count:4},
    {id:'estate',layout:'hero',name:'白金经典',description:'明朝体、细金框、居中的正式标题与端正参数表。',count:3},
  ];
  const groups = [
    ['所在地・土地',[['address','所在地'],['rights','権利'],['landArea','敷地面積','㎡'],['share','共有持分'],['zoning','用途地域']]],
    ['建物',[['area','専有面積','㎡（壁芯）'],['balcony','バルコニー','㎡'],['layout','間取り'],['structure','構造'],['scale','規模'],['floor','所在階'],['buildDate','築年月'],['units','総戸数','戸'],['developer','分譲会社'],['builder','施工会社']]],
    ['管理・費用',[['manager','管理会社'],['managementStyle','管理形態'],['managementFee','管理費','円 / 月',true],['repairFee','修繕積立金','円 / 月',true],['otherFee','その他費用','円 / 月',true]]],
    ['設備・引渡',[['direction','向き'],['parking','駐車場'],['status','現況'],['handover','引渡'],['transaction','取引態様']]],
  ];
  function frame(asset, index, candidate, plan=false) {
    if (!asset) return `<div class="${plan?'plan-frame':'photo-frame'}"><div class="${plan?'plan-placeholder':'photo-placeholder'}">${plan?'間取図をご用意ください':'写真を追加できます'}</div></div>`;
    const raw = candidate.adjustments[index] || {};
    const clamp = (v,min,max,fallback) => Number.isFinite(Number(v)) ? Math.max(min,Math.min(max,Number(v))) : fallback;
    const o = {assetId:raw.assetId,fit:['cover','contain'].includes(raw.fit)?raw.fit:null,x:clamp(raw.x,0,100,50),y:clamp(raw.y,0,100,50),zoom:clamp(raw.zoom,1,2,1)};
    const actual = candidate.assets.find((a) => a.id === o.assetId) || asset;
    const isPlan = plan || actual.role === 'plan';
    const targets = {balanced:[.9,.9,.9,.9],portrait:[.55,.55],hero:[1.6,.8,.8],minimal:[.95]};
    const target = targets[candidate.layout || candidate.id]?.[index] || 1;
    const retained = Math.min((actual.width/actual.height)/target,target/(actual.width/actual.height));
    const fit = isPlan ? 'contain' : (o.fit || (retained < .55 ? 'contain':'cover'));
    return `<figure class="photo-frame ${isPlan?'plan-frame':''}" data-slot="${index}" data-plan="${isPlan}" data-asset="${escape(actual.id)}"><img src="${escape(actual.src)}" alt="${escape(actual.label || actual.name)}" style="object-fit:${fit};object-position:${o.x ?? 50}% ${o.y ?? 50}%;transform:scale(${fit==='contain'?1:o.zoom || 1});transform-origin:${o.x}% ${o.y}%"><figcaption>${escape(actual.label || ({exterior:'外観',interior:'室内',common:'共用部分',plan:'間取図'}[actual.role]))}</figcaption></figure>`;
  }
  function selectPhotos(assets, definition) {
    const remaining = assets.filter((a) => a.enabled && a.role !== 'plan');
    const targets = {balanced:[.9,.9,.9,.9],portrait:[.55,.55],hero:[1.6,.8,.8],minimal:[.95]};
    const selected = [];
    for(const [i,target] of targets[definition.layout || definition.id].entries()) {
      if(!remaining.length) break;
      const role = (definition.layout || definition.id)==='balanced' && i===0 ? 'exterior' : i===0 || ((definition.layout || definition.id)==='balanced' && i<3) ? 'interior' : null;
      const score = (a) => {
        const retained = Math.min((a.width/a.height)/target,target/(a.width/a.height));
        const roleBonus = role ? (a.role===role?1.1:0) : selected.some((p)=>p.role===a.role)?0:.3;
        const contentBonus = /リビング|living|客厅|洋室/.test(a.label || a.name) ? .5 : /ダイニング|室内|bedroom|卧室/.test(a.label || a.name) ? .35 : 0;
        const mainBonus = i===0 && a.primary ? 2 : 0;
        return retained + roleBonus + contentBonus + mainBonus;
      };
      const best = remaining.reduce((a,b)=>score(b)>score(a)?b:a);
      selected.push(best);remaining.splice(remaining.indexOf(best),1);
    }
    return selected;
  }
  function create(data, assets) {
    return definitions.map((definition) => ({...definition,data:{...data},assets,photos:selectPhotos(assets,definition),plan:assets.find((a)=>a.role==='plan' && a.enabled),adjustments:{}}));
  }
  function media(c) {
    const photo = (i)=>frame(c.photos[i],i,c);
    const plan = frame(c.plan,99,c,true);
    if((c.layout || c.id)==='balanced') return `<div class="photo-grid">${c.photos.length?c.photos.map((_,i)=>photo(i)).join(''):photo(0)}</div>${plan}`;
    if((c.layout || c.id)==='portrait') return `${photo(0)}${c.photos.length>1?photo(1):''}${plan}`;
    if((c.layout || c.id)==='hero') return `<div class="hero-photos">${photo(0)}${c.photos.length>1?'<div class="photo-grid">'+c.photos.slice(1).map((_,i)=>photo(i+1)).join('')+'</div>':''}</div>${plan}`;
    return `${photo(0)}${plan}`;
  }
  function details(data) {
    return groups.map(([title,fields])=>{
      const rows=fields.filter(([key])=>data[key]!=='' && data[key]!=null).map(([key,label,unit='',numeric])=>`<div class="detail-row"><dt>${label}</dt><dd>${escape(numeric?money(data[key]):data[key])}${key==='area'?'㎡（'+escape(data.areaType || '測定方法要確認')+'）':unit}</dd></div>`);
      if(title==='管理・費用') {
        const total = ['managementFee','repairFee','otherFee'].reduce((sum,k)=>sum+Number(data[k]||0),0);
        if(['managementFee','repairFee','otherFee'].some((k)=>data[k]!=='')) rows.push(`<div class="detail-row"><dt>${['managementFee','repairFee','otherFee'].every((k)=>data[k]!=='' && data[k]!=null)?'月額合計':'記載分合計'}</dt><dd>${money(total)}円 / 月</dd></div>`);
      }
      return rows.length?`<section class="detail-section"><h3>${title}</h3><dl>${rows.join('')}</dl></section>`:'';
    }).join('') + (data.remarks?`<section class="detail-section"><h3>備考</h3><p class="detail-note">${escape(data.remarks)}</p></section>`:'');
  }
  function story(title,text) {
    if(!text.trim()) return '';
    return `<section><h3>${title}</h3><ul>${text.split('\n').map(s=>s.trim()).filter(Boolean).map((s)=>`<li>${escape(s)}</li>`).join('')}</ul></section>`;
  }
  function render(c) {
    const d=c.data;
    const investment=d.mode==='investment' && Number(d.annualRent)>0 && Number(d.price)>0;
    const yieldValue=investment?(Number(d.annualRent)/(Number(d.price)*10000)*100).toFixed(2):'';
    const dense=groups.flatMap(([,fields])=>fields).filter(([key])=>d[key]!=='' && d[key]!=null).length>=25;
    const planRatio=c.plan?Math.max(.45,Math.min(1.65,c.plan.width/c.plan.height)):1;
    const photoRatio=c.photos[0]?Math.max(.6,Math.min(1.4,c.photos[0].width/c.photos[0].height)):1;
    const columns=(c.layout || c.id)==='portrait'?(c.photos.length>1?'.6fr .6fr ':'.7fr ')+planRatio+'fr':(c.layout || c.id)==='minimal'?photoRatio+'fr '+planRatio+'fr':((c.layout || c.id)==='hero'?'1.05fr ':'1fr ')+planRatio+'fr';
    const price=d.price?money(d.price):'要確認';
    return `<article class="flyer ${c.layout || c.id} style-${c.id} ${dense?'dense':''}" aria-label="${escape(c.name)} 物件图面"><header class="f-top"><div><p class="f-kicker">SMART EYES / ${investment?'INVESTMENT':'RESIDENCE'}</p><h1 class="f-title">${escape(d.name)}<span>${escape(d.room)}</span></h1></div><div class="f-price"><small>販売価格</small><strong>${price}</strong><b>${d.price?'万円':''}</b><em>${escape(d.tax)}</em></div></header>
      <div class="f-meta"><strong>${escape(d.layout)} · ${escape(d.area)}㎡</strong><span>${escape(d.transit).replace(/\n/g,'　 /　 ')}</span></div>
      ${d.catchCopy?`<p class="f-caption">${escape(d.catchCopy)}</p>`:''}
      <div class="f-body"><div class="f-left"><div class="f-media" style="grid-template-columns:${columns}">${media(c)}</div>
      ${(d.points || d.renovation)?`<div class="f-story">${story('PROPERTY HIGHLIGHTS',d.points)}${story('設備・リフォーム',d.renovation)}</div>`:''}
      ${investment?`<div class="f-investment"><strong>表面利回り ${yieldValue}%</strong>年間賃料 ${money(d.annualRent)}円　${escape(d.lease)}<small>表面利回りは年間賃料÷販売価格。税金・管理費等の控除前です。将来の賃料収入を保証するものではありません。</small></div>`:''}
      <p class="f-note">※図面と現況が異なる場合は現況を優先します。写真に写る家具・備品等の販売対象については別途ご確認ください。</p></div><aside class="f-details">${details(d)}</aside></div>
      <footer class="f-footer"><div class="f-brand">SMART<br>EYES</div><div class="f-company">${escape(d.company)}<small>${escape(d.companyAddress)}<br>${escape(d.license)}</small></div><div class="f-contact">${escape(d.phone)}<small>${escape(d.contact)}　${escape(d.email)}</small></div><div class="f-reference"><b>取引態様：${escape(d.transaction)}</b><br>物件番号 ${escape(d.reference || '—')}<br>情報更新日 ${escape(d.updated || '要確認')}</div></footer>
      ${d.sample?'<div class="f-sample">TEST SAMPLE · 元資料に基づくレイアウト検証用。販売価格・現況等は未確認です。</div>':''}</article>`;
  }
  return {escape,definitions,create,render,frame};
})();
