/* PROJECT 100X P1 — holdings manager. Read-only local analytics; no trades or prices modified. */
(()=>{'use strict';
const KEY='project100x_v1',ACCOUNTS=['AI','인간','협업','통합'];
const won=n=>'₩'+Number(n).toLocaleString('ko-KR',{maximumFractionDigits:2});
const percent=n=>(n>=0?'+':'')+n.toFixed(2)+'%';
const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e};
function snapshot(data,account){
 let cash=100000,realized=0;const positions={},warnings=[];
 const trades=Array.isArray(data.trades)?data.trades:[];
 trades.forEach((t,i)=>{if(t.account!==account)return;
  const symbol=String(t.ticker||'').trim().toUpperCase(),q=Number(t.qty),price=Number(t.price);
  if(!symbol||!Number.isFinite(q)||!Number.isFinite(price)||q<=0||price<=0){warnings.push('거래 #'+(i+1)+': 잘못된 수량/가격');return;}
  if(!['매수','매도'].includes(t.side)){warnings.push('거래 #'+(i+1)+': 알 수 없는 방향');return;}
  const p=positions[symbol]??={qty:0,cost:0,realized:0,stop:null,take:null,holdDays:null,lastBuy:null};
  if(t.side==='매수'){
   if(cash+1e-8<q*price)warnings.push('거래 #'+(i+1)+': 초기자금 초과 매수 기록');
   p.qty+=q;p.cost+=q*price;cash-=q*price;
   const stop=Number(t.stop),take=Number(t.take),days=Number(t.holdDays);
   if(Number.isFinite(stop)&&stop>0&&stop<100)p.stop=stop;
   if(Number.isFinite(take)&&take>0)p.take=take;
   if(Number.isInteger(days)&&days>=1&&days<=365)p.holdDays=days;
   p.lastBuy=t.date||p.lastBuy;
  }else{
   if(q>p.qty+1e-8){warnings.push('거래 #'+(i+1)+': '+symbol+' 보유 수량 초과 매도');return;}
   const avg=p.qty?p.cost/p.qty:0,gain=q*(price-avg);
   p.qty-=q;p.cost-=q*avg;cash+=q*price;realized+=gain;p.realized+=gain;
   if(p.qty<1e-8){p.qty=0;p.cost=0;p.stop=null;p.take=null;p.holdDays=null;p.lastBuy=null;}
  }
 });
 let value=0,unknown=0,unrealized=0;
 for(const [symbol,p] of Object.entries(positions)){
  if(p.qty<=0)continue;
  const raw=data.prices?.[symbol],mark=raw===null||raw===undefined||raw===''?NaN:Number(raw);
  if(Number.isFinite(mark)&&mark>0){p.mark=mark;p.value=mark*p.qty;p.pnl=p.value-p.cost;value+=p.value;unrealized+=p.pnl;}
  else{p.mark=null;p.value=null;p.pnl=null;unknown++;}
 }
 return {positions,cash,realized,value,unknown,unrealized,warnings,equity:unknown?null:cash+value};
}
function render(){const host=document.getElementById('p1-holdings');if(!host)return;
 let data;try{data=JSON.parse(localStorage.getItem(KEY)||'{}');}catch{host.replaceChildren(make('p','저장 데이터를 읽을 수 없습니다.','warning'));return;}
 if(!data||typeof data!=='object'||Array.isArray(data))data={};
 const account=document.getElementById('accountView')?.value||'AI',s=snapshot(data,account);
 host.replaceChildren(make('h2','P1 · 보유 종목 관리'),make('p','기존 거래 기록을 읽어 계산합니다. 수수료·세금·환율·슬리피지 미반영, 시세는 직접 입력한 값입니다.','notice'));
 host.append(make('p',account+' 계좌 · 현금 '+won(s.cash)+' · 실현손익 '+won(s.realized)));
 host.append(make('p',s.unknown?'평가가격 누락 '+s.unknown+'종목 · 전체 수익률 계산 보류':'총 평가자산 '+won(s.equity)+' · 누적 수익률 '+percent((s.equity/100000-1)*100)));
 const active=Object.entries(s.positions).filter(([,p])=>p.qty>0);
 if(!active.length)host.append(make('p','현재 보유 종목이 없습니다.'));
 for(const [symbol,p] of active){
  const avg=p.cost/p.qty,entry=make('div',undefined,'entry');
  entry.append(make('h3',symbol+' · '+p.qty.toLocaleString('ko-KR')+'주'));
  entry.append(make('p','평균매수가 '+won(avg)+' · 보유 원가 '+won(p.cost)));
  entry.append(make('p',p.mark===null?'평가가격 미입력 · 미실현손익 계산 불가':'평가단가 '+won(p.mark)+' · 평가손익 '+won(p.pnl)+' ('+percent((p.mark/avg-1)*100)+')'));
  const stop=p.stop===null?null:avg*(1-p.stop/100),take=p.take===null?null:avg*(1+p.take/100);
  entry.append(make('p','손절 '+(stop===null?'미설정':won(stop)+' (-'+p.stop+'%)')+' · 익절 '+(take===null?'미설정':won(take)+' (+'+p.take+'%)')));
  const ratio=p.stop>0&&p.take>0?(p.take/p.stop).toFixed(2):null;
  entry.append(make('p','목표 손익비 '+(ratio?'1 : '+ratio:'계산 불가')+' · 목표 보유기간 '+(p.holdDays===null?'미설정':p.holdDays+'거래일')));
  if(p.lastBuy){const d=new Date(p.lastBuy);entry.append(make('p','최근 매수일 '+(Number.isNaN(d.getTime())?'날짜 확인 필요':d.toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})),'notice'));}
  if(p.mark!==null&&stop!==null&&p.mark<=stop)entry.append(make('p','손절 기준 도달 · 직접 확인 필요','warning'));
  else if(p.mark!==null&&take!==null&&p.mark>=take)entry.append(make('p','익절 목표 도달 · 직접 확인 필요','warning'));
  host.append(entry);
 }
 if(s.warnings.length){host.append(make('h3','거래 기록 점검'));s.warnings.slice(0,10).forEach(w=>host.append(make('p',w,'warning')));if(s.warnings.length>10)host.append(make('p','추가 경고 '+(s.warnings.length-10)+'건','warning'));}
 host.append(make('p','읽기 전용 화면 · 거래 수정/삭제는 가상거래 탭에서 · 실시간 감시 및 자동 주문 없음','notice'));
}
function start(){const home=document.getElementById('home');if(!home||document.getElementById('p1-holdings'))return;
 const host=make('div',undefined,'card');host.id='p1-holdings';home.append(host);
 document.getElementById('accountView')?.addEventListener('change',render);
 document.addEventListener('click',e=>{if(e.target.closest('button[data-save-price],button[data-delete-trade],button[data-delete-research],#editForm button[type="submit"],#tradeForm button[type="submit"]'))queueMicrotask(render);});
 document.getElementById('editForm')?.addEventListener('submit',()=>setTimeout(render,0));
 document.getElementById('tradeForm')?.addEventListener('submit',()=>setTimeout(render,0));
 document.getElementById('restore')?.addEventListener('change',()=>setTimeout(render,350));
 window.addEventListener('focus',render);
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
