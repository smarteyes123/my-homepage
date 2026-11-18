(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const e = Flyer.escape;
  const mansionSchema = [
    ['基本信息',[
      ['name','物件名称','text',true],['room','房号 / 楼层'],['mode','资料类型','select',['residence:自住 / 普通买卖','investment:投资 / 出租中']],
      ['price','售价（万円）','number'],['tax','税标注','select',['税込:税込','非課税:非課税','税区分要確認:待确认']],['layout','户型'],['area','专有面积（㎡）','number'],['areaType','面积测量方式','select',['壁芯:壁芯','内法:内法','測定方法要確認:待确认']],['catchCopy','一句话卖点','text',true],['transit','交通（每行一条）','textarea',true],
    ]],
    ['所在地与建筑',[
      ['address','所在地','text',true],['rights','土地权利'],['landArea','敷地面积（㎡）','number'],['share','共有持分'],['zoning','用途地域'],['structure','结构'],['scale','总楼层 / 地下层'],['floor','所在楼层'],['buildDate','建造年月'],['units','总户数','number'],['balcony','阳台面积（㎡）','number'],['direction','朝向'],['developer','分售公司','text',true],['builder','施工公司','text',true],
    ]],
    ['管理与交付',[
      ['manager','管理公司','text',true],['managementStyle','管理方式'],['managementFee','管理费（円/月）','number'],['repairFee','修缮积立金（円/月）','number'],['otherFee','其他费用（円/月）','number'],['parking','停车场'],['status','现况'],['handover','交付时间'],['transaction','交易形态','select',['媒介:媒介','売主:売主','代理:代理','一般媒介:一般媒介']],['remarks','备注','textarea',true],
    ]],
    ['卖点与投资信息',[
      ['points','核心卖点（最多 4 行，每行 36 字）','textarea',true],['renovation','设备 / 装修（最多 4 行，每行 36 字）','textarea',true],['annualRent','年租金（円）','number'],['lease','租约期限 / 条件','text',true],
    ]],
    ['公司与资料日期',[
      ['company','公司名称','text',true],['companyAddress','公司地址','text',true],['license','许可编号','text',true],['phone','电话'],['fax','传真'],['contact','担当者'],['email','邮箱','text',true],['companyWebsite','公司网站','text',true],['reference','物件编号'],['updated','资料更新日期'],
    ]],
  ];
  const companyGroup = mansionSchema[mansionSchema.length-1];
  const landSchema = [
    ['基本信息',[
      ['name','物件名称','text',true],['price','售价（万円）','number'],['tax','税标注','select',['非課税:非課税（土地）','税込:税込','税区分要確認:待确认']],['address','所在地','text',true],['catchCopy','一句话卖点','text',true],['transit','交通（每行一条）','textarea',true],
    ]],
    ['土地',[
      ['landArea','土地面积（㎡）','number'],['landAreaType','面积依据','select',['公簿:公簿','実測:実測','私道負担含む:私道負担含む']],['rights','权利'],['landCategory','地目'],['terrain','地势'],['pavement','铺装'],['roadAccess','接道（例：南東側 公道 幅員約5.6m）','text',true],['setback','セットバック'],
    ]],
    ['法令限制',[
      ['coverage','建蔽率（%）','number'],['far','容积率（%）','number'],['zoning','用途地域'],['heightDistrict','高度地区'],['fireZone','防火指定'],['cityPlan','都市计划'],['districtPlan','地区计划'],['plannedRoad','计划道路'],['landReadjust','区画整理'],
    ]],
    ['设备',[
      ['water','水道'],['gas','燃气'],['sewage','污水'],['drainage','杂排水'],
    ]],
    ['交付与备注',[
      ['status','现况'],['handover','交付时间'],['transaction','交易形态','select',['媒介:媒介','売主:売主','代理:代理','一般媒介:一般媒介']],['points','核心卖点（最多 4 行，每行 36 字）','textarea',true],['remarks','备注（每行一条）','textarea',true],
    ]],
    companyGroup,
  ];
  const TYPES = {mansion:{label:'区分マンション',schema:mansionSchema,required:['name','area','layout'],planName:'户型图'},land:{label:'土地',schema:landSchema,required:['name','landArea'],planName:'区画图'}};
  let propertyType = 'mansion', store = {};
  const schemaOf = () => TYPES[propertyType].schema;
  const allFields = () => schemaOf().flatMap(([,fields])=>fields);
  const defaults = {mode:'residence',landAreaType:'公簿',areaType:'測定方法要確認',tax:'税区分要確認',rights:'所有権',transaction:'媒介',company:'株式会社スマートアイズ',companyAddress:'〒160-0023 東京都新宿区西新宿7-3-10 山京ビル401',license:'東京都知事(1)第112700号',phone:'03-5358-9289',fax:'03-5358-9296',companyWebsite:'https://www.smarteyes.co.jp',email:'info@smarteyes.co.jp'};
  let assets = [], candidates = [], chosen = 0, sample = false, dirty = false, activeSlot = null, activeAdjustment = null;
  function notice(text, reveal=false) { $('notice').hidden = false; $('notice').textContent = text; if(reveal) $('notice').scrollIntoView({behavior:'smooth',block:'center'}); }
  const typeSwitch = () => `<div class="type-switch" role="radiogroup" aria-label="物件属性"><span>物件属性</span>${Object.entries(TYPES).map(([k,t])=>`<label><input type="radio" name="propertyType" value="${k}" ${k===propertyType?'checked':''}>${t.label}</label>`).join('')}</div>`;
  function renderFields() {
    $('fields').innerHTML = typeSwitch() + schemaOf().map(([title,fields],gi) => `<details class="field-group" ${gi===0?'open':''}><summary>${title}</summary><div class="field-grid">${fields.map(([key,label,type='text',options]) => {
    const attrs = `id="field-${key}" name="${key}"`;
    let input;
    if(type==='select') input=`<select ${attrs}>${options.map((v)=>{const [value,text]=v.split(':');return `<option value="${e(value)}">${e(text)}</option>`;}).join('')}</select>`;
    else if(type==='textarea') input=`<textarea ${attrs} maxlength="${['points','renovation'].includes(key)?160:key==='remarks'?140:180}"></textarea>`;
    else input=`<input ${attrs} type="${type}" ${type==='number'?'min="0" step="any"':'maxlength="'+(key==='name'?30:key==='catchCopy'?56:80)+'"'} ${TYPES[propertyType].required.includes(key)?'required':''}>`;
    return `<label class="field ${options===true || type==='textarea'?'wide':''}">${label}${input}</label>`;
  }).join('')}</div></details>`).join('');
    document.querySelectorAll('.plan-name').forEach((el)=>{el.textContent=TYPES[propertyType].planName;});
  }
  function typeDefaults(type) { return type==='land'?{tax:'非課税'}:{tax:'税区分要確認'}; }
  function setData(data) { allFields().forEach(([key])=>{const v=data[key] ?? defaults[key] ?? ''; $(`field-${key}`).value=v; if($(`field-${key}`).tagName==='SELECT' && $(`field-${key}`).value!==String(v))$(`field-${key}`).selectedIndex=0;}); }
  function switchType(type) {
    const prev=readData();store={...store,...prev,['tax@'+propertyType]:prev.tax};
    propertyType=TYPES[type]?type:'mansion';renderFields();
    setData({...store,tax:store['tax@'+propertyType] ?? typeDefaults(propertyType).tax});renderAssets();
  }
  renderFields();
  setData(defaults);
  $('fields').addEventListener('change',(event)=>{if(event.target.name==='propertyType'){switchType(event.target.value);markDirty();}});
  function markDirty(){dirty=true;notice('资料或图片已修改，请重新生成方案后导出。');}
  $('propertyForm').addEventListener('input',markDirty);
  $('sampleFlag').addEventListener('change',()=>{sample=$('sampleFlag').checked;markDirty();});
  function readData() { const data=Object.fromEntries(new FormData($('propertyForm'))); data.propertyType=propertyType; data.sample=sample; return data; }
  function imageLoad(src) { return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('图片读取失败'));img.src=src;}); }
  async function normalizeImage(file) {
    const url=URL.createObjectURL(file);
    try {
      const img=await imageLoad(url); const ratio=Math.min(1,2200/Math.max(img.width,img.height));
      const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*ratio);canvas.height=Math.round(img.height*ratio);
      const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
      const src=canvas.toDataURL('image/jpeg',.91);
      return {id:crypto.randomUUID(),name:file.name,src,original:src,width:canvas.width,height:canvas.height,role:'interior',label:'',enabled:true,trimmed:false};
    } finally { URL.revokeObjectURL(url); }
  }
  function renderAssets() {
    $('photoList').innerHTML=assets.map((a)=>`<div class="asset" data-id="${e(a.id)}"><img src="${e(a.src)}" alt="${e(a.name)}"><div><p class="asset-name" title="${e(a.name)}">${e(a.name)}</p><select aria-label="${e(a.name)} 图片类型" data-action="role">${[['interior',propertyType==='land'?'现地 / 周边':'室内'],['exterior',propertyType==='land'?'现地外观':'外观'],['common','共用 / 周边'],['plan',TYPES[propertyType].planName]].map(([v,t])=>`<option value="${v}" ${a.role===v?'selected':''}>${t}</option>`).join('')}</select><input class="asset-label" data-action="label" aria-label="图片说明" placeholder="图片说明，例如：リビング" maxlength="30" value="${e(a.label)}"><p class="asset-meta">${a.width} × ${a.height} · ${a.width>a.height?'横图':'竖图'}</p><div class="asset-options"><label><input type="checkbox" data-action="enabled" ${a.enabled?'checked':''}>参与排版</label><button data-action="primary">${a.primary?'★ 主图':'设为主图'}</button><button data-action="trim">${a.trimmed?'恢复白边':'去白边'}</button><button data-action="remove">移除</button></div></div></div>`).join('');
  }
  async function trimAsset(a) {
    if(a.trimmed) { const im=await imageLoad(a.original);Object.assign(a,{src:a.original,width:im.width,height:im.height,trimmed:false});return; }
    const im=await imageLoad(a.src), canvas=document.createElement('canvas');canvas.width=im.width;canvas.height=im.height;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0);const p=ctx.getImageData(0,0,im.width,im.height).data;
    let left=im.width,top=im.height,right=0,bottom=0;
    for(let y=0;y<im.height;y++) for(let x=0;x<im.width;x++) {const i=(y*im.width+x)*4;if(p[i]<245 || p[i+1]<245 || p[i+2]<245){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}}
    if(right<=left || bottom<=top) {notice('这张图片没有可识别的内容，已保留原图。');return;}
    const pad=12;left=Math.max(0,left-pad);top=Math.max(0,top-pad);right=Math.min(im.width-1,right+pad);bottom=Math.min(im.height-1,bottom+pad);
    const out=document.createElement('canvas');out.width=right-left+1;out.height=bottom-top+1;out.getContext('2d').drawImage(im,left,top,out.width,out.height,0,0,out.width,out.height);
    Object.assign(a,{src:out.toDataURL('image/jpeg',.95),width:out.width,height:out.height,trimmed:true});
  }
  $('photoInput').addEventListener('change',async(event)=>{
    const files=[...event.target.files];$('generateButton').disabled=true;
    try {
      for(const file of files) {if(!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>20*1024*1024){notice(`${file.name} 未添加：请选择不超过 20 MB 的 JPG / PNG / WebP。`);continue;} assets.push(await normalizeImage(file));}
      renderAssets();dirty=true;notice('图片已添加。请指定户型图和外观，取消勾选不想使用的照片。');
    } catch(error) {notice(error.message);} finally {$('generateButton').disabled=false;event.target.value='';}
  });
  $('photoList').addEventListener('change',(event)=>{const row=event.target.closest('.asset');if(!row)return;const a=assets.find((a)=>a.id===row.dataset.id);if(event.target.dataset.action==='role')a.role=event.target.value;else if(event.target.dataset.action==='label')a.label=event.target.value;else a.enabled=event.target.checked;dirty=true;notice('素材选择已更新，重新生成可更新所有风格。');});
  $('photoList').addEventListener('click',async(event)=>{
    const action=event.target.dataset.action;if(!['trim','remove','primary'].includes(action))return;
    const a=assets.find((a)=>a.id===event.target.closest('.asset').dataset.id);
    try {if(action==='primary'){const primary=!a.primary;assets.forEach((v)=>v.primary=false);a.primary=primary;}else if(action==='remove')assets=assets.filter((v)=>v!==a);else await trimAsset(a);renderAssets();dirty=true;notice('素材已更新。去白边只修改副本，可随时恢复；重新生成可更新方案。');}catch(error){notice(error.message);}
  });
  function scaleSheets() { document.querySelectorAll('.candidate-view,.selected-view').forEach((view)=>{const sheet=view.querySelector('.scaled-sheet');if(!sheet)return;const scale=view.clientWidth/(297*96/25.4);sheet.style.transform=`scale(${scale})`;view.style.height=`${210*96/25.4*scale}px`;}); }
  const observer=new ResizeObserver(scaleSheets);
  function watchSheets() {observer.disconnect();document.querySelectorAll('.candidate-view,.selected-view').forEach((v)=>observer.observe(v));scaleSheets();}
  function card(c,i) {return `<article class="candidate ${i===chosen?'active':''}"><div class="candidate-top"><h3>${String(i+1).padStart(2,'0')} · ${c.name}</h3><small>${c.photos.length} 张照片 + ${c.plan?TYPES[propertyType].planName:'待补'+TYPES[propertyType].planName}</small></div><div class="candidate-view"><div class="scaled-sheet">${Flyer.render(c)}</div></div><div class="candidate-bottom"><p>${c.description}</p><button class="secondary" data-choose="${i}">${i===chosen?'已选中':'选择 / 放大'}</button></div></article>`;}
  function renderResults() {
    $('gallery').innerHTML=candidates.map(card).join('');$('emptyState').hidden=true;$('selection').hidden=false;$('resultCount').textContent=candidates.length+' 个风格';
    $('selectedTitle').textContent=candidates[chosen].name;
    $('selectedPreview').innerHTML=`<div class="selected-view"><div class="scaled-sheet">${Flyer.render(candidates[chosen])}</div></div>`;
    $('printMount').innerHTML=Flyer.render(candidates[chosen]);watchSheets();applyQuality();
  }
  function generate() {
    if(!$('propertyForm').reportValidity())return;
    const data=readData();
    for(const [,fields] of schemaOf()) for(const [key,label,type='text'] of fields) {
      const input=$(`field-${key}`);
      if(type==='number' && data[key]!=='' && (!Number.isFinite(Number(data[key])) || Number(data[key])<0)){notice(`${label} 需要填写有效的非负数字。`);return;}
      if(input.maxLength>0 && data[key].length>input.maxLength){notice(`${label} 超过 ${input.maxLength} 字，请精简后生成。`);return;}
    }
    for(const key of ['points','renovation'].filter((k)=>k in data)) {const lines=data[key].split('\n').filter((s)=>s.trim());if(lines.length>4 || lines.some((s)=>s.length>36)){notice('卖点和设备 / 装修各最多 4 行，每行最多 36 字。请精简后重新生成，避免图面溢出。');return;}}
    if(!assets.some((a)=>a.enabled && a.role==='plan')){notice(`请添加或指定一张${TYPES[propertyType].planName}后生成。`);return;}
    if(!assets.some((a)=>a.enabled && a.role!=='plan')){notice('请至少选择一张照片参与排版。');return;}
    candidates=Flyer.create(data,assets);dirty=false;chosen=0;renderResults();
    const plan=assets.filter((a)=>a.enabled && a.role==='plan');
    notice(`已生成 ${candidates.length} 个独立风格。${plan.length>1?'使用第一张已启用户型图；可在选中方案中点击户型图替换。':''}点击「选择 / 放大」比较，再点击照片微调。${sample?' 当前是未核实的测试资料。':''}`);
    return true;
  }
  $('generateButton').addEventListener('click',generate);
  $('gallery').addEventListener('click',(event)=>{const button=event.target.closest('[data-choose]');if(!button)return;chosen=Number(button.dataset.choose);renderResults();$('selection').scrollIntoView({behavior:'smooth',block:'start'});});
  $('selectedPreview').addEventListener('click',(event)=>{
    const frame=event.target.closest('[data-slot]');if(!frame)return;
    activeSlot=Number(frame.dataset.slot);const c=candidates[chosen];
    activeAdjustment={assetId:frame.dataset.asset,x:50,y:50,zoom:1,fit:frame.querySelector('img').style.objectFit,...c.adjustments[activeSlot]};
    const plan=frame.dataset.plan==='true';
    $('replacement').innerHTML=c.assets.filter((a)=>a.enabled && (plan?a.role==='plan':a.role!=='plan')).map((a)=>`<option value="${e(a.id)}">${e(a.label || a.name)}</option>`).join('');$('replacement').value=activeAdjustment.assetId;
    $('fitMode').value=plan?'contain':activeAdjustment.fit;$('fitMode').disabled=plan;
    for(const [id,key] of [['cropX','x'],['cropY','y'],['cropZoom','zoom']])$(id).value=activeAdjustment[key];
    const bounds=frame.getBoundingClientRect();$('cropPreview').dataset.ratio=String(bounds.width/bounds.height);
    updateCrop();$('cropDialog').showModal();
  });
  function updateCrop() {
    if(!activeAdjustment)return;
    activeAdjustment={assetId:$('replacement').value,fit:$('fitMode').value,x:Number($('cropX').value),y:Number($('cropY').value),zoom:Number($('cropZoom').value)};
    const intact=activeAdjustment.fit==='contain';['cropX','cropY','cropZoom'].forEach((id)=>{$(id).disabled=intact;});
    const c=candidates[chosen], a=c.assets.find((a)=>a.id===activeAdjustment.assetId);
    const preview={...c,adjustments:{...c.adjustments,[activeSlot]:activeAdjustment}};
    const ratio=Number($('cropPreview').dataset.ratio);const width=Math.min(390,235*ratio),height=width/ratio;
    $('cropPreview').innerHTML=`<div class="flyer" style="width:100%;height:100%;padding:0;display:flex;align-items:center;justify-content:center">${Flyer.frame(a,activeSlot,preview,activeSlot===99)}</div>`;
    const frame=$('cropPreview').querySelector('.photo-frame');frame.style.width=`${width}px`;frame.style.height=`${height}px`;
  }
  ['replacement','fitMode','cropX','cropY','cropZoom'].forEach((id)=>$(id).addEventListener('input',updateCrop));
  $('applyCrop').addEventListener('click',()=>{candidates[chosen].adjustments[activeSlot]={...activeAdjustment};$('cropDialog').close();renderResults();});
  /* PDF quality: only the print copy (#printMount) gets downscaled images, so the preview and drafts keep the originals. Ctrl+P uses the same copy. */
  const QUALITY={high:null,medium:{photo:1400,plan:1800,q:.82},low:{photo:900,plan:1300,q:.7}};
  const scaledCache=new Map();let qualityRun=0,qualityReady=Promise.resolve();
  async function downscale(src,max,q){
    const key=max+'|'+q+'|'+src.length+'|'+src.slice(-48);if(scaledCache.has(key))return scaledCache.get(key);
    const img=await imageLoad(src);const ratio=Math.min(1,max/Math.max(img.width,img.height));let out=src;
    if(ratio<1 || !src.startsWith('data:image/jpeg')){const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*ratio);canvas.height=Math.round(img.height*ratio);const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);out=canvas.toDataURL('image/jpeg',q);}
    scaledCache.set(key,out);return out;
  }
  function applyQuality(){
    const run=++qualityRun,cfg=QUALITY[$('pdfQuality').value];
    qualityReady=(async()=>{for(const img of $('printMount').querySelectorAll('img')){
      if(!img.dataset.full)img.dataset.full=img.getAttribute('src');const full=img.dataset.full;if(!full.startsWith('data:image/'))continue;
      let next=full;if(cfg){try{next=await downscale(full,img.closest('.plan-frame')?cfg.plan:cfg.photo,cfg.q);}catch{next=full;}}
      if(run!==qualityRun)return;img.setAttribute('src',next);}})();
    return qualityReady;
  }
  $('pdfQuality').addEventListener('change',applyQuality);
  function overflowed() {return [...$('printMount').querySelectorAll('.f-company,.f-contact,.f-reference,.company-number,.flyer,.f-details,.f-left,.f-title,.f-price,.f-footer,.detail-section,.f-story,.c-plan,.c-poster-panel,.c-spread-story,.c-drawing-data,.c-offer,.ls-spec,.ls-media')].some((el)=>el.scrollHeight>el.clientHeight+2 || el.scrollWidth>el.clientWidth+2);}
  $('printButton').addEventListener('click',async()=>{
    if(dirty){notice('资料或图片已经修改，请先按「一键生成」重新生成方案，再导出。',true);return;}
    const mount=$('printMount');mount.style.display='block';const bad=overflowed();mount.style.display='';
    if(bad && !window.confirm('当前资料可能超出版面，超出的文字会被裁掉。\n仍然打印 / 保存 PDF 吗？')){notice('已取消导出：当前资料超出版面，请精简备注、交通或公司信息后重新生成。',true);return;}
    $('printButton').disabled=true;try{await qualityReady;}finally{$('printButton').disabled=false;}
    document.title=`${candidates[chosen].data.name}_${candidates[chosen].name}_v4`;window.print();
  });
  function downloadJSON(value,name) {const url=URL.createObjectURL(new Blob([JSON.stringify(value)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  $('saveButton').addEventListener('click',()=>{downloadJSON({version:3,data:readData(),assets,candidateAdjustments:dirty?[]:candidates.map((c)=>c.adjustments),styles:dirty?{}:Object.fromEntries(candidates.map((c)=>[c.id,c.adjustments])),selectedStyle:candidates[chosen]?.id,chosen},`${readData().name || '物件'}_v4草稿.json`);notice('草稿包含资料、图片和裁切调整，已保存到下载文件夹。');});
  $('importButton').addEventListener('click',()=>$('draftInput').click());
  async function restore(draft) {
    if(draft.version!==3 || !draft.data || !Array.isArray(draft.assets) || draft.assets.length>100)throw new Error('请选择 v3 保存的草稿。');
    const loaded=[];
    for(const a of draft.assets) {
      if(!a || !/^data:image\/(jpeg|png|webp);base64,/.test(a.src) || !/^data:image\/(jpeg|png|webp);base64,/.test(a.original || a.src))throw new Error('草稿中有不支持的图片。');
      if(!['interior','exterior','common','plan'].includes(a.role) || typeof a.id!=='string')throw new Error('草稿图片类型无效。');
      const img=await imageLoad(a.src);loaded.push({...a,original:a.original || a.src,width:img.width,height:img.height,enabled:a.enabled!==false});
    }
    sample=Boolean(draft.data.sample);$('sampleFlag').checked=sample;store={};propertyType=TYPES[draft.data.propertyType]?draft.data.propertyType:'mansion';renderFields();setData(draft.data);assets=loaded;renderAssets();
    candidates=[];$('gallery').innerHTML='';$('selection').hidden=true;$('emptyState').hidden=false;$('printMount').innerHTML='';
    if(!generate())throw new Error('草稿资料已载入，请补齐或精简资料后重新生成。');
    if(candidates.length){candidates.forEach((c,i)=>{c.adjustments=draft.styles?.[c.id] || (!draft.styles?draft.candidateAdjustments?.[['balanced','portrait','hero','minimal'].indexOf(c.layout)]:{}) || {};});chosen=Math.max(0,candidates.findIndex((c)=>c.id===draft.selectedStyle));renderResults();}
  }
  $('draftInput').addEventListener('change',async(event)=>{try{const file=event.target.files[0];if(!file)return;if(file.size>100*1024*1024)throw new Error('草稿超过 100 MB，无法打开。');await restore(JSON.parse(await file.text()));notice('草稿已恢复，包括图片和方案调整。');}catch(error){notice(error.message);}finally{event.target.value='';}});
  async function loadDemo() {
    try {
      const response=await fetch('v3-demo/manifest.json');if(!response.ok)throw new Error('测试资料仅在本地预览中可用。');const demo=await response.json();
      const loaded=[];for(const a of demo.assets){const response=await fetch(`v3-demo/${a.file}`);if(!response.ok)throw new Error('测试图片缺失');const normalized=await normalizeImage(new File([await response.blob()],a.file,{type:a.file.endsWith('.png')?'image/png':'image/jpeg'}));loaded.push({...normalized,role:a.role,label:a.label,enabled:a.enabled!==false});}
      sample=true;$('sampleFlag').checked=true;assets=loaded;setData(demo.data);renderAssets();generate();
    } catch(error) {notice(error.message);}
  }
  if(new URLSearchParams(location.search).get('demo')==='1')loadDemo();
})();
