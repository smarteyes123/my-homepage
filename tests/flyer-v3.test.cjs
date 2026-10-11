const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ctx = {window:{}};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../fly/v3/company-info.js'),'utf8'),ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../fly/v3/compositions.js'),'utf8'),ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../fly/v3/layout.js'),'utf8'),ctx);
const F = ctx.window.Flyer;
const data = {name:'テスト物件',price:'10000',area:'50',layout:'2LDK',mode:'residence',points:'',renovation:'',transit:'',managementFee:'10000',repairFee:'5000',otherFee:'0'};
const assets = [
  {id:'p',role:'plan',enabled:true,width:400,height:900,src:'data:image/png;base64,AA==',name:'間取図'},
  ...[.75,1.6,.8,1.2,2.8].map((ratio,i)=>({id:String(i),role:i===0?'exterior':'interior',enabled:true,width:ratio*1000,height:1000,src:'data:image/jpeg;base64,AA==',name:'photo'+i})),
];
test('six distinct styles use subsets, preserve full floorplan and omit disabled images',()=>{
  const source=[...assets,{...assets[1],id:'disabled',enabled:false}];
  const result=F.create(data,source);
  assert.equal(result.length,6);assert.equal(new Set(result.map(c=>c.id)).size,6);
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
