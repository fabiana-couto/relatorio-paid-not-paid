(function(){
  const ATTR_LABEL={last:'Fonte recente',first:'Fonte original',media:'Tipo de mídia / Canal',campaign:'Campanha de aquisição'};
  const PAID={last:'last',first:'first',media:'media',campaign:'campaign'};
  const NOTPAID={last:'notpaid_last',media:(DATA.views&&DATA.views.notpaid_media?'notpaid_media':'notpaid')};
  const SOURCE_ATTR={last:'last',first:'first',media:'media',campaign:'campaign',notpaid_last:'last',notpaid_media:'media',notpaid:'media'};

  state.trafficMode=String(state.source||'').startsWith('notpaid')?'notpaid':'paid';
  state.attribution=SOURCE_ATTR[state.source]||'last';

  function isNotPaid(){return state.trafficMode==='notpaid'}
  function mapped(){const map=isNotPaid()?NOTPAID:PAID;return map[state.attribution]||map.last}

  function installStyle(){
    if(document.getElementById('notPaidHardHide'))return;
    const s=document.createElement('style');s.id='notPaidHardHide';
    s.textContent=`body.notpaid-mode [class*="inv-"],body.notpaid-mode [class*="investment"],body.notpaid-mode [id*="investment"],body.notpaid-mode [data-section="investment"]{display:none!important}`;
    document.head.appendChild(s);
  }

  function ensureUI(){
    installStyle();
    const sourceMenu=document.getElementById('sourceMenu');if(!sourceMenu)return;
    const sourcePop=sourceMenu.closest('.pop')||document.getElementById('sourceFilter');if(!sourcePop)return;
    sourcePop.style.display='';
    const sm=sourcePop.querySelector('.trigger small');if(sm)sm.textContent='Análise por';

    const pageMenu=document.getElementById('pageMenu');
    if(pageMenu){const pagePop=pageMenu.closest('.pop');if(pagePop)pagePop.style.display='none'}

    let mode=document.getElementById('trafficModePop');
    if(!mode){
      mode=document.createElement('div');mode.className='pop';mode.id='trafficModePop';
      mode.innerHTML=`<button class="trigger" onclick="toggleMenu('trafficModeMenu',event)"><small>Tráfego</small><strong id="trafficModeLabel">Paid</strong><span class="chev">▼</span></button><div class="menu" id="trafficModeMenu" style="min-width:230px" onclick="event.stopPropagation()"><div class="menu-title">Tipo de tráfego</div><div class="menu-note">Investimento existe somente em Paid.</div><button class="option" data-traffic="paid" onclick="setTrafficMode('paid',event)">Paid <span class="check">✓</span></button><button class="option" data-traffic="notpaid" onclick="setTrafficMode('notpaid',event)">Not Paid <span class="check">✓</span></button></div>`;
      sourcePop.parentNode.insertBefore(mode,sourcePop);
    }

    sourceMenu.innerHTML=isNotPaid()?`<div class="menu-title">Dimensão de Not Paid</div><div class="menu-note">Escolha uma das duas réguas independentes.</div><button class="option" data-attr="last" onclick="setAttribution('last',event)">Fonte recente <span class="check">✓</span></button><button class="option" data-attr="media" onclick="setAttribution('media',event)">Tipo de mídia / Canal <span class="check">✓</span></button>`:`<div class="menu-title">Dimensão de atribuição</div><button class="option" data-attr="campaign" onclick="setAttribution('campaign',event)">Campanha de aquisição <span class="check">✓</span></button><button class="option" data-attr="first" onclick="setAttribution('first',event)">Fonte original <span class="check">✓</span></button><button class="option" data-attr="last" onclick="setAttribution('last',event)">Fonte recente <span class="check">✓</span></button><button class="option" data-attr="media" onclick="setAttribution('media',event)">Tipo de mídia / Canal <span class="check">✓</span></button>`;
  }

  function hardHideInvestment(){
    document.body.classList.toggle('notpaid-mode',isNotPaid());
    if(!isNotPaid())return;
    document.querySelectorAll('[class*="inv-"],[class*="investment"],[id*="investment"],[data-section="investment"]').forEach(el=>el.style.setProperty('display','none','important'));
    document.querySelectorAll('section,div').forEach(el=>{
      if(el.children.length>20)return;
      const t=(el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      if((t.startsWith('investimento')||t.startsWith('histórico de investimento')||t.includes('acompanhamento de investimento'))&&t.length<2500)el.style.setProperty('display','none','important');
    });
  }

  function sync(){
    ensureUI();
    const tl=document.getElementById('trafficModeLabel');if(tl)tl.textContent=isNotPaid()?'Not Paid':'Paid';
    document.querySelectorAll('[data-traffic]').forEach(b=>b.classList.toggle('on',b.dataset.traffic===state.trafficMode));
    const sl=document.getElementById('sourceLabel');if(sl)sl.textContent=ATTR_LABEL[state.attribution]||'Fonte recente';
    document.querySelectorAll('[data-attr]').forEach(b=>b.classList.toggle('on',b.dataset.attr===state.attribution));
    hardHideInvestment();
  }

  function apply(){
    state.source=mapped();
    if('page' in state)state.page=isNotPaid()?state.source:'paid';
    if(!suportaPlataforma(state.source)&&state.platform!=='all'){
      state.platform='all';const p=document.getElementById('platLabel');if(p)p.textContent='Todas as plataformas';
      document.querySelectorAll('[data-plat]').forEach(b=>b.classList.toggle('on',b.dataset.plat==='all'));
    }
    atualizaTravaPlataforma();render();
  }

  window.setTrafficMode=function(mode,e){
    if(e)e.stopPropagation();state.trafficMode=mode==='notpaid'?'notpaid':'paid';
    if(isNotPaid()&&!NOTPAID[state.attribution])state.attribution='last';
    apply();const m=document.getElementById('trafficModeMenu');if(m)m.classList.remove('open');
  };
  window.setAttribution=function(attr,e){
    if(e)e.stopPropagation();const allowed=isNotPaid()?NOTPAID:PAID;if(!allowed[attr])return;
    state.attribution=attr;apply();const m=document.getElementById('sourceMenu');if(m)m.classList.remove('open');
  };
  window.setSource=function(s,e){
    if(String(s).startsWith('notpaid')){state.trafficMode='notpaid';state.attribution=SOURCE_ATTR[s]||'last'}
    else{state.trafficMode='paid';state.attribution=SOURCE_ATTR[s]||'last'}
    apply();
  };
  window.setPage=function(p,e){
    if(p==='paid')return setTrafficMode('paid',e);
    state.trafficMode='notpaid';state.attribution=(p==='notpaid_last')?'last':'media';apply();
  };

  if(typeof investmentHTML==='function'){
    const baseInvestmentHTML=investmentHTML;
    investmentHTML=function(){return isNotPaid()?'':baseInvestmentHTML()};
  }

  const baseRender=render;
  render=function(){baseRender();sync()};
  const obs=new MutationObserver(()=>hardHideInvestment());
  obs.observe(document.documentElement,{subtree:true,childList:true});
  sync();render();
})();
