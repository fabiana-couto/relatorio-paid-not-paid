(function(){
  const ATTR_LABEL={last:'Fonte recente',first:'Fonte original',media:'Tipo de mídia / Canal',campaign:'Campanha de aquisição'};
  const PAID_SOURCE={last:'last',first:'first',media:'media',campaign:'campaign'};
  const NOTPAID_SOURCE={last:'notpaid_last',media:'notpaid'};
  const SOURCE_TO_ATTR={last:'last',first:'first',media:'media',campaign:'campaign',notpaid_last:'last',notpaid:'media'};

  state.trafficMode=(state.source==='notpaid'||state.source==='notpaid_last')?'notpaid':'paid';
  state.attribution=SOURCE_TO_ATTR[state.source]||'last';

  function isNotPaid(){return state.trafficMode==='notpaid'||state.source==='notpaid'||state.source==='notpaid_last'}
  function mappedSource(){
    const map=state.trafficMode==='notpaid'?NOTPAID_SOURCE:PAID_SOURCE;
    if(!map[state.attribution]) state.attribution='last';
    return map[state.attribution];
  }
  function resetPlatform(){
    if(!suportaPlataforma(state.source)&&state.platform!=='all'){
      state.platform='all';
      const l=document.getElementById('platLabel');if(l)l.textContent='Todas as plataformas';
      document.querySelectorAll('[data-plat]').forEach(b=>b.classList.toggle('on',b.dataset.plat==='all'));
    }
    atualizaTravaPlataforma();
  }
  function ensureFilterUI(){
    const sourceMenu=document.getElementById('sourceMenu');
    if(!sourceMenu)return;
    const sourcePop=sourceMenu.closest('.pop');
    if(!sourcePop)return;
    const small=sourcePop.querySelector('.trigger small');if(small)small.textContent='Análise por';
    sourceMenu.innerHTML=`<div class="menu-title">Dimensão de atribuição</div><div class="menu-note" id="attrNote"></div>
      <button class="option" data-attr="campaign" onclick="setAttribution('campaign',event)">Campanha de aquisição <span class="check">✓</span></button>
      <button class="option" data-attr="first" onclick="setAttribution('first',event)">Fonte original <span class="check">✓</span></button>
      <button class="option" data-attr="last" onclick="setAttribution('last',event)">Fonte recente <span class="check">✓</span></button>
      <button class="option" data-attr="media" onclick="setAttribution('media',event)">Tipo de mídia / Canal <span class="check">✓</span></button>`;
    let mode=document.getElementById('trafficModePop');
    if(!mode){
      mode=document.createElement('div');mode.className='pop';mode.id='trafficModePop';
      mode.innerHTML=`<button class="trigger" onclick="toggleMenu('trafficModeMenu',event)"><small>Tráfego</small><strong id="trafficModeLabel">Paid</strong><span class="chev">▼</span></button>
      <div class="menu" id="trafficModeMenu" style="min-width:230px" onclick="event.stopPropagation()"><div class="menu-title">Tipo de tráfego</div><div class="menu-note">Investimento aparece somente em Paid.</div>
      <button class="option" data-traffic="paid" onclick="setTrafficMode('paid',event)">Paid <span class="check">✓</span></button>
      <button class="option" data-traffic="notpaid" onclick="setTrafficMode('notpaid',event)">Not Paid <span class="check">✓</span></button></div>`;
      sourcePop.parentNode.insertBefore(mode,sourcePop);
    }
  }
  function syncUI(){
    ensureFilterUI();
    const tl=document.getElementById('trafficModeLabel');if(tl)tl.textContent=isNotPaid()?'Not Paid':'Paid';
    document.querySelectorAll('[data-traffic]').forEach(b=>b.classList.toggle('on',b.dataset.traffic===(isNotPaid()?'notpaid':'paid')));
    const sl=document.getElementById('sourceLabel');if(sl)sl.textContent=ATTR_LABEL[state.attribution]||'Fonte recente';
    document.querySelectorAll('[data-attr]').forEach(b=>{const a=b.dataset.attr,ok=!isNotPaid()||!!NOTPAID_SOURCE[a];b.disabled=!ok;b.classList.toggle('travado',!ok);b.classList.toggle('on',ok&&a===state.attribution)});
    const note=document.getElementById('attrNote');if(note)note.textContent=isNotPaid()?'Not Paid: Fonte recente ou Tipo de mídia / Canal.':'Paid: Fonte recente, Fonte original, Tipo de mídia / Canal ou Campanha de aquisição.';
    if(isNotPaid()) document.querySelectorAll('.inv-panel').forEach(x=>x.remove());
  }
  function apply(){state.source=mappedSource();resetPlatform();render()}

  window.setTrafficMode=function(mode,e){if(e)e.stopPropagation();state.trafficMode=mode==='notpaid'?'notpaid':'paid';if(state.trafficMode==='notpaid'&&!NOTPAID_SOURCE[state.attribution])state.attribution='last';apply();const m=document.getElementById('trafficModeMenu');if(m)m.classList.remove('open')};
  window.setAttribution=function(attr,e){if(e)e.stopPropagation();if(!ATTR_LABEL[attr])return;if(isNotPaid()&&!NOTPAID_SOURCE[attr])return;state.attribution=attr;apply();const m=document.getElementById('sourceMenu');if(m)m.classList.remove('open')};
  window.setSource=function(s){state.trafficMode=(s==='notpaid'||s==='notpaid_last')?'notpaid':'paid';state.attribution=SOURCE_TO_ATTR[s]||'last';apply()};

  const previousInvestmentHTML=investmentHTML;
  investmentHTML=function(){if(isNotPaid())return '';return previousInvestmentHTML()};

  frontPaceHTML=function(){
    const views=isNotPaid()?['notpaid_last','notpaid']:['last','first','media','campaign'];
    if(state.month!=='2026-08')return `<section class="enh-panel"><div class="enh-title">Pace das frentes · ${isNotPaid()?'Not Paid':'Paid'}</div><div class="enh-sub">O pace é exibido no mês corrente parcial. Selecione Agosto.</div></section>`;
    const cards=views.map(v=>{const pm=paceValue(v,'mql'),ps=paceValue(v,'sql'),m=totalView(v,'mql','2026-08'),s=totalView(v,'sql','2026-08');return `<div class="pace-card"><div class="nm">${SOURCE_LABEL[v]}</div><div class="pv ${paceClass(pm)}">${fmtPace(pm)}</div><div class="mini">Pace MQL · ${fmt(m)} realizados</div><div class="mini ${paceClass(ps)}">SQL ${fmtPace(ps)} · ${fmt(s)} no mês</div></div>`}).join('');
    return `<section class="enh-panel"><div class="enh-title">Pace das frentes · ${isNotPaid()?'Not Paid':'Paid'}</div><div class="enh-sub">100% = mesmo ritmo de julho no mesmo ponto do mês · respeita os segmentos selecionados.</div><div class="pace-grid">${cards}</div></section>`;
  };

  const previousRender=render;
  render=function(){previousRender();syncUI()};
  syncUI();
  render();
})();
