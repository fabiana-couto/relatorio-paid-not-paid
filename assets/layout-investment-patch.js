(function(){
  'use strict';

  const STYLE_ID='qive-layout-ux-review-style';

  function addStyles(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .evolution-grid-full{
        display:grid!important;
        grid-template-columns:minmax(0,1fr)!important;
        gap:14px!important;
        margin-bottom:14px!important;
      }
      .evolution-grid-full>.panel{width:100%;min-width:0}
      .evolution-grid-full .chart,
      .evolution-grid-full .rate-chart{height:315px}

      .investment-history-only{
        margin-top:28px;
        margin-bottom:0;
      }
      .investment-history-only .inv-head{margin-bottom:12px}
      .investment-history-only .inv-head p{max-width:850px}
      .investment-history-only .history-card{
        border:1px solid var(--line);
        border-radius:18px;
        padding:16px 18px 10px;
        overflow:hidden;
      }
      .investment-history-only .history-card h3{font-size:16px;margin:0 0 4px}
      .investment-history-only .history-card .sub{font-size:11px;color:var(--muted2);margin-bottom:8px}
      .investment-history-only .history-chart{height:300px;width:100%}
      .investment-history-only .history-chart svg{width:100%;height:100%;display:block}
      .investment-history-only .legend{margin:2px 0 8px}
      .investment-history-only .inv-history-table{font-size:12px;margin-top:8px}
      .investment-history-only .inv-history-table th{font-size:10px;padding:9px 10px}
      .investment-history-only .inv-history-table td{padding:10px}
      .investment-history-only .inv-history-table td:first-child{white-space:nowrap}
      .investment-history-only .exec-low{color:var(--red);font-weight:800}
      .investment-history-only .exec-good{color:var(--green);font-weight:800}

      .has-help-tooltip{
        position:relative!important;
        overflow:visible!important;
        cursor:help;
        z-index:1;
      }
      .has-help-tooltip:hover,
      .has-help-tooltip:focus-visible{z-index:25}
      .has-help-tooltip::after{
        content:attr(data-help);
        position:absolute;
        left:12px;
        bottom:calc(100% + 9px);
        width:min(290px,calc(100vw - 48px));
        padding:10px 12px;
        border-radius:10px;
        background:#17191d;
        color:#fff;
        font-size:11px;
        font-weight:500;
        line-height:1.45;
        letter-spacing:0;
        text-transform:none;
        box-shadow:0 12px 28px rgba(0,0,0,.22);
        opacity:0;
        visibility:hidden;
        transform:translateY(4px);
        transition:opacity .14s ease,transform .14s ease,visibility .14s ease;
        pointer-events:none;
        white-space:normal;
        text-align:left;
      }
      .has-help-tooltip:hover::after,
      .has-help-tooltip:focus-visible::after{
        opacity:1;
        visibility:visible;
        transform:translateY(0);
      }
      .kpis .kpi:nth-last-child(-n+2)::after,
      .pulse-kpis .pulse-kpi:nth-last-child(-n+2)::after{left:auto;right:12px}
      .help-dot{
        display:inline-grid;
        place-items:center;
        width:14px;
        height:14px;
        margin-left:5px;
        border-radius:50%;
        background:#f0f2f5;
        color:#667085;
        font-size:9px;
        font-weight:900;
        vertical-align:1px;
      }

      .signal-panel .panel-sub{max-width:760px}
      .signal-panel .signal{min-height:94px}
      .signal-panel .signal p{line-height:1.45}

      @media(max-width:720px){
        .evolution-grid-full .chart,
        .evolution-grid-full .rate-chart{height:250px}
        .investment-history-only{padding:16px}
        .investment-history-only .history-card{padding:13px 10px 8px;overflow:auto}
        .investment-history-only .history-chart{min-width:760px;height:270px}
        .investment-history-only .inv-history-table{min-width:840px}
        .has-help-tooltip::after{left:0;right:auto}
      }
    `;
    document.head.appendChild(style);
  }

  function isNotPaidState(){
    const hasState=typeof state!=='undefined';
    const source=String((hasState&&state.source)||'');
    const page=String((hasState&&state.page)||'paid');
    return source.indexOf('notpaid')===0 || page.indexOf('notpaid')===0;
  }

  function scopeState(){
    if(typeof investmentScope==='function'){
      try{return investmentScope()}catch(_e){}
    }
    const selected=(typeof state!=='undefined'&&Array.isArray(state.segments))?state.segments:[];
    return {
      smb:selected.some(s=>s==='PP'||s==='P') || !selected.length,
      ka:selected.some(s=>s==='M'||s==='G'||s==='XG') || !selected.length
    };
  }

  function investmentMonthData(month){
    if(typeof invData==='function'){
      try{return invData(month)}catch(_e){}
    }
    return typeof INVESTMENT_HISTORY!=='undefined'?(INVESTMENT_HISTORY[month]||null):null;
  }

  function sumFronts(month,bu,field){
    const d=investmentMonthData(month);
    if(!d||!Array.isArray(d.fronts)) return 0;
    return d.fronts.reduce((sum,row)=>sum+(row.bu===bu?(Number(row[field])||0):0),0);
  }

  function historyScopeLabel(){
    if(typeof invScopeLabel==='function'){
      try{return invScopeLabel()}catch(_e){}
    }
    const sc=scopeState();
    return sc.smb&&sc.ka?'SMB + KA + Cross':sc.smb?'SMB + 50% de Cross':sc.ka?'KA + 50% de Cross':'recorte selecionado';
  }

  function historyRow(month){
    const sc=scopeState();
    const share=sc.smb&&sc.ka?1:((sc.smb||sc.ka)?0.5:0);
    const crossPlan=sumFronts(month,'Cross','plan');
    const crossActual=sumFronts(month,'Cross','actual');
    const smbPlan=sumFronts(month,'SMB','plan');
    const smbActual=sumFronts(month,'SMB','actual');
    const kaPlan=sumFronts(month,'KA','plan');
    const kaActual=sumFronts(month,'KA','actual');
    const plan=(sc.smb?smbPlan:0)+(sc.ka?kaPlan:0)+crossPlan*share;
    const actual=(sc.smb?smbActual:0)+(sc.ka?kaActual:0)+crossActual*share;
    return {
      month,
      plan,
      actual,
      exec:plan?actual/plan*100:null,
      smb:sc.smb?smbActual+crossActual*.5:null,
      ka:sc.ka?kaActual+crossActual*.5:null,
      cross:crossActual*share
    };
  }

  function money(value){
    if(typeof money0==='function'){
      try{return money0(value)}catch(_e){}
    }
    return (Number(value)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
  }

  function shortMonth(month){
    if(typeof SHORT!=='undefined'&&SHORT[month]) return SHORT[month];
    const map=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return map[Number(String(month).slice(5,7))-1]||month;
  }

  function monthLabel(month){
    return typeof MONTH_LABEL!=='undefined'&&(MONTH_LABEL[month]||month)||month;
  }

  function investmentHistoryChart(rows){
    const w=1180,h=330,p={l:70,r:24,t:30,b:46};
    const max=Math.max(1,...rows.flatMap(r=>[r.plan,r.actual]));
    const plotH=h-p.t-p.b;
    const y=v=>p.t+plotH*(1-v/max);
    const group=(w-p.l-p.r)/Math.max(1,rows.length);
    const bw=Math.min(34,group*.28);
    const grid=[0,.5,1].map(q=>{
      const val=max*q;
      const yy=y(val);
      return `<line x1="${p.l}" y1="${yy}" x2="${w-p.r}" y2="${yy}" stroke="#e9ebef"/>`+
        `<text x="${p.l-12}" y="${yy+4}" text-anchor="end" font-size="11" fill="#98a2b3">${Math.round(val/1000)}k</text>`;
    }).join('');
    const bars=rows.map((r,i)=>{
      const cx=p.l+group*(i+.5);
      const selected=typeof state!=='undefined'&&r.month===state.month;
      const planH=Math.max(1,h-p.b-y(r.plan));
      const actualH=Math.max(1,h-p.b-y(r.actual));
      return `<rect x="${cx-bw-3}" y="${y(r.plan)}" width="${bw}" height="${planH}" rx="4" fill="#e2e5ea"><title>${monthLabel(r.month)} · Planejado ${money(r.plan)}</title></rect>`+
        `<rect x="${cx+3}" y="${y(r.actual)}" width="${bw}" height="${actualH}" rx="4" fill="${selected?'#d83a12':'#ff8566'}"><title>${monthLabel(r.month)} · Realizado ${money(r.actual)} · Execução ${r.exec===null?'n/d':r.exec.toLocaleString('pt-BR',{maximumFractionDigits:1})+'%'}</title></rect>`+
        `<text x="${cx}" y="${h-16}" text-anchor="middle" font-size="11" font-weight="${selected?'800':'500'}" fill="${selected?'#16181d':'#667085'}">${shortMonth(r.month)}${r.month==='2026-08'?'*':''}</text>`;
    }).join('');
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Histórico mensal de investimento planejado e realizado">${grid}<line x1="${p.l}" y1="${h-p.b}" x2="${w-p.r}" y2="${h-p.b}" stroke="#dfe2e7"/>${bars}</svg>`;
  }

  function investmentHistoryTable(rows){
    const sc=scopeState();
    return `<table class="inv-history-table"><thead><tr><th>Mês</th><th>Plano</th><th>Realizado</th><th>Exec.</th><th>SMB alocado</th><th>KA alocado</th><th>Cross considerado</th></tr></thead><tbody>${rows.map(r=>{
      const cls=(typeof state!=='undefined'&&r.month===state.month?'sel ':'')+(r.month==='2026-08'?'partial':'');
      const exec=r.exec===null?'—':r.exec.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';
      const execClass=r.exec===null?'':r.exec>=95?'exec-good':'exec-low';
      return `<tr class="${cls}"><td>${shortMonth(r.month)}/26</td><td>${money(r.plan)}</td><td>${money(r.actual)}</td><td class="${execClass}">${exec}</td><td>${sc.smb?money(r.smb):'—'}</td><td>${sc.ka?money(r.ka):'—'}</td><td>${money(r.cross)}</td></tr>`;
    }).join('')}</tbody></table>`;
  }

  function investmentHistoryOnlyHTML(){
    if(isNotPaidState()) return '';
    const months=(typeof DATA!=='undefined'&&Array.isArray(DATA.months)?DATA.months:[]).filter(m=>investmentMonthData(m));
    if(!months.length) return '';
    const rows=months.map(historyRow);
    const partial=rows.some(r=>r.month==='2026-08');
    return `<section class="inv-panel investment-history-only" data-section="investment"><div class="inv-head"><div><h2>Histórico · planejado x realizado</h2><p>Histórico recalculado para ${historyScopeLabel()}.${partial?' Agosto* é parcial.':''}</p></div><span class="inv-source">[2026] Acompanhamento de Investimento</span></div><div class="history-card"><div class="history-chart">${investmentHistoryChart(rows)}</div><div class="legend"><span><i style="background:#e2e5ea"></i>Planejado</span><span><i style="background:#ff8566"></i>Realizado</span></div>${investmentHistoryTable(rows)}</div></section>`;
  }

  window.investmentHTML=investmentHistoryOnlyHTML;
  addStyles();

})();
