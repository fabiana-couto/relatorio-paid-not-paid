(function(){
  const PAID_ATTR={last:'last',first:'first',media:'media',campaign:'campaign'};
  const NOTPAID_ATTR={last:'notpaid_last',media:(DATA.views&&DATA.views.notpaid_media?'notpaid_media':'notpaid')};
  const ATTR_LABEL={last:'Fonte recente',first:'Fonte original',media:'Tipo de mídia / Canal',campaign:'Campanha de aquisição'};

  function isNotPaid(){return state.page!=='paid'||String(state.source).startsWith('notpaid')}
  function attrFromSource(s){if(s==='notpaid_last')return 'last';if(s==='notpaid_media'||s==='notpaid')return 'media';return PAID_ATTR[s]?s:'last'}
  state.attribution=attrFromSource(state.source);

  function resetPlatform(){
    if(!suportaPlataforma(state.source)&&state.platform!=='all'){
      state.platform='all';
      const l=document.getElementById('platLabel');if(l)l.textContent='Todas as plataformas';
      document.querySelectorAll('[data-plat]').forEach(b=>b.classList.toggle('on',b.dataset.plat==='all'));
    }
    atualizaTravaPlataforma();
  }

  function setupPageMenu(){
    const menu=document.getElementById('pageMenu');if(!menu)return;
    menu.innerHTML=`<div class="menu-title">Visão de aquisição</div><div class="menu-note">Em Not Paid, escolha a dimensão no filtro Análise por.</div>
      <button class="option" data-page-mode="paid" onclick="setTrafficPage('paid',event)">Paid <span class="check">✓</span></button>
      <button class="option" data-page-mode="notpaid" onclick="setTrafficPage('notpaid',event)">Not Paid <span class="check">✓</span></button>`;
  }

  function setupSourceMenu(){
    const menu=document.getElementById('sourceMenu');if(!menu)return;
    const pop=menu.closest('.pop');if(pop){pop.style.display='';const s=pop.querySelector('.trigger small');if(s)s.textContent='Análise por'}
    if(isNotPaid()){
      menu.innerHTML=`<div class="menu-title">Dimensão de Not Paid</div><div class="menu-note">Escolha uma visão independente.</div>
        <button class="option" data-analysis="last" onclick="setAnalysis('last',event)">Fonte recente <span class="check">✓</span></button>
        <button class="option" data-analysis="media" onclick="setAnalysis('media',event)">Tipo de mídia / Canal <span class="check">✓</span></button>`;
    }else{
      menu.innerHTML=`<div class="menu-title">Dimensão de atribuição</div>
        <button class="option" data-analysis="campaign" onclick="setAnalysis('campaign',event)">Campanha de aquisição <span class="check">✓</span></button>
        <button class="option" data-analysis="first" onclick="setAnalysis('first',event)">Fonte original <span class="check">✓</span></button>
        <button class="option" data-analysis="last" onclick="setAnalysis('last',event)">Fonte recente <span class="check">✓</span></button>
        <button class="option" data-analysis="media" onclick="setAnalysis('media',event)">Tipo de mídia / Canal <span class="check">✓</span></button>`;
    }
  }

  function removeInvestment(){
    if(!isNotPaid())return;
    document.querySelectorAll('.inv-panel,.investment-panel,[data-section="investment"],section.panel,section.enh-panel,.kpi').forEach(el=>{
      const t=(el.textContent||'').replace(/\s+/g,' ').trim();
      if(el.matches('.inv-panel,.investment-panel,[data-section="investment"]')||/\binvestimento\b/i.test(t)||/\bverba\b/i.test(t))el.remove();
    });
  }

  function syncUI(){
    setupPageMenu();setupSourceMenu();
    const pageLabel=document.getElementById('pageLabel');if(pageLabel)pageLabel.textContent=isNotPaid()?'Not Paid':'Paid';
    document.querySelectorAll('[data-page-mode]').forEach(b=>b.classList.toggle('on',b.dataset.pageMode===(isNotPaid()?'notpaid':'paid')));
    const sourceLabel=document.getElementById('sourceLabel');if(sourceLabel)sourceLabel.textContent=ATTR_LABEL[state.attribution]||'Fonte recente';
    document.querySelectorAll('[data-analysis]').forEach(b=>b.classList.toggle('on',b.dataset.analysis===state.attribution));
    removeInvestment();
  }

  window.setTrafficPage=function(mode,e){
    if(e)e.stopPropagation();
    if(mode==='notpaid'){
      if(!NOTPAID_ATTR[state.attribution])state.attribution='last';
      state.page=NOTPAID_ATTR[state.attribution];state.source=state.page;
    }else{
      state.page='paid';
      if(!PAID_ATTR[state.attribution])state.attribution='last';
      state.source=PAID_ATTR[state.attribution];state.paidSource=state.source;
    }
    resetPlatform();render();
    const m=document.getElementById('pageMenu');if(m)m.classList.remove('open');
  };

  window.setAnalysis=function(attr,e){
    if(e)e.stopPropagation();
    if(isNotPaid()){
      if(!NOTPAID_ATTR[attr])return;
      state.attribution=attr;state.page=NOTPAID_ATTR[attr];state.source=state.page;
    }else{
      if(!PAID_ATTR[attr])return;
      state.attribution=attr;state.source=PAID_ATTR[attr];state.paidSource=state.source;
    }
    resetPlatform();render();
    const m=document.getElementById('sourceMenu');if(m)m.classList.remove('open');
  };

  window.setPage=function(p,e){
    if(p==='paid')return setTrafficPage('paid',e);
    if(p==='notpaid_last'){state.attribution='last';return setTrafficPage('notpaid',e)}
    if(p==='notpaid_media'||p==='notpaid'){state.attribution='media';return setTrafficPage('notpaid',e)}
    return setTrafficPage('paid',e);
  };

  window.setSource=function(s,e){
    if(s==='notpaid_last'){state.attribution='last';return setTrafficPage('notpaid',e)}
    if(s==='notpaid_media'||s==='notpaid'){state.attribution='media';return setTrafficPage('notpaid',e)}
    return setAnalysis(s,e);
  };

  if(typeof investmentHTML==='function'){
    const baseInvestmentHTML=investmentHTML;
    investmentHTML=function(){return isNotPaid()?'':baseInvestmentHTML()};
  }

  const baseRender=render;
  render=function(){baseRender();syncUI()};

  if(state.page==='notpaid_last'||state.source==='notpaid_last')state.attribution='last';
  else if(state.page==='notpaid_media'||state.source==='notpaid_media'||state.source==='notpaid')state.attribution='media';
  syncUI();render();
})();
