(function(){
  const BUDGET_HISTORY={"2026-01":{"official":{"plan":421225.64,"actual":405448.8637},"SMB":{"plan":81626.0,"actual":67520.71502},"KA":{"plan":106000.0,"actual":105766.16000000002},"Cross":{"plan":233600.0,"actual":232161.98865999997}},"2026-02":{"official":{"plan":443064.24,"actual":419441.0868},"SMB":{"plan":87668.29000000001,"actual":47727.40136},"KA":{"plan":173074.44,"actual":171458.70999999996},"Cross":{"plan":182321.51,"actual":200254.97548}},"2026-03":{"official":{"plan":593766.29,"actual":591174.867},"SMB":{"plan":119822.0,"actual":122912.43178000001},"KA":{"plan":231806.11,"actual":221227.94531999997},"Cross":{"plan":250137.43,"actual":247034.48986}},"2026-04":{"official":{"plan":642839.764,"actual":570229.6617},"SMB":{"plan":128225.0,"actual":95897.2116},"KA":{"plan":254000.0,"actual":221497.3272},"Cross":{"plan":265277.89,"actual":264685.9021}},"2026-05":{"official":{"plan":621642.7001,"actual":563685.7883},"SMB":{"plan":108061.0,"actual":50679.15556000001},"KA":{"plan":290000.35,"actual":269424.96636},"Cross":{"plan":248489.0,"actual":245547.15172}},"2026-06":{"official":{"plan":589166.0406,"actual":631687.2486},"SMB":{"plan":105417.0,"actual":81338.28826},"KA":{"plan":249250.0,"actual":266118.34214},"Cross":{"plan":289000.0,"actual":287260.15632}},"2026-07":{"official":{"plan":634897.24,"actual":607267.2238},"SMB":{"plan":127432.0,"actual":135834.78671999997},"KA":{"plan":222155.24,"actual":247632.34332},"Cross":{"plan":285310.0,"actual":305874.5762}},"2026-08":{"official":{"plan":537089.8,"actual":null},"SMB":{"plan":115801.6,"actual":null},"KA":{"plan":179144.2,"actual":null},"Cross":{"plan":252143.99999999997,"actual":null}}};
  function budgetData(month=state.month){return BUDGET_HISTORY[month]||null}
  function budgetScoped(field,month=state.month){
    const b=budgetData(month),sc=investmentScope();if(!b)return 0;
    if(field==='actual'&&month==='2026-08')return invScopedTotal('actual',month);
    if(sc.smb&&sc.ka)return Number(b.official[field]||0);
    if(sc.smb)return Number(b.SMB[field]||0)+Number(b.Cross[field]||0)/2;
    if(sc.ka)return Number(b.KA[field]||0)+Number(b.Cross[field]||0)/2;
    return 0;
  }
  function budgetBuAllocated(kind,field,month=state.month){
    const b=budgetData(month);if(!b)return 0;
    if(field==='actual'&&month==='2026-08')return invAllocated(kind,'actual',month);
    return Number(b[kind][field]||0)+Number(b.Cross[field]||0)/2;
  }
  function budgetVs(month){const p=budgetScoped('plan',month),a=budgetScoped('actual',month);return p&&month!=='2026-08'?(a/p-1)*100:null}
  function budgetVsLabel(month){const v=budgetVs(month);if(month==='2026-08')return 'parcial';if(v===null)return 'n/d';return (v>=0?'+':'')+v.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%'}

  invHistoryChart=function(){
    const ms=DATA.months.filter(m=>budgetData(m)),w=700,h=235,p={l:46,r:14,t:30,b:38};
    const mx=Math.max(1,...ms.map(m=>budgetScoped('actual',m))),gw=(w-p.l-p.r)/ms.length,bw=Math.min(40,gw*.52),y=v=>p.t+(h-p.t-p.b)*(1-v/mx);
    const grid=[0,.5,1].map(q=>`<line x1="${p.l}" y1="${y(mx*q)}" x2="${w-p.r}" y2="${y(mx*q)}" stroke="#eceef1"/><text x="${p.l-6}" y="${y(mx*q)+3}" text-anchor="end" font-size="8" fill="#98a2b3">${Math.round(mx*q/1000)}k</text>`).join('');
    const bars=ms.map((m,i)=>{const cx=p.l+gw*i+gw/2,ac=budgetScoped('actual',m),pl=budgetScoped('plan',m),sel=m===state.month,lab=SHORT[m]+(m==='2026-08'?'*':''),vs=budgetVsLabel(m),ty=Math.max(14,y(ac)-7);return `<rect x="${cx-bw/2}" y="${y(ac)}" width="${bw}" height="${h-p.b-y(ac)}" rx="4" fill="${sel?'#d83a12':'#ff8a68'}"><title>${MONTH_LABEL[m]} · Realizado ${brl(ac)} · Budget ${brl(pl)} · ${m==='2026-08'?'parcial até o corte':vs+' vs budget'} · ${invScopeLabel()}</title></rect><text x="${cx}" y="${ty}" text-anchor="middle" font-size="8" font-weight="700" fill="${m==='2026-08'?'#667085':(budgetVs(m)>0?'#b54708':'#16875b')}">${vs}</text><text x="${cx}" y="${h-12}" text-anchor="middle" font-size="9" font-weight="${sel?'700':'400'}" fill="${sel?'#191919':'#667085'}">${lab}</text>`}).join('');
    return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%">${grid}${bars}</svg>`;
  };

  investmentTable=function(){
    const rows=DATA.months.filter(m=>budgetData(m)).map(m=>{const a=budgetScoped('actual',m),cls=(m===state.month?'sel ':'')+(m==='2026-08'?'partial':'');return `<tr class="${cls}"><td>${SHORT[m]}/26</td><td>${money0(a)}</td><td>${budgetVsLabel(m)}</td></tr>`}).join('');
    return `<table class="inv-history-table"><thead><tr><th>Mês</th><th>Realizado</th><th>vs budget</th></tr></thead><tbody>${rows}</tbody></table>`;
  };

  invCostSeries=function(kind){const seg=kind==='SMB'?['PP','P']:['M','G','XG'];return DATA.months.map(m=>{const s=totalView('media','sql',m,seg),a=budgetBuAllocated(kind,'actual',m);return s>0?a/s:null})};
  invCostSqlChart=function(){
    const ms=DATA.months.filter(m=>budgetData(m)),sc=investmentScope(),smb=invCostSeries('SMB'),ka=invCostSeries('KA'),active=[];if(sc.smb)active.push(smb);if(sc.ka)active.push(ka);const vals=active.flat().filter(v=>v!==null&&Number.isFinite(v)),mx=Math.max(1,...vals),w=620,h=220,p={l:48,r:18,t:18,b:35},x=i=>p.l+i*(w-p.l-p.r)/Math.max(1,ms.length-1),y=v=>p.t+(h-p.t-p.b)*(1-v/mx);
    const grid=[0,.5,1].map(q=>`<line x1="${p.l}" y1="${y(mx*q)}" x2="${w-p.r}" y2="${y(mx*q)}" stroke="#eceef1"/><text x="${p.l-6}" y="${y(mx*q)+3}" text-anchor="end" font-size="8" fill="#98a2b3">${money0(mx*q).replace('R$ ','R$')}</text>`).join('');
    const line=(arr,color)=>{const pts=arr.map((v,i)=>v===null?null:`${x(i)},${y(v)}`).filter(Boolean).join(' '),dots=arr.map((v,i)=>v===null?'':`<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="${color}"><title>${MONTH_LABEL[ms[i]]}: ${money0(v)}</title></circle>`).join('');return `<polyline fill="none" stroke="${color}" stroke-width="2.5" points="${pts}"/>${dots}`};
    const labels=ms.map((m,i)=>`<text x="${x(i)}" y="${h-12}" text-anchor="middle" font-size="9" fill="#667085">${SHORT[m]}${m==='2026-08'?'*':''}</text>`).join('');
    return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%">${grid}${labels}${sc.smb?line(smb,'#ff4719'):''}${sc.ka?line(ka,'#2a2a2a'):''}</svg>`;
  };

  const baseBudgetInvestmentHTML=investmentHTML;
  investmentHTML=function(){
    let h=baseBudgetInvestmentHTML();if(!h)return h;
    h=h.replace(/<span class="inv-source">[^<]*<\/span>/,'<span class="inv-source">Mês/frentes: Acompanhamento de Investimento · Histórico: Planejamento de Budget</span>');
    h=h.replace(/<h3>Histórico de investimento realizado<\/h3><div class="sub">[^<]*<\/div>/,'<h3>Histórico de investimento realizado</h3><div class="sub">Jan–Jul: histórico de budget da aba Planejamento de Mídia. O número sobre a barra é o desvio vs budget; Ago* usa o realizado do acompanhamento atual e fica marcado como parcial.</div>');
    h=h.replace('<div class="legend"><span><i style="background:#ff8a68"></i>Investimento realizado</span></div>','<div class="legend"><span><i style="background:#ff8a68"></i>Investimento realizado</span><span>vs budget nos meses fechados</span></div>');
    h=h.replace(/<h3>Custo por SQL · tendência por BU selecionada<\/h3><div class="sub">[^<]*<\/div>/,'<h3>Custo por SQL · tendência por BU selecionada</h3><div class="sub">Jan–Jul usa o realizado histórico por BU da planilha de budget; Ago* usa o acompanhamento atual. Investimento ÷ SQL da régua Tipo de mídia / Canal.</div>');
    h=h.replace(/<div class="inv-insight"><strong>Histórico do realizado\.<\/strong>[^<]*<\/div>/,'<div class="inv-insight"><strong>Histórico com contexto de budget.</strong> A barra mostra somente o realizado; o pequeno indicador mostra o desvio vs budget nos meses fechados. Agosto* não recebe percentual por ser parcial.</div>');
    return h;
  };
  render();
})();
