/* Shared company band keeps contact details consistent in all six page structures. */
window.FlyerCompany = (() => {
  /** Render supplied company facts without inventing missing contact numbers. */
  function render(data, escape) {
    const e = escape;
    const phone = data.phone?'<div class="company-number"><span>TEL</span><strong>'+e(data.phone)+'</strong></div>':'';
    const fax = data.fax?'<div class="company-number"><span>FAX</span><strong>'+e(data.fax)+'</strong></div>':'';
    const website = data.companyWebsite?'<span class="company-website">'+e(data.companyWebsite)+'</span>':'';
    const contact = data.contact?'<div><span>担当者</span><b>'+e(data.contact)+'</b></div>':'';
    return '<footer class="f-footer"><div class="f-brand company-logo"><img src="../logo-header.png" alt="SmartEyes"></div><div class="f-company"><strong>'+e(data.company)+'</strong><small class="company-license">'+e(data.license)+'</small><small class="company-address">'+e(data.companyAddress)+'</small>'+website+'</div><div class="f-contact">'+phone+fax+(data.email?'<small class="company-email">'+e(data.email)+'</small>':'')+'</div><div class="f-reference"><div><span>取引態様</span><b>'+e(data.transaction)+'</b></div>'+contact+'<div><span>物件番号</span><b>'+e(data.reference || '—')+'</b></div><div><span>更新日</span><b>'+e(data.updated || '要確認')+'</b></div></div></footer>';
  }
  return {render};
})();
