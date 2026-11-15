/* Independent page structures share facts and image controls, not a single page skeleton. */
window.FlyerComposition = (() => {
  /** Render one physical A4 page with the composition's own reading order. */
  function render(c, p) {
    const d = c.data;
    const e = p.escape;
    const title = '<h1 class="f-title">'+e(d.name)+'<span>'+e(d.room)+'</span></h1>';
    const price = '<div class="f-price"><small>販売価格</small><strong>'+p.price+'</strong><b>'+ (d.price?'万円':'') +'</b><em>'+e(d.tax)+'</em></div>';
    const transit = '<p class="c-transit">'+e(d.transit).replace(/\n/g,'<br>')+'</p>';
    const caption = d.catchCopy?'<p class="c-caption">'+e(d.catchCopy)+'</p>':'';
    const chips = '<div class="c-chips"><span><b>'+e(d.layout)+'</b>間取り</span><span><b>'+e(d.area)+'<small>㎡</small></b>専有面積</span><span><b>'+e(d.floor || d.room)+'</b>所在階</span></div>';
    const footer = window.FlyerCompany.render(d,e);
    const notes = '<p class="f-note">'+p.note+'</p>';
    const facts = '<section class="f-details c-facts">'+p.details+'</section>';
    const stories = '<div class="f-story">'+p.story+'</div>';
    const photo = (i) => p.photos[i] || '';
    let body;
    if (c.layout === 'poster') {
      body = '<div class="c-poster-stage"><div class="c-poster-image">'+photo(0)+'<div class="c-poster-title"><p class="c-label">SMART EYES / RESIDENCE COLLECTION</p>'+title+caption+'</div></div><aside class="c-poster-panel">'+price+chips+'<div class="c-plan">'+p.plan+'</div>'+transit+'</aside></div><div class="c-poster-story">'+stories+p.investment+'</div>'+facts+notes+footer;
    } else if (c.layout === 'spread') {
      body = '<div class="c-masthead"><b>SMART EYES JOURNAL</b><span>RESIDENCE / '+e(d.reference || 'PROPERTY')+'</span></div><div class="c-spread"><section class="c-spread-left"><div class="c-spread-heading"><span class="c-issue">暮らしを、ここから。</span>'+title+caption+'</div><div class="c-spread-photo">'+photo(0)+'</div><div class="c-spread-summary">'+price+chips+'</div></section><section class="c-spread-right"><div class="c-spread-plan"><div class="c-plan">'+p.plan+'</div><div class="c-spread-story"><b class="c-number">01</b><p class="c-label">SPACE & LIFESTYLE</p>'+stories+p.investment+transit+'</div></div><div class="c-spread-details">'+photo(1)+photo(2)+'</div></section></div>'+facts+notes+footer;
    } else if (c.layout === 'blueprint') {
      body = '<div class="c-drawing-header"><b>SMART EYES / RESIDENTIAL PLAN</b><span>物件番号 '+e(d.reference || '—')+'</span></div><div class="c-blueprint"><aside class="c-drawing-data">'+title+price+chips+transit+facts+p.investment+'</aside><section class="c-drawing-plan"><div class="c-dimension c-dimension-top">'+e(d.layout)+' / '+e(d.area)+'㎡</div><div class="c-plan">'+p.plan+'</div><div class="c-dimension">FLOOR PLAN · '+e(d.room)+'</div></section><aside class="c-drawing-photos">'+photo(0)+photo(1)+'</aside></div><div class="c-drawing-story">'+caption+stories+'</div>'+notes+footer;
    } else if (c.layout === 'residence') {
      const lines = (s) => String(s || '').split('\n').map((v) => v.trim()).filter(Boolean);
      const svg = (inner) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">'+inner+'</svg>';
      const train = svg('<circle cx="12" cy="12" r="11"/><rect x="7" y="5" width="10" height="11" rx="2"/><path d="M7 11h10M9 19l-1-3M15 19l1-3"/>');
      const icons = [
        svg('<path d="M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>'),
        svg('<rect x="4" y="3" width="16" height="18"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M11 21v-3h2v3"/>'),
        svg('<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>'),
        svg('<rect x="5" y="10" width="14" height="11" rx="1.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.3"/>'),
      ];
      const stations = lines(d.transit).slice(0,2).map((t) => '<div class="c-res-station">'+train+'<span>'+e(t)+'</span></div>').join('');
      const feats = lines(d.points).slice(0,4).map((t,i) => '<div>'+icons[i]+'<span>'+e(t)+'</span></div>').join('');
      const grid = p.photos.slice(1);
      const kind = d.mode === 'investment' ? '販売物件（賃貸中・オーナーチェンジ）' : '販売物件';
      const extras = lines(d.renovation).map((t) => '<li>'+e(t)+'</li>').join('');
      const remarks = (extras || d.remarks) ? '<div class="c-res-remarks"><h3>備考</h3>'+(extras?'<ul>'+extras+'</ul>':'')+(d.remarks?'<p>'+e(d.remarks).replace(/\n/g,'<br>')+'</p>':'')+'</div>' : '';
      body = '<div class="c-res"><section class="c-res-left"><div class="c-res-hero">'+photo(0)+'<div class="c-res-title"><p class="c-label">'+kind+'</p>'+title+'</div></div><section class="f-details c-res-facts">'+p.detailsCore+'</section></section>'
        + '<section class="c-res-right"><div class="c-res-bar">'+price+(d.address?'<div class="c-res-address"><small>所在地</small>'+e(d.address)+'</div>':'')+stations+'</div>'
        + '<div class="c-res-main"><div class="c-res-mid">'+caption+(feats?'<div class="c-res-feats">'+feats+'</div>':'')+p.investment+'<div class="c-res-grid" data-count="'+grid.length+'">'+grid.map((_,i) => photo(i+1)).join('')+'</div>'+notes+'</div>'
        + '<aside class="c-res-plancol"><p class="c-res-tab">間取り図</p><div class="c-plan">'+p.plan+'</div>'+remarks+'</aside></div></section></div>'+footer;
    } else {
      body = '<div class="c-campaign-heading"><div><span class="c-label">SMART EYES / 販売物件</span>'+title+'</div>'+transit+'</div><div class="c-campaign"><aside class="c-offer">'+price+chips+caption+stories+p.investment+'</aside><div class="c-campaign-photos"><div class="c-campaign-hero">'+photo(0)+'</div><div class="c-campaign-small">'+photo(1)+photo(2)+'</div></div><section class="c-campaign-plan"><p class="c-label">間取り / FLOOR PLAN</p>'+p.plan+'</section></div>'+facts+notes+footer;
    }
    const sample = d.sample?'<div class="f-sample">TEST SAMPLE · 元資料に基づく検証用。販売価格・現況等は未確認です。</div>':'';
    return '<article class="flyer composition c-'+c.layout+' style-'+c.id+'" aria-label="'+e(c.name)+' 物件图面">'+body+sample+'</article>';
  }
  return {render};
})();
