(function(){
  'use strict';

  if(window.__trafficModeFilterV3Loaded) return;
  window.__trafficModeFilterV3Loaded=true;

  const PAID_SOURCES=['first','last','media','campaign'];
  const NOT_PAID_SOURCES=['notpaid_last','notpaid_media'];
  const ANALYSIS_LABEL={
    first:'Fonte original',
    last:'Fonte recente',
    media:'Tipo de mídia / Canal',
    campaign:'Campanha de aquisição',
    notpaid_last:'Fonte recente',
    notpaid_media:'Tipo de mídia / Canal'
  };
  const HIDDEN_ATTR='data-not-paid-investment-hidden';

  function isNotPaidSource(source){
    return String(source||'').indexOf('notpaid')===0;
  }

  function isNotPaid(){
    return state.page!=='paid' || isNotPaidSource(state.source);
  }

  function normalizePaidSource(source){
    return PAID_SOURCES.includes(source)?source:'last';
  }

  function normalizeNotPaidSource(source){
    if(source==='media'||source==='notpaid'||source==='notpaid_media') return 'notpaid_media';
    return 'notpaid_last';
  }

  function rememberCurrentSources(){
    if(isNotPaidSource(state.source)) state.notPaidSource=normalizeNotPaidSource(state.source);
    else state.paidSource=normalizePaidSource(state.source||state.paidSource);

    state.paidSource=normalizePaidSource(state.paidSource);
    state.notPaidSource=normalizeNotPaidSource(state.notPaidSource);
  }

  function setCompatibilityState(notPaid,source){
    state.trafficMode=notPaid?'notpaid':'paid';
    state.attribution=source==='notpaid_last'?'last':source==='notpaid_media'?'media':source;
  }

  function resetPlatform(){
    if(state.platform==='all') return;
    state.platform='all';
    const label=document.getElementById('platLabel');
    if(label) label.textContent='Todas as plataformas';
    document.querySelectorAll('[data-plat]').forEach(function(button){
      button.classList.toggle('on',button.dataset.plat==='all');
    });
  }

  function activatePaid(source){
    const selected=normalizePaidSource(source||state.paidSource);
    state.page='paid';
    state.source=selected;
    state.paidSource=selected;
    setCompatibilityState(false,selected);
    if(!suportaPlataforma(selected)) resetPlatform();
  }

  function activateNotPaid(source){
    const selected=normalizeNotPaidSource(source||state.notPaidSource);
    state.page=selected;
    state.source=selected;
    state.notPaidSource=selected;
    setCompatibilityState(true,selected);
    resetPlatform();
  }

  function filtersRoot(){
    return document.querySelector('.filters');
  }

  function pageFilter(){
    const menu=document.getElementById('pageMenu');
    return menu?menu.closest('.pop'):null;
  }

  function analysisFilter(){
    const menu=document.getElementById('sourceMenu');
    return menu?menu.closest('.pop'):document.getElementById('sourceFilter');
  }

  function placeAnalysisAfterPage(){
    const root=filtersRoot(),page=pageFilter(),analysis=analysisFilter();
    if(!root||!page||!analysis) return;
    analysis.id='sourceFilter';
    analysis.style.display='';
    if(page.nextElementSibling!==analysis) root.insertBefore(analysis,page.nextSibling);
  }

  function renderPageMenu(){
    const menu=document.getElementById('pageMenu');
    const label=document.getElementById('pageLabel');
    if(!menu||!label) return;

    const notPaid=isNotPaid();
    label.textContent=notPaid?'Not Paid':'Paid';
    menu.style.minWidth='230px';
    menu.innerHTML=
      '<div class="menu-title">Visão de aquisição</div>'+
      '<button class="option '+(!notPaid?'on':'')+'" data-page="paid" onclick="setPage(\'paid\',event)">'+
        'Paid <span class="check">✓</span>'+
      '</button>'+
      '<button class="option '+(notPaid?'on':'')+'" data-page="notpaid" onclick="setPage(\'notpaid\',event)">'+
        'Not Paid <span class="check">✓</span>'+
      '</button>';
  }

  function analysisOptions(){
    return isNotPaid()?NOT_PAID_SOURCES:PAID_SOURCES;
  }

  function renderAnalysisMenu(){
    const filter=analysisFilter();
    const menu=document.getElementById('sourceMenu');
    const label=document.getElementById('sourceLabel');
    if(!filter||!menu||!label) return;

    filter.style.display='';
    const small=filter.querySelector('.trigger small');
    if(small) small.textContent='Análise por';

    const selected=isNotPaid()?normalizeNotPaidSource(state.source):normalizePaidSource(state.source);
    const options=analysisOptions();
    menu.style.minWidth='255px';
    menu.innerHTML=
      '<div class="menu-title">'+(isNotPaid()?'Dimensão de Not Paid':'Dimensão de Paid')+'</div>'+
      options.map(function(source){
        return '<button class="option '+(source===selected?'on':'')+'" data-source="'+source+'" onclick="setSource(\''+source+'\',event)">'+
          ANALYSIS_LABEL[source]+' <span class="check">✓</span>'+
        '</button>';
      }).join('');
    label.textContent=ANYSIS_LABEL[selected];
  }

  function encodeDisplay(element){
    return JSON.stringify([
      element.style.getPropertyValue('display'),
      element.style.getPropertyPriority('display')
    ]);
  }

  function hideElement(element){
    if(!element||element.hasAttribute(HIDDEN_ATTR)) return;
    element.setAttribute(HIDDEN_ATTR,encodeDisplay(element));
    element.style.setProperty('display','none','important');
  }

  function restoreElement(element){
    if(!element||!element.hasAttribute(HIDDEN_ATTR)) return;
    let previous=['',''];
    try{previous=JSON.parse(element.getAttribute(HIDDEN_ATTR))||previous}catch(error){}
    if(previous[0]) element.style.setProperty('display',previous[0],previous[1]||'');
    else element.style.removeProperty('display');
    element.removeAttribute(HIDDEN_ATTR);
  }

  function investmentHeading(text){
    const value=String(text||'')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/\s+/g,' ')
      .trim()
      .toLowerCase();

    return [
      'investimento e eficiencia de midia',
      'historico de investimento',
      'historico de budget',
      'planejamento de budget',
      'acompanhamento de investimento',
      'acompanhamento de budget',
      'investimento realizado',
      'custo por sql',
      'verba de midia'
    ].some(function(term){return value.indexOf(term)>=0});
  }

  function investmentElements(){
    const elements=new Set();
    document.querySelectorAll(
      '.inv-panel,'+
      '.investment-panel,'+
      '.budget-panel,'+
      '[data-section="investment"],'+
      '[data-section="budget"],'+
      '[class^="inv-"],'+
      '[class*=" inv-"],'+
      '[class*="investment"],'+
      '[class*="investimento"],'+
      '[class*="budget"],'+
      '[class*="verba"],'+
      '[id*="investment"],'+
      '[id*="investimento"],'+
      '[id*="budget"],'+
      '[id*="verba"]'
    ).forEach(function(element){elements.add(element)});

    document.querySelectorAll('h1,h2,h3,h4,.panel-title,.enh-title,.table-head,.method-title').forEach(function(heading){
      if(!investmentHeading(heading.textContent)) return;
      const panel=heading.closest('section,.panel,.enh-panel,.table-panel,[data-section]');
      if(panel) elements.add(panel);
    });
    return elements;
  }

  function syncInvestmentVisibility(){
    const hidden=isNotPaid();
    if(document.body) document.body.classList.toggle('not-paid-no-investment',hidden);

    if(hidden){
      investmentElements().forEach(hideElement);
    }else{
      document.querySelectorAll('['+HIDDEN_ATTR+']').forEach(restoreElement);
    }
  }

  function syncFilters(){
    rememberCurrentSources();
    placeAnalysisAfterPage();
    renderPageMenu();
    renderAnalysisMenu();
    if(isNotPaid()) resetPlatform();
    if(typeof atualizaTravaPlataforma==='function') atualizaTravaPlataforma();
    if(typeof atualizaStamp==='function') atualizaStamp();
    syncInvestmentVisibility();
  }

  syncPageUI=function(){
    if(isNotPaid()) activateNotPaid(state.source||state.notPaidSource);
    else activatePaid(state.source||state.paidSource);
    syncFilters();
  };

  setPage=function(page,event){
    if(event&&typeof event.stopPropagation==='function') event.stopPropagation();

    if(page==='paid') activatePaid(state.paidSource);
    else if(page==='notpaid_media') activateNotPaid('notpaid_media');
    else if(page==='notpaid_last') activateNotPaid('notpaid_last');
    else activateNotPaid(state.notPaidSource||'notpaid_last');

    const menu=document.getElementById('pageMenu');
    if(menu) menu.classList.remove('open');
    render();
  };

  setSource=function(source,event){
    if(event&&typeof event.stopPropagation==='function') event.stopPropagation();

    if(isNotPaid()){
      if(source!=='last'&&source!=='media'&&!NOT_PAID_SOURCES.includes(source)) return;
      activateNotPaid(source);
    }else{
      if(!PAID_SOURCES.includes(source)) return;
      activatePaid(source);
    }

    const menu=document.getElementById('sourceMenu');
    if(menu) menu.classList.remove('open');
    render();
  };

  if(typeof investmentHTML==='function'){
    const paidInvestmentHTML=investmentHTML;
    investmentHTML=function(){
      return isNotPaid()?'':paidInvestmentHTML.apply(this,arguments);
    };
  }

  const baseRender=render;
  render=function(){
    baseRender();
    syncFilters();
  };

  const style=document.createElement('style');
  style.id='traffic-mode-filter-v3-style';
  style.textContent=
    'body.not-paid-no-investment .inv-panel,'+
    'body.not-paid-no-investment .investment-panel,'+
    'body.not-paid-no-investment .budget-panel,'+
    'body.not-paid-no-investment [data-section="investment"],'+
    'body.not-paid-no-investment [data-section="budget"],'+
    'body.not-paid-no-investment [class^="inv-"],'+
    'body.not-paid-no-investment [class*=" inv-"],'+
    'body.not-paid-no-investment [class*="investment"],'+
    'body.not-paid-no-investment [class*="investimento"],'+
    'body.not-paid-no-investment [class*="budget"],'+
    'body.not-paid-no-investment [class*="verba"],'+
    'body.not-paid-no-investment [id*="investment"],'+
    'body.not-paid-no-investment [id*="investimento"],'+
    'body.not-paid-no-investment [id*="budget"],'+
    'body.not-paid-no-investment [id*="verba"]{display:none!important}';
  document.head.appendChild(style);

  const observer=new MutationObserver(function(){
    syncInvestmentVisibility();
  });
  observer.observe(document.documentElement,{subtree:true,childList:true});

  rememberCurrentSources();
  if(isNotPaid()) activateNotPaid(state.source);
  else activatePaid(state.source);
  render();
})();
