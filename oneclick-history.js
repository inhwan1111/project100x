/* PROJECT 100X: read-only historical research diagnostics. */
(()=>{'use strict';
const el=(t,s)=>{const n=document.createElement(t);n.textContent=s;return n};
const fmt=n=>Number.isFinite(n)?n.toFixed(2)+'%':'—';
function parse(csv){
 const lines=csv.replace(/^\uFEFF/,'').trim().split(/\r?\n/);
 if(lines[0]?.trim()!=='timestamp,open,high,low,close,volume')throw Error('CSV 헤더 불일치');
 return lines.slice(1).map((line,i)=>{
  const a=line.split(',');if(a.length!==6)throw Error('CSV 열 오류: '+(i+2));
  return {date:a[0],open:Number(a[1]),high:Number(a[2]),low:Number(a[3]),close:Number(a[4]),volume:Number(a[5])};
 }).reverse();
}
function report(engine,bars,strategy,from,to){
 // Warmup bars before the requested window are allowed for indicators,
 // but no trades may start before 'from' or exit after 'to'.
 const hold=5,fee=0.15,trades=[];
 let eligible=from;
 for(let i=Math.max(from,30);i+hold-1<to;i++){
  if(i<eligible)continue;
  const s=engine.signal(bars,i,strategy);if(!s.active)continue;
  const entry=bars[i],exit=bars[i+hold-1];
  const net=(exit.close*(1-fee/100)/(entry.open*(1+fee/100))-1)*100;
  trades.push(net);eligible=i+hold;
 }
 let equity=1,peak=1,mdd=0;
 for(const net of trades){equity*=1+net/100;peak=Math.max(peak,equity);mdd=Math.max(mdd,(peak-equity)/peak*100)}
 return {count:trades.length,wins:trades.filter(x=>x>0).length,avg:trades.length?trades.reduce((a,b)=>a+b,0)/trades.length:null,compound:(equity-1)*100,mdd};
}
function line(title,r){
 if(!r.count)return title+': 완료 거래 0건 · 평가 불가';
 return title+': '+r.count+'건 · 승률 '+(100*r.wins/r.count).toFixed(1)+'% · 평균 '+fmt(r.avg)+' · 거래별 복리 '+fmt(r.compound)+' · 거래 순서 기준 MDD '+fmt(r.mdd)+(r.count<30?' · 표본 부족':'');
}
function init(){
 const box=document.getElementById('p100x-oneclick');if(!box){setTimeout(init,300);return}
 const button=box.querySelector('button');if(!button){setTimeout(init,300);return}
 if(document.getElementById('p100x-history-panel'))return;
 const panel=el('div','');panel.id='p100x-history-panel';
 panel.append(el('h3','과거 전략 성과 · 대기 중'),el('p','위 분석 버튼을 누르면 결과가 표시됩니다.'));box.append(panel);
 async function run(){
  panel.replaceChildren(el('p','과거 성과 검증 중…'));
  try{
   const [sr,cr]=await Promise.all([
    fetch('./market-data/status.json?t='+Date.now(),{cache:'no-store'}),
    fetch('./market-data/QQQ-daily.csv?t='+Date.now(),{cache:'no-store'})
   ]);
   if(!sr.ok||!cr.ok)throw Error('시세/상태 파일 접근 실패');
   const status=await sr.json(),bars=parse(await cr.text());
   const engine=globalThis.Project100XBacktest;
   if(!engine||typeof engine.validate!=='function'||typeof engine.signal!=='function'||typeof engine.backtest!=='function')throw Error('전략 엔진 없음');
   const v=engine.validate(bars);if(!v.ok)throw Error(v.reason);
   if(status.symbol!=='QQQ'||status.rows!==bars.length||status.latestDate!==bars.at(-1).date)throw Error('상태 파일과 시세 불일치');
   const age=(Date.now()-Date.parse(status.updatedAt))/86400000;
   if(!Number.isFinite(age)||age< -1||age>4)throw Error('수집 시각 오류 또는 오래된 데이터');
   // Reuse core data-quality gate (including extreme unadjusted price gaps).
   const sanity=engine.backtest(bars,engine.strategies[0],{holdDays:5,costPct:0.15});
   if(!sanity.ok)throw Error(sanity.reason);
   panel.replaceChildren(el('h3','QQQ 과거 전략 성과 · 진단'));
   panel.append(el('p','자료: '+bars[0].date+' ~ '+bars.at(-1).date+' · '+bars.length+'거래일 · 5거래일 보유 · 매수/매도 각 0.15% 비용'));
   const split=Math.max(35,Math.floor(bars.length*.7));
   panel.append(el('p','구간 비교: 앞 '+split+'거래일 / 뒤 '+(bars.length-split)+'거래일. 뒤 구간은 과거 데이터의 단순 분할이며 독립적인 미래 검증이 아닙니다.'));
   const list=el('ul');
   for(const strategy of engine.strategies.slice(0,3)){
    const group=el('li','');group.append(el('strong',strategy));
    const details=el('div','');details.style.cssText='white-space:pre-line;line-height:1.65;margin:6px 0 15px';
    const all=report(engine,bars,strategy,30,bars.length);
    const first=report(engine,bars,strategy,30,split);
    const last=report(engine,bars,strategy,split,bars.length);
    details.textContent=[line('전체',all),line('앞 구간',first),line('뒤 구간',last)].join('\n');
    group.append(details);list.append(group);
   }
   panel.append(list,el('p','MDD는 거래별 수익률을 순서대로 복리 적용한 낙폭입니다. 일별 계좌 잔고의 최대 낙폭이 아닙니다. 기간 경계에 걸치는 거래는 각 분할 구간에서 제외됩니다.'));
   panel.append(el('p','과최적화 주의: 이미 관찰한 과거 구간이므로 이 비교만으로 전략을 선택하거나 파라미터를 조정하면 검증 편향이 발생합니다. 신호는 이전 거래일 정보만 사용하고 다음 거래일 시가에 진입합니다.'));
   panel.append(el('p','뉴스·수급·시장심리 미연결 · 실거래·세금·환율·슬리피지 미반영 · 가상투자 기록 변경 없음 · 투자 추천 아님'));
  }catch(e){panel.replaceChildren(el('p','⚠️ 과거 성과 분석 보류: '+e.message+' · 가상투자 기록 변경 없음'))}
 }
 button.addEventListener('click',run);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
