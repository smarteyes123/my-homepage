const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ctx = {window:{}};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../fly/v4/company-info.js'),'utf8'),ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../fly/v4/compositions.js'),'utf8'),ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../fly/v4/layout.js'),'utf8'),ctx);
const F = ctx.window.Flyer;
const data = {name:'テスト物件',price:'10000',area:'50',layout:'2LDK',mode:'residence',points:'',renovation:'',transit:'',managementFee:'10000',repairFee:'5000',otherFee:'0'};
const assets = [
  {id:'p',role:'plan',enabled:true,width:400,height:900,src:'data:image/png;base64,AA==',name:'間取図'},
  ...[.75,1.6,.8,1.2,2.8].map((ratio,i)=>({id:String(i),role:i===0?'exterior':'interior',enabled:true,width:ratio*1000,height:1000,src:'data:image/jpeg;base64,AA==',name:'photo'+i})),
];
test('seven distinct styles use subsets, preserve full floorplan and omit disabled images',()=>{
  const source=[...assets,{...assets[1],id:'disabled',enabled:false}];
  const result=F.create(data,source);
  assert.equal(result.length,7);assert.equal(new Set(result.map(c=>c.id)).size,7);
  for(const c of result) {
    assert.ok(c.photos.length<source.length-1);
    assert.equal(new Set(c.photos.map(a=>a.id)).size,c.photos.length);
    assert.ok(c.photos.every(a=>a.enabled && a.role!=='plan'));
    assert.match(F.render(c),/data-plan="true"[^]*?object-fit:contain/);
  }
});
test('portrait frames favor portrait photos; wide hero frames favor landscape photos',()=>{
  const result=F.create(data,assets);
  assert.ok(result.find(c=>c.id==='architecture').photos[0].width/result.find(c=>c.id==='architecture').photos[0].height<1);
  assert.ok(result.find(c=>c.id==='noir').photos[0].width/result.find(c=>c.id==='noir').photos[0].height>1);
});
test('main photo can be pinned and adjustments remain candidate-specific',()=>{
  const source=assets.map(a=>({...a,primary:a.id==='3'}));const result=F.create(data,source);
  assert.equal(result[3].photos[0].id,'3');
  result[0].adjustments[0]={assetId:'2',fit:'contain',zoom:2};
  assert.equal(Object.keys(result[1].adjustments).length,0);
  assert.match(F.render(result[0]),/object-fit:contain;object-position:50% 50%;transform:scale\(1\)/);
});
test('financial totals distinguish partial costs; yield uses annual rent and万円 correctly',()=>{
  const c=F.create({...data,mode:'investment',annualRent:'3000000',otherFee:''},assets)[0];
  const html=F.render(c);assert.match(html,/表面利回り 3.00%/);assert.match(html,/記載分合計/);assert.match(html,/15,000円/);
});
test('draft-derived text and adjustment values cannot inject HTML',()=>{
  const c=F.create({...data,name:'<script>alert(1)</script>'},assets)[0];
  c.adjustments[0]={fit:'"><script>evil</script>',x:'"><img>',zoom:100};
  const html=F.render(c);assert.ok(!html.includes('<script>'));assert.ok(!html.includes('evil'));assert.ok(!html.includes('scale(100)'));
});
test('a forced floorplan adjustment cannot crop the plan',()=>{
  const c=F.create(data,assets)[0];c.adjustments[99]={fit:'cover',zoom:2,x:0,y:0};
  assert.match(F.frame(c.plan,99,c,true),/object-fit:contain[^]*?transform:scale\(1\)/);
});
test('floorplan proportions change the available columns without cropping the plan',()=>{
  const tall=F.create(data,assets)[0];const wide=F.create(data,assets.map(a=>a.role==='plan'?{...a,width:1600,height:500}:a))[0];
  const columns=(c)=>F.render(c).match(/grid-template-columns:([^\"]+)/)[1];
  assert.notEqual(columns(tall),columns(wide));
});
test('one enabled photograph creates usable candidates without duplicate images',()=>{
  const result=F.create(data,assets.slice(0,2));
  for(const c of result){assert.equal(c.photos.length,1);assert.ok(!F.render(c).includes('写真を追加できます'));}
});

test('all styles retain the same property facts and expose independent visual identities',()=>{
  const result=F.create({...data,address:'東京都テスト',remarks:'確認事項'},assets);
  for(const c of result) {
    const html=F.render(c);
    assert.ok(html.includes('style-'+c.id));
    for(const value of ['テスト物件','10,000','東京都テスト','確認事項','15,000円']) assert.ok(html.includes(value));
  }
});

test('four new families use independent page structures rather than the shared media/details skeleton',()=>{
  const result=F.create(data,assets);
  const layouts=['poster','spread','blueprint','campaign'];
  for(const layout of layouts){
    const c=result.find(c=>c.layout===layout);const html=F.render(c);
    assert.ok(html.includes('c-'+layout));
    assert.ok(!html.includes('class="f-body"'));
    assert.ok(!html.includes('class="f-media"'));
  }
  assert.match(F.render(result.find(c=>c.layout==='poster')),/c-poster-image[^]*c-poster-title/);
  assert.match(F.render(result.find(c=>c.layout==='spread')),/c-spread-left[^]*c-spread-right/);
  assert.match(F.render(result.find(c=>c.layout==='blueprint')),/c-drawing-data[^]*c-drawing-plan[^]*c-drawing-photos/);
  assert.match(F.render(result.find(c=>c.layout==='campaign')),/c-offer[^]*c-campaign-photos[^]*c-campaign-plan/);
});

test('residence style: exterior hero, captioned grid, four point icons, two stations and no duplicated remarks',()=>{
  const d={...data,mode:'investment',annualRent:'1188000',address:'東京都渋谷区宇田川町41-24',transit:'A線「a」駅 徒歩1分\nB線「b」駅 徒歩2分\nC線「c」駅 徒歩3分',points:'一\n二\n三\n四\n五',renovation:'エアコン',remarks:'帖数不明'};
  const c=F.create(d,assets).find(x=>x.id==='residence');
  assert.ok(c);assert.equal(c.photos[0].role,'exterior');
  const html=F.render(c);
  assert.match(html,/class="flyer composition c-residence style-residence"/);
  assert.equal((html.match(/class="c-res-station"/g)||[]).length,2);
  assert.equal((html.match(/<div><svg/g)||[]).length,4);
  assert.ok(!html.includes('五'));
  assert.equal((html.match(/帖数不明/g)||[]).length,1);
  assert.match(html,/data-count="\d"/);
  assert.match(html,/表面利回り/);
  assert.match(html,/data-plan="true"[^]*?object-fit:contain/);
});
test('residence style with a single photo hides the empty grid',()=>{
  const c=F.create(data,assets.slice(0,2)).find(x=>x.id==='residence');
  assert.match(F.render(c),/data-count="0"/);
});

/* 2026-11-18 土地モード */
vm.runInContext(fs.readFileSync(path.join(__dirname,'../fly/v4/land.js'),'utf8'),ctx);
const land = {propertyType:'land',name:'文京区大塚5丁目 土地',price:'3980',tax:'非課税',address:'文京区大塚5丁目',landArea:'14.77',landAreaType:'公簿',rights:'所有権',landCategory:'宅地',terrain:'平坦',pavement:'',roadAccess:'南東側　公道　幅員約5.6m',setback:'無',coverage:'60',far:'300',zoning:'準工業地域',heightDistrict:'第3種（22m）',fireZone:'準防火/新防火',water:'',gas:'',sewage:'',drainage:'',status:'上物有',handover:'相談',transaction:'媒介',remarks:'容積率は前面道路による制限を受けます。\n上物は建ぺい率オーバーの可能性があります。',points:'',transit:'',company:'株式会社スマートアイズ'};
test('land mode adds 土地概要表, mansion mode does not; tsubo truncates like the source sheet',()=>{
  assert.equal(F.create(data,assets).some(c=>c.id==='landsheet'),false);
  const r=F.create(land,assets);assert.equal(r.length,8);
  assert.equal(ctx.window.FlyerLand.tsubo('14.77'),'4.46');assert.equal(F.tsubo('14.77'),'4.46');
  const html=F.render(r.find(c=>c.id==='landsheet'));
  assert.match(html,/14\.77 ㎡（約 4\.46 坪）/);assert.match(html,/坪単価 約 892\.4 万円/);assert.match(html,/区画図/);assert.doesNotMatch(html,/間取り|<figcaption>間取図/);
});
test('land spec table: every row spans 5 columns and each section rowspan matches its rows',()=>{
  const html=ctx.window.FlyerLand.sheet(land,F.escape);
  for(const body of html.match(/<tbody class="ls-group">.*?<\/tbody>/g)){
    const rows=body.match(/<tr>.*?<\/tr>/g);const span=Number(body.match(/rowspan="(\d+)"/)[1]);assert.equal(span,rows.length);
    rows.forEach((row,i)=>{const cells=(row.match(/<t[hd][ >][^>]*>|<t[hd]>/g)||[]).reduce((n,tag)=>n+Number((tag.match(/colspan="(\d+)"/)||[0,1])[1]),0);assert.equal(cells,i===0?5:4);});
  }
});
test('all land styles avoid mansion wording and escape land fields',()=>{
  const r=F.create({...land,zoning:'<img src=x onerror=1>'},assets);
  for(const c of r){const html=F.render(c);assert.doesNotMatch(html,/<img src=x/);assert.doesNotMatch(html,/専有面積|間取り図|間取図をご用意/);}
});
