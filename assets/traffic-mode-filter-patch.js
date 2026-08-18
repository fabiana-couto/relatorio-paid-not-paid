(function(){
  const ATTR_LABEL={last:'Fonte recente',first:'Fonte original',media:'Tipo de mídia / Canal',campaign:'Campanha de aquisição'};
  const PAID_SOURCE={last:'last',first:'first',media:'media',campaign:'campaign'};
  const NOTPAID_SOURCE={last:'notpaid_last',media:'notpaid'};
  const ATTR_BY_SOURCE={last:'last',first:'first',media:'media',campaign:'campaign',notpaid_last:'last',notpaid:'media'};

  state.trafficMode=(state.source==='notpaid'||state.source==='notpaid_last')?'notpaid':'paid';
  state.attribution=ATTR_BY_SOURCE[state.source]||'last';

  const sourceMenu=document.getElementById('sourceMenu');
  const sourcePop=sourceMenu?sourceMenu.closest('.pop'):null;
  if(sourcePop){
    const sm=sourcePop.querySelector('.trigger small');
    if(sm) sm.textContent='Análise por';
    const sl=sourcePop.querySelector('#sourceLabel');
    if(sl) sl.textContent=ATTR_LABEL[state.attribution];

    sourceMenu.innerHTML=`
      <div class="menu-title">Dimensão de atribuição</div>
      <div class="menu-note" id="attrNote">Escolha como quer quebrar o recorte de aquisição.</div>
      <button class="option" data-attr="campaign" onclick="setAttribution('campaign',event)">Campanha de aquisição <span class="check">✓</span></button>
      <button class="option" data-attr="first" onclick="setAttribution('first',event)">Fonte original <span class="check">✓</span></button>
      <button class="option" data-attr="last" onclick="setAttribution('last',event)">Fonte recente <span class="check">✓</span></button>
      <button class="option" data-attr="media" onclick="setAttribution('media',event)">Tipo de mídia / Canal <span class="check">✓</span></button>`;

    const mode=document.createElement('div');
    mode.className='pop';
    mode.id='trafficModePop';
    mode.innerHTML=`<button class="trigger" onclick="toggleMenu('trafficModeMenu',event)"><small>Tráfego</small><strong id="trafficModeLabel">Paid</strong><span class="chev">▼</span></button>
      <div class="menu" id="trafficModeMenu" style="min-width:230px" onclick="event.stopPropagation()">
        <div class="menu-title">Tipo de tráfego</div>
        <div class="menu-note">Paid e Not Paid são filtros independentes da dimensão de atribuição.</div>
        <button class="option on" data-traffic="paid" onclick="setTrafficMode('paid',event)">Paid <span class="check">✓</span></button>
        <button class="option" data-traffic="notpaid" onclick="setTrafficMode('notpaid',event)">Not Paid <span class="check">✓</span></button>
      </div>`;
    sourcePop.parentNode.insertBefore(mode,sourcePop);
  }

  function sourceFor(mode,attr){return mode==='notpaid'?NOTPAID_SOURCE[attr]:PAID_SOURCE[attr]}
  function resetPlatformIfNeeded(){
    if(!suportaPlataforma(state.source)&&state.platform!=='all'){
      state.platform='all';
      const el=document.getElementById('platLabel');if(el)el.textContent='Todas as plataformas';
      document.querySelectorAll('[data-plat]').forEach(b=>b.classList.toggle('on',b.dataset.plat==='all'));
    }
    atualizaTravaPlataforma();
  }
  function syncTrafficUI(){
    const modeLabel=document.getElementById('trafficModeLabel');
    if(modeLabel)modeLabel.textContent=state.trafficMode==='notpaid'?'Not Paid':'Paid';
    document.querySelectorAll('[data-traffic]').forEach(b=>b.classList.toggle('on',b.dataset.traffic===state.trafficMode));
    const srcLabel=document.getElementById('sourceLabel');if(srcLabel)srcLabel.textContent=ATTR_LABEL[state.attribution]||'Fonte recente';
    document.querySelectorAll('[data-attr]').forEach(b=>{
      const attr=b.dataset.attr,available=state.trafficMode==='paid'||!!NOTPAID_SOURCE[attr];
      b.classList.toggle('on',available&&attr===state.attribution);
      b.classList.toggle('travado',!available);
      b.disabled=!available;
      b.title=available?'':'Ainda não há uma regra Not Paid validada para esta dimensão.';
    });
    const note=document.getElementById('attrNote');
    if(note)note.textContent=state.trafficMode==='notpaid'
      ?'Not Paid: Fonte recente e Tipo de mídia têm réguas validadas. Fonte original e Campanha ficam indisponíveis para evitar uma classificação inventada.'
      :'Paid: escolha Fonte recente, Fonte original, Tipo de mídia ou Campanha de aquisição.';
  }
  function applyTrafficSelection(doRender=true){
    let mapped=sourceFor(state.trafficMode,state.attribution);
    if(!mapped){state.attribution='last';mapped=sourceFor(state.trafficMode,'last')}
    state.source=mapped;
    resetPlatformIfNeeded();
    syncTrafficUI();
    if(doRender)render();
  }

  window.setTrafficMode=function(mode,e){
    if(e)e.stopPropagation();
    state.trafficMode=mode==='notpaid'?'notpaid':'paid';
    if(state.trafficMode==='notpaid'&&!NOTPAID_SOURCE[state.attribution])state.attribution='last';
    applyTrafficSelection(true);
    const m=document.getElementById('trafficModeMenu');if(m)m.classList.remove('open');
  };
  window.setAttribution=function(attr,e){
    if(e)e.stopPropagation();
    if(!ATTR_LABEL[attr])return;
    if(state.trafficMode==='notpaid'&&!NOTPAID_SOURCE[attr])return;
    state.attribution=attr;
    applyTrafficSelection(true);
    const m=document.getElementById('sourceMenu');if(m)m.classList.remove('open');
  };
  window.setSource=function(s){
    state.trafficMode=(s==='notpaid'||s==='notpaid_last')?'notpaid':'paid';
    state.attribution=ATTR_BY_SOURCE[s]||'last';
    applyTrafficSelection(true);
  };

  const baseInvestmentHTML=investmentHTML;
  investmentHTML=function(){
    if(state.trafficMode==='notpaid'||state.source==='notpaid'||state.source==='notpaid_last')return '';
    return baseInvestmentHTML();
  };

  frontPaceHTML=function(){
    const views=state.trafficMode==='notpaid'?['notpaid_last','notpaid']:['last','first','media','campaign'];
    if(state.month!=='2026-08')return `<section class="enh-panel"><div class="enh-title">Pace das frentes · ${state.trafficMode==='notpaid'?'Not Paid':'Paid'}</div><div class="enh-sub">O pace é exibido no mês corrente parcial. Selecione Agosto.</div></section>`;
    const cards=views.map(v=>{let pm=paceValue(v,'mql'),ps=paceValue(v,'sql'),m=totalView(v,'mql','2026-08'),s=totalView(v,'sql','2026-08');return `<div class="pace-card"><div class="nm">${SOURCE_LABEL[v]}</div><div class="pv ${paceClass(pm)}">${fmtPace(pm)}</div><div class="mini">Pace MQL · ${fmt(m)} realizados</div><div class="mini ${paceClass(ps)}">SQL ${fmtPace(ps)} · ${fmt(s)} no mês</div></div>`}).join('');
    return `<section class="enh-panel"><div class="enh-title">Pace das frentes · ${state.trafficMode==='notpaid'?'Not Paid':'Paid'}</div><div class="enh-sub">100% = mesmo ritmo de julho no mesmo ponto do mês · respeita os segmentos selecionados.</div><div class="pace-grid">${cards}</div></section>`;
  };

  const baseMethodology=methodology;
  methodology=function(){
    let h=baseMethodology();
    h=h.replace('Paid por Tipo de mídia: cpc, ppc ou paid. Not Paid possui duas réguas independentes: Fonte recente exclui PAID_SEARCH/PAID_SOCIAL sem olhar medium; Tipo de mídia exclui cpc/ppc/paid e quebra por Canal (source).',
      'Paid/Not Paid é escolhido em um filtro próprio. A dimensão de atribuição é escolhida separadamente. Em Not Paid, as réguas validadas são Fonte recente (exclui PAID_SEARCH/PAID_SOCIAL, sem olhar medium) e Tipo de mídia (medium fora de cpc/ppc/paid). Investimento aparece somente em Paid.');
    return h;
  };

  const baseCoverage=coverage;
  coverage=function(){
    let h=baseCoverage();
    const badge=`<span class="pill ${state.trafficMode==='notpaid'?'partial':'ok'}">${state.trafficMode==='notpaid'?'Not Paid · sem investimento':'Paid · investimento aplicável'}</span>`;
    return h.replace(/<\/div>$/,badge+'</div>');
  };

  syncTrafficUI();
  render();
})();
