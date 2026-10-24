/* PROJECT 100X v0.6 — read-only performance snapshot. No orders, no writes. */
(()=>{'use strict';
const KEY='project100x_v1',ACCOUNTS=['AI','인간','협업','통합'];
const fmt=n=>'₩'+n.toLocaleString('ko-KR',{maximumFractionDigits:2});
function analyze(data,account){
 let cash=100000,realized=0,invalid=0;const holdings={};
 for(const t of data.trades.filter(t=>t.account===account)){
  const sym=String(t.ticker||'').trim().toUpperCase(),q=Number(t.qty),p=Number(t.price);
  if(!sym||!(q>0&&p>0)||!['매수','매도'].includes(t.side)){invalid++;continue;}
  const h=holdings[sym]??={qty:0,cost:0};
  if(t.side==='매수'){h.qty+=q;h.cost+=q*p;cash-=q*p;}
  else{if(q>h.qty+1e-9){invalid++;continue;}const avg=h.cost/h.qty;h.qty-=q;h.cost-=q*avg;cash+=q*p;realized+=q*(p-avg);}
 }
 let value=0,missing=0,unrealized=0,held=0;
 for(const [sym,h] of Object.entries(holdings))if(h.qty>1e-9){held++;const mark=Number(data.prices[sym]);if(mark>0&&Number.isFinite(mark)){value+=mark*h.qty;unrealized+=mark*h.qty-h.cost;}else missing++;}
 return {cash,realized,unrealized,held,missing,invalid,equity:missing?null:cash+value,returnPct:missing?null:(cash+value-100000)/1000};
}
function draw(){
 const home=document.getElementById('home');if(!home)return;
 let card=document.getElementById('v06-performance');if(!card){card=document.createElement('div');card.className='card';card.id='v06-performance';home.append(card);}
 let data;try{data=JSON.parse(localStorage.getItem(KEY)||'{}');}catch{data={};}
 if(!Array.isArray(data.trades))data.trades=[];if(!data.prices||typeof data.prices!=='object')data.prices={};
 card.replaceChildren();const title=document.createElement('h2');title.textContent='v0.6 · 성과 분석';card.append(title);
 const note=document.createElement('p');note.className='notice';note.textContent='계좌별 초기자금 100,000원. 직접 입력한 평가가격 기준이며 실시간 시세·수수료·세금·환율은 미반영입니다. 기록을 변경하지 않습니다.';card.append(note);
 for(const account of ACCOUNTS){const p=analyze(data,account),row=document.createElement('p');
 row.textContent=account+' · 거래 '+data.trades.filter(t=>t.account===account).length+'건 · 보유 '+p.held+'종목 · 실현 '+fmt(p.realized)+' · 미실현 '+(p.missing?'일부 미평가':fmt(p.unrealized))+' · 수익률 '+(p.returnPct===null?'평가가격 필요':p.returnPct.toFixed(2)+'%')+(p.invalid?' · 오류 '+p.invalid+'건':'');
 card.append(row);}
 const warning=document.createElement('p');warning.className='warning';warning.textContent='현재 평가손익 스냅샷이며 기간별 수익률·최대낙폭(MDD)·승률은 계산하지 않습니다.';card.append(warning);
}
function start(){const home=document.getElementById('home');if(!home)return;draw();document.getElementById('accountView')?.addEventListener('change',draw);document.getElementById('nav')?.addEventListener('click',()=>{setTimeout(draw,0)});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
