/* 土地概要表（土地専用構図）。2026-11-18｜本地 Qwen3.8-27B 初稿，Claude Opus 5.5 审改：分区间距、照片撑满。 */
window.FlyerLand = (() => {
  function tsubo(landArea) {
    const n = Number(landArea);
    if (!isFinite(n) || n <= 0) return '';
    return (Math.floor(n * 0.3025 * 100 + 1e-9) / 100).toFixed(2); // 坪は小数第2位未満切り捨て（業界慣行）
  }

  function sheet(d, e) {
    const v = (x) => (x && String(x).trim() ? e(x) : '—');
    const pct = (x) => (x && String(x).trim() ? e(x) + ' %' : '—');
    const area = d.landArea && String(d.landArea).trim() ? d.landArea : '';
    const areaVal = area
      ? e(area) + ' ㎡（約 ' + tsubo(area) + ' 坪）'
      : '—';
    const remarks = (d.remarks || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const remarksHtml = remarks.length
      ? remarks.map((s) => '・' + e(s)).join('<br>')
      : '—';

    return (
      '<table class="land-sheet">' +
      '<colgroup><col class="ls-c1"><col class="ls-c2"><col class="ls-c3"><col class="ls-c4"><col class="ls-c5"></colgroup>' +
      '<tbody class="ls-group">' +
      '<tr><th class="ls-sec" rowspan="1">住所</th><td class="ls-addr" colspan="4">' + v(d.address) + '</td></tr>' +
      '</tbody>' +
      '<tbody class="ls-gap"><tr><td colspan="5"></td></tr></tbody>' +
      '<tbody class="ls-group">' +
      '<tr><th class="ls-sec" rowspan="5">土地</th>' +
      '<th class="ls-k">面積<small>（' + e(d.landAreaType || '公簿') + '）</small></th>' +
      '<td colspan="3">' + areaVal + '</td></tr>' +
      '<tr><th class="ls-k">権利</th><td>' + v(d.rights) + '</td><th class="ls-k">地目</th><td>' + v(d.landCategory) + '</td></tr>' +
      '<tr><th class="ls-k">地勢</th><td>' + v(d.terrain) + '</td><th class="ls-k">舗装</th><td>' + v(d.pavement) + '</td></tr>' +
      '<tr><th class="ls-k">接道</th><td colspan="3">' + v(d.roadAccess) + '</td></tr>' +
      '<tr><th class="ls-k">セットバック</th><td colspan="3">' + v(d.setback) + '</td></tr>' +
      '</tbody>' +
      '<tbody class="ls-gap"><tr><td colspan="5"></td></tr></tbody>' +
      '<tbody class="ls-group">' +
      '<tr><th class="ls-sec" rowspan="5">制限</th>' +
      '<th class="ls-k">建ぺい率</th><td>' + pct(d.coverage) + '</td><th class="ls-k">容積率</th><td>' + pct(d.far) + '</td></tr>' +
      '<tr><th class="ls-k">用途地域</th><td colspan="3">' + v(d.zoning) + '</td></tr>' +
      '<tr><th class="ls-k">高度地区</th><td>' + v(d.heightDistrict) + '</td><th class="ls-k">防火指定</th><td>' + v(d.fireZone) + '</td></tr>' +
      '<tr><th class="ls-k">都市計画</th><td>' + v(d.cityPlan) + '</td><th class="ls-k">地区計画</th><td>' + v(d.districtPlan) + '</td></tr>' +
      '<tr><th class="ls-k">計画道路</th><td>' + v(d.plannedRoad) + '</td><th class="ls-k">区画整理</th><td>' + v(d.landReadjust) + '</td></tr>' +
      '</tbody>' +
      '<tbody class="ls-gap"><tr><td colspan="5"></td></tr></tbody>' +
      '<tbody class="ls-group">' +
      '<tr><th class="ls-sec" rowspan="2">設備</th>' +
      '<th class="ls-k">水道</th><td>' + v(d.water) + '</td><th class="ls-k">ガス</th><td>' + v(d.gas) + '</td></tr>' +
      '<tr><th class="ls-k">汚水</th><td>' + v(d.sewage) + '</td><th class="ls-k">雑排水</th><td>' + v(d.drainage) + '</td></tr>' +
      '</tbody>' +
      '<tbody class="ls-gap"><tr><td colspan="5"></td></tr></tbody>' +
      '<tbody class="ls-group">' +
      '<tr><th class="ls-sec" rowspan="2">引渡</th>' +
      '<th class="ls-k">現況</th><td colspan="3">' + v(d.status) + '</td></tr>' +
      '<tr><th class="ls-k">時期</th><td colspan="3">' + v(d.handover) + '</td></tr>' +
      '</tbody>' +
      '<tbody class="ls-gap"><tr><td colspan="5"></td></tr></tbody>' +
      '<tbody class="ls-group">' +
      '<tr><th class="ls-sec" rowspan="1">備考</th><td class="ls-remarks" colspan="4">' + remarksHtml + '</td></tr>' +
      '</tbody>' +
      '</table>'
    );
  }

  function render(c, p) {
    const d = c.data;
    const e = p.escape;
    const v = (x) => (x && String(x).trim() ? e(x) : '—');

    const price = p.price || '要確認';
    const priceNum = Number(d.price);
    const ts = tsubo(d.landArea);
    const unit = priceNum > 0 && Number(ts) > 0 ? (priceNum / Number(ts)).toFixed(1) : '';

    const photos = p.photos || [];
    const row1 = photos[0] || p.plan || '';
    const hasSecond = !!photos[1];
    const row2 =
      '<div class="ls-plan"><p class="ls-tab">区画図</p>' + p.plan + '</div>' +
      (hasSecond ? '<div class="ls-photo2">' + photos[1] + '</div>' : '');

    const transit = (d.transit || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);
    const transitHtml = transit.length
      ? '<p class="ls-transit">' + transit.map((s) => e(s)).join('<br>') + '</p>'
      : '';

    const footer = window.FlyerCompany ? window.FlyerCompany.render(d, e) : '';
    const sample = d.sample
      ? '<div class="f-sample">TEST SAMPLE · 元資料に基づく検証用。販売価格・現況等は未確認です。</div>'
      : '';

    return (
      '<article class="flyer composition c-landsheet style-landsheet" aria-label="土地概要">' +
      '<header class="ls-head">' +
      '<div class="ls-head-l">' +
      '<p class="c-label">土地販売 / LAND FOR SALE</p>' +
      '<h1 class="f-title">' + v(d.name) + '</h1>' +
      (d.catchCopy ? '<p class="c-caption">' + e(d.catchCopy) + '</p>' : '') +
      '</div>' +
      '<div class="ls-head-r">' +
      '<div class="f-price"><small>販売価格</small><strong>' + e(price) + '</strong><b>' + (d.price ? '万円' : '') + '</b><em>' + e(d.tax) + '</em></div>' +
      (unit ? '<p class="ls-unit">坪単価 約 ' + unit + ' 万円</p>' : '') +
      '</div>' +
      '</header>' +
      '<div class="ls-body">' +
      '<section class="ls-media">' +
      '<div class="ls-media-top">' + row1 + '</div>' +
      '<div class="ls-media-bottom">' + row2 + '</div>' +
      transitHtml +
      '</section>' +
      '<aside class="ls-spec">' +
      sheet(d, e) +
      '<p class="f-note">' + p.note + '</p>' +
      '</aside>' +
      '</div>' +
      footer +
      sample +
      '</article>'
    );
  }

  return { tsubo, sheet, render };
})();
