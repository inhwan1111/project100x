(()=>{'use strict';
const el=(t,s)=>{const n=document.createElement(t);n.textContent=s;return n};
function init(){
const box=document.getElementById('p100x-oneclick');if(!box)return;
const button=box.querySelector('button');if(!button)return;
const panel=el('div','');panel.id='p100x-history-panel';box.append(panel);
const run=async()=>{
panel.replaceChildren(el('p','과거 성과 계산 중…'));
try{
const response=await fetch('./market-data/QQQ-daily.csv?ts='+Date.now(),{cache:'no-store'});
if(!response.ok)throw Error('시세 파일 접근 실패');
const lines=(await response.text()).trim().split(/\r?\n/);
if(lines[0]!=='timestamp,open,high,low,close,volume')throw Error('헤더 불일치');
const bars=lines.slice(1).map(line=>{const a=line.split(',');return {date:a[0],open:Number(a[1]),high:Number(a[2]),low:Number(a[3]),close:Number(a[4]),volume:Number(a[5])}}).reverse();
const engine=globalThis.Project100XBacktest;
if(!engine)throw Error('기존 백테스트 엔진 없음');
const v=engine.validate(bars);if(!v.ok)throw Error(v.reason);
panel.replaceChildren(el('h3','QQQ 과거 전략 성과 · 연구용'));
panel.append(el('p','과거 '+bars.length+'거래일 · 5거래일 보유 · 매수/매도 각각 0.15% 비용 가정. 미래 성과 보장 없음.'));
const list=el('ul');
for(const strategy of engine.strategies.slice(0,3)){
const r=engine.backtest(bars,strategy,{holdDays:5,costPct:0.15});
let summary=strategy+': ';
if(!r.ok)summary+='검증 보류 ('+r.reason+')';
else if(!r.count)summary+='완료된 가상거래 0건 · 성과 판단 불가';
else summary+=r.count+'건 · 승률 '+r.winRatePct.toFixed(1)+'% · 평균 순수익률 '+r.avgNetPct.toFixed(2)+'% · 거래별 복리수익률 '+r.compoundedReturnPct.toFixed(2)+'%';
list.append(el('li',summary));
}
panel.append(list,el('p','주의: 짧은 표본의 과거 모의실험이며 실제 체결·세금·환율·슬리피지·독립 검증을 반영하지 않습니다. 투자 추천이 아닙니다.'));
}catch(e){panel.replaceChildren(el('p','⚠️ 과거 성과 분석 보류: '+e.message));}
};
button.addEventListener('click',run);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();