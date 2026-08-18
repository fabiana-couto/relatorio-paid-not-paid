(function(){
  if(typeof investmentHTML!=='function') return;
  const baseInvestmentHTML=investmentHTML;

  invHistoryChart=function(){
    let ms=DATA.months.filter(m=>invData(m)),w=700,h=220,p={l:42,r:14,t:18,b:35};
    let mx=Math.max(1,...ms.map(m=>invScopedTotal('actual',m))),gw=(w-p.l-p.r)/ms.length,bw=Math.min(38,gw*.5),y=v=>p.t+(h-p.t-p.b)*(1-v/mx);
    let grid=[0,.5,1].map(q=>`<line x1="${p.l}" y1="${y(mx*q)}" x2="${w-p.r}" y2="${y(mx*q)}" stroke="#eceef1"/><text x="${p.l-6}" y="${y(mx*q)+3}" text-anchor="end" font-size="8" fill="#98a2b3">${Math.round(mx*q/1000)}k</text>`).join('');
    let bars=ms.map((m,i)=>{let cx=p.l+gw*i+gw/2,ac=invScopedTotal('actual',m),sel=m===state.month,lab=SHORT[m]+(m==='2026-08'?'*':'');return `<rect x="${cx-bw/2}" y="${y(ac)}" width="${bw}" height="${h-p.b-y(ac)}" rx="4" fill="${sel?'#d83a12':'#ff8a68'}"><title>${MONTH_LABEL[m]} · Realizado ${brl(ac)} · ${invScopeLabel()}</title></rect><text x="${cx}" y="${h-12}" text-anchor="middle" font-size="9" font-weight="${sel?'700':'400'}" fill="${sel?'#191919':'#667085'}">${lab}</text>`}).join('');
    return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%">${grid}${bars}</svg>`;
  };

  investmentTable=function(){
    let sc=investmentScope(),head=`<th>Mês</th><th>Realizado</th>${sc.smb?'<th>SMB alocado</th>':''}${sc.ka?'<th>KA alocado</th>':''}<th>Cross considerado</th>`;
    let rows=DATA.months.filter(m=>invData(m)).map(m=>{let a=invScopedTotal('actual',m),cls=(m===state.month?'sel ':'')+(m==='2026-08'?'partial':'');return `<tr class="${cls}"><td>${SHORT[m]}/26</td><td>${money0(a)}</td>${sc.smb?`<td>${money0(invAllocated('SMB','actual',m))}</td>`:''}${sc.ka?`<td>${money0(invAllocated('KA','actual',m))}</td>`:''}<td>${money0(invCrossScoped('actual',m))}</td></tr>`}).join('');
    return `<table class="inv-history-table"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
  };

  investmentHTML=function(){
    let h=baseInvestmentHTML();
    if(!h) return h;
    h=h.replace('Histórico · planejado x realizado','Histórico de investimento realizado');
    h=h.replace('<span><i style="background:#e5e7eb"></i>Planejado</span>','');
    h=h.replace('<span><i style="background:#ff8a68"></i>Realizado</span>','<span><i style="background:#ff8a68"></i>Investimento realizado</span>');
    h=h.replace(/<span>(?:—|[\d.,]+%) de R\$[^<]+ planejados · ([^<]+)<\/span>/g,'<span>$1</span>');
    h=h.replace(/<span>[\d.,]+% do plano SMB<\/span>/g,'<span>SMB exclusivo + 50% de Cross</span>');
    h=h.replace(/<span>[\d.,]+% do plano KA<\/span>/g,'<span>KA exclusivo + 50% de Cross</span>');
    h=h.replace(/ · plano R\$[^<]+/g,'');
    h=h.replace(/<div class="inv-insight"><strong>(?:—|[\d.,]+%) do plano do recorte executado\.<\/strong>[^<]*<\/div>/g,'<div class="inv-insight"><strong>Histórico do realizado.</strong> A tendência mensal mostra a evolução da verba sem misturar com planejamento.</div>');
    return h;
  };

  render();
})();
