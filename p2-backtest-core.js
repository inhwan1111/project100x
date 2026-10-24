/* PROJECT 100X P2 — deterministic, offline, read-only strategy research engine.
 * Input: ascending daily OHLCV bars. Signals use data through prior close;
 * orders fill at next day's open. No prediction or live execution.
 */
(function(root){'use strict';
const strategies=Object.freeze(['추세 눌림목','거래량 돌파','과매도 반등','뉴스·가격 역행','저평가 회복','이벤트 모멘텀']);
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
function validate(bars){
 if(!Array.isArray(bars)||bars.length<35)return {ok:false,reason:'최소 35거래일 OHLCV 데이터 필요'};
 let prev='';
 for(const b of bars){
  if(!b||typeof b.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||!Number.isFinite(Date.parse(b.date+'T00:00:00Z'))||new Date(b.date+'T00:00:00Z').toISOString().slice(0,10)!==b.date||b.date<=prev)return {ok:false,reason:'날짜 중복·역순·오류'};
  if(![b.open,b.high,b.low,b.close,b.volume].every(x=>typeof x==='number'&&Number.isFinite(x))||Math.min(b.open,b.high,b.low,b.close)<=0||b.volume<0||b.high<Math.max(b.open,b.close,b.low)||b.low>Math.min(b.open,b.close,b.high))return {ok:false,reason:'OHLCV 값 오류'};
  prev=b.date;
 }
 return {ok:true};
}
function signal(bars,i,strategy){
 if(!strategies.includes(strategy)||i<30)return {active:false,reason:'지표 부족 또는 미지원 전략'};
 const recent=bars.slice(i-20,i),last=bars[i-1],ma20=mean(recent.map(x=>x.close)),vol20=mean(recent.map(x=>x.volume));
 const prior=bars.slice(i-21,i-1),high20=Math.max(...prior.map(x=>x.high));
 if(strategy==='추세 눌림목')return {active:last.close>ma20&&last.low<=ma20*1.015&&last.close>bars[i-6].close,reason:'20일선 근처 상승 추세'};
 if(strategy==='거래량 돌파')return {active:last.close>high20&&last.volume>vol20*1.5,reason:'전고점 및 거래량 돌파'};
 if(strategy==='과매도 반등'){
  const changes=bars.slice(i-15,i).map((b,j,a)=>j?b.close-a[j-1].close:0).slice(1);
  const up=changes.reduce((s,x)=>s+Math.max(x,0),0),down=changes.reduce((s,x)=>s+Math.max(-x,0),0);
  const rsi=down===0?100:100-100/(1+up/down);
  return {active:rsi<30&&last.close>last.open,reason:'14일 RSI 과매도·양봉'};
 }
 return {active:false,reason:'외부 뉴스·재무·이벤트 검증 데이터 미연동: 신호 보류'};
}
function backtest(bars,strategy,options={}){
 const v=validate(bars);if(!v.ok)return {ok:false,reason:v.reason};
 if(!strategies.includes(strategy))return {ok:false,reason:'알 수 없는 전략'};
 const hold=options.holdDays??5,fee=options.costPct??0.15;
 if(!Number.isInteger(hold)||hold<1||hold>30||typeof fee!=='number'||!Number.isFinite(fee)||fee<0||fee>=10)return {ok:false,reason:'보유기간·거래비용 설정 오류'};
 // Data quality gate: missing trading days cannot be reliably distinguished
 // from holidays here, but duplicate/unsorted dates and invalid bars are blocked.
 // Reject unadjusted extreme gaps rather than silently reporting misleading P&L.
 for(let i=1;i<bars.length;i++){
  const gap=bars[i].open/bars[i-1].close;
  if(gap<0.5||gap>2)return {ok:false,reason:'전일 종가 대비 50% 초과 가격 갭 발견: 액면분할·수정주가·데이터 오류 확인 필요 ('+bars[i].date+')'};
 }
 const trades=[];let nextEligible=30;
 for(let i=30;i+hold-1<bars.length;i++){
  if(i<nextEligible)continue;
  const s=signal(bars,i,strategy);if(!s.active)continue;
  const entry=bars[i],exit=bars[i+hold-1];
  const gross=(exit.close/entry.open-1)*100;
  const net=(exit.close*(1-fee/100)/(entry.open*(1+fee/100))-1)*100;
  trades.push({signalDate:bars[i-1].date,entryDate:entry.date,exitDate:exit.date,entry:entry.open,exit:exit.close,grossPct:gross,netPct:net,reason:s.reason});
  nextEligible=i+hold;
 }
 const avg=trades.length?mean(trades.map(t=>t.netPct)):null;
 const wins=trades.filter(t=>t.netPct>0).length;
 let equity=1,peak=1,mdd=0;
 for(const t of trades){equity*=1+t.netPct/100;peak=Math.max(peak,equity);mdd=Math.max(mdd,(peak-equity)/peak*100);}
 return {ok:true,strategy,trades,count:trades.length,avgNetPct:avg,winRatePct:trades.length?wins/trades.length*100:null,compoundedReturnPct:(equity-1)*100,tradeSequenceMddPct:mdd,assumptions:'전일 종가 신호·익일 시가 매수·보유 마지막 날 종가 매도·양방향 비용. 공백기간 현금 보유. 실제 체결·슬리피지·세금·환율·포트폴리오 일별 MDD 미반영.',validatedEdge:false};
}
const api=Object.freeze({strategies,validate,signal,backtest});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root)root.Project100XBacktest=api;
})(typeof globalThis!=='undefined'?globalThis:this);
