/* PROJECT 100X P2 lab: local OHLCV CSV backtesting, no storage writes/network/orders. */
(()=>{'use strict';
const make=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e};
function parse(text){
 if(typeof text!=='string'||text.length>2_000_000)throw Error('CSV 최대 크기는 2MB입니다.');
 const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/);
 if(lines.length<36||lines.length>10001)throw Error('헤더 포함 36~10,001행만 허용합니다.');
 const head=lines.shift().split(',').map(x=>x.trim().toLowerCase());
 const fields=['date','open','high','low','close','volume'];
 if(fields.some(x=>!head.includes(x))||new Set(head).size!==head.length)throw Error('필수 열: date,open,high,low,close,volume (중복 열 불가)');
 return lines.map((line,i)=>{
  const cells=line.split(',').map(x=>x.trim());
  if(cells.length!==head.length)throw Error((i+2)+'행 열 개수가 다릅니다.');
  const b={date:cells[head.indexOf('date')]};
  for(const k of fields.slice(1)){const raw=cells[head.indexOf(k)];if(!raw)throw Error((i+2)+'행 '+k+' 누락');b[k]=Number(raw);}
  return b;
 });
}
function init(){
 const home=document.getElementById('home'),B=window.Project100XBacktest;
 if(!home||!B||document.getElementById('p100x-p2-lab'))return;
 const card=make('div');card.className='card';card.id='p100x-p2-lab';
 card.append(make('h2','P2 · 과거 데이터 백테스트 연구실'));
 card.append(make('p','CSV 일별 시세를 이 기기에서만 분석합니다. 실시간 시세·실제 주문·종목 추천이 아닙니다. 미래 데이터 참조 방지 및 수익성 검증은 추가 검토가 필요합니다.'));
 const label=make('label','일별 OHLCV CSV 파일 (최소 35거래일)');const file=make('input');file.type='file';file.accept='.csv,text/csv';label.append(file);card.append(label);
 const format=make('p','필수 열: date,open,high,low,close,volume / 날짜 오름차순 / 예: 2026-01-02,100,105,99,102,150000');format.className='notice';card.append(format);
 const sl=make('label','전략 선택'),select=make('select');for(const s of B.strategies){const o=make('option',s);o.value=s;select.append(o)}sl.append(select);card.append(sl);
 const hl=make('label','보유 거래일 (1~30)'),hold=make('input');hold.type='number';hold.min='1';hold.max='30';hold.step='1';hold.value='5';hl.append(hold);card.append(hl);
 const cl=make('label','매수·매도 각 거래비용 (%)'),cost=make('input');cost.type='number';cost.min='0';cost.max='9.99';cost.step='0.01';cost.value='0.15';cl.append(cost);card.append(cl);
 const run=make('button','CSV 백테스트 실행'),out=make('div');out.setAttribute('role','status');out.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.7;margin-top:12px';card.append(run,out);
 run.addEventListener('click',async()=>{
  out.textContent='';
  try{
   const f=file.files?.[0];if(!f)throw Error('CSV 파일을 선택하세요.');if(f.size>2_000_000)throw Error('파일이 2MB를 초과합니다.');
   const bars=parse(await f.text()),result=B.backtest(bars,select.value,{holdDays:Number(hold.value),costPct:Number(cost.value)});
   if(!result.ok)throw Error(result.reason);
   const fmt=x=>x===null?'표본 없음':x.toFixed(2)+'%';
   out.textContent='전략: '+result.strategy+'\n거래 횟수: '+result.count+'\n승률: '+fmt(result.winRatePct)+'\n평균 거래 순수익률: '+fmt(result.avgNetPct)+'\n거래별 순차 복리 수익률: '+fmt(result.compoundedReturnPct)+'\n거래 종료 시점 기준 최대낙폭: '+fmt(result.tradeSequenceMddPct)+'\n\n주의: '+result.assumptions+'\n검증된 투자 우위: 아니오. 데이터 출처·기업행동·분할·생존편향·미사용 기간 검증 필요.';
  }catch(e){out.textContent='실행 중단: '+(e.message||e)}
 });
 home.append(card);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.Project100XBacktestCSV={parse};
})();
