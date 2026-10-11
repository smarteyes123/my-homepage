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
    const footer = '<footer class="f-footer"><div class="f-brand">SMART EYES</div><div class="f-company">'+e(d.company)+'<small>'+e(d.companyAddress)+'<br>'+e(d.license)+'</small></div><div class="f-contact">'+e(d.phone)+'<small>'+e(d.contact)+'　'+e(d.email)+'</small></div><div class="f-reference"><b>取引態様：'+e(d.transaction)+'</b><br>物件番号 '+e(d.reference || '—')+'<br>情報更新日 '+e(d.updated || '要確認')+'</div></footer>';
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
    } else {
      body = '<div class="c-campaign-heading"><div><span class="c-label">SMART EYES / 販売物件</span>'+title+'</div>'+transit+'</div><div class="c-campaign"><aside class="c-offer">'+price+chips+caption+stories+p.investment+'</aside><div class="c-campaign-photos"><div class="c-campaign-hero">'+photo(0)+'</div><div class="c-campaign-small">'+photo(1)+photo(2)+'</div></div><section class="c-campaign-plan"><p class="c-label">間取り / FLOOR PLAN</p>'+p.plan+'</section></div>'+facts+notes+footer;
    }
    const sample = d.sample?'<div class="f-sample">TEST SAMPLE · 元資料に基づく検証用。販売価格・現況等は未確認です。</div>':'';
    return '<article class="flyer composition c-'+c.layout+' style-'+c.id+'" aria-label="'+e(c.name)+' 物件图面">'+body+sample+'</article>';
  }
  return {render};
})();
