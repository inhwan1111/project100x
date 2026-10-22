/* PROJECT 100X v0.5 — local-only risk analytics extension. No orders or market feed. */
(() => {
  'use strict';
  const KEY='project100x_v1', ACCOUNTS=['AI','인간','협업','통합'];
  const won=n=>'₩'+Number(n).toLocaleString('ko-KR',{maximumFractionDigits:2});
  const percent=n=>(n>=0?'+':'')+n.toFixed(2)+'%';
  function snapshot(data,account){
    const positions={}, trades=(data.trades||[]).filter(t=>t.account===account);
    let cash=100000,realized=0,invalid=0;
    for(const t of trades){
      const sym=String(t.ticker||'').trim().toUpperCase(),q=Number(t.qty),price=Number(t.price);
      if(!sym||!(q>0)||!(price>0)){invalid++;continue;}
      const p=positions[sym]??={qty:0,cost:0,stop:null,take:null,holdDays:null,lastBuy:null};
      if(t.side==='매수'){
        p.qty+=q;p.cost+=q*price;cash-=q*price;
        if(Number(t.stop)>0)p.stop=Number(t.stop);
        if(Number(t.take)>0)p.take=Number(t.take);
        if(Number(t.holdDays)>0)p.holdDays=Number(t.holdDays);
        p.lastBuy=t.date||null;
      }else if(t.side==='매도'){
        if(q>p.qty+1e-9){invalid++;continue;}
        const avg=p.qty?p.cost/p.qty:0;
        realized+=q*(price-avg);p.qty-=q;p.cost-=q*avg;cash+=q*price;
        if(p.qty<1e-9){p.qty=0;p.cost=0;}
      }
    }
    let value=0,unpriced=0;
    for(const [sym,p] of Object.entries(positions)){
      if(p.qty<=0)continue;
      const mark=Number(data.prices?.[sym]);
      if(mark>0){p.mark=mark;value+=mark*p.qty;}else{p.mark=null;unpriced++;}
    }
    return {positions,cash,realized,value,unpriced,invalid,trades:trades.length};
  }
  function element(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
  function draw(){
    const posHost=document.getElementById('positions'),summary=document.getElementById('summary'),account=document.getElementById('accountView')?.value;
    if(!posHost||!summary||!account)return;
    let data;try{data=JSON.parse(localStorage.getItem(KEY)||'{}');}catch{return;}
    const snap=snapshot(data,account);
    let section=document.getElementById('v05-risk-panel');
    if(!section){section=element('div',undefined,'card');section.id='v05-risk-panel';posHost.parentElement.insertAdjacentElement('afterend',section);}
    section.replaceChildren();
    section.append(element('h2','v0.5 · 거래 위험관리'),element('p','현재 보유 수량과 평균 매수가 기준의 추정치입니다. 수수료·세금·환율·슬리피지는 반영하지 않습니다.','notice'));
    const live=Object.entries(snap.positions).filter(([,p])=>p.qty>0);
    if(!live.length)section.append(element('p','현재 보유 종목이 없습니다.'));
    for(const [symbol,p] of live){
      const avg=p.cost/p.qty,stop=p.stop, take=p.take;
      const loss=stop!==null?p.cost*stop/100:null,gain=take!==null?p.cost*take/100:null;
      const ratio=loss>0&&gain!==null?gain/loss:null;
      const item=element('div',undefined,'entry');item.append(element('b',symbol+' · '+p.qty.toLocaleString('ko-KR')+'주'));
      item.append(element('p','평균 매수가 '+won(avg)+' · 보유 원가 '+won(p.cost)));
      item.append(element('p','손절 시 예상 손실: '+(loss===null?'미설정':won(loss))+' / 익절 시 목표 수익: '+(gain===null?'미설정':won(gain))));
      item.append(element('p','목표 손익비: '+(ratio===null?'계산 불가':'1 : '+ratio.toFixed(2))+' · 손실 위험/초기자금: '+(loss===null?'미설정':(loss/100000*100).toFixed(2)+'%')));
      item.append(element('p','목표 보유기간: '+(p.holdDays===null?'미설정':p.holdDays+'거래일')+' · 최근 매수일: '+(p.lastBuy?new Date(p.lastBuy).toLocaleDateString('ko-KR'):'기록 없음'),'notice'));
      if(loss===null||gain===null)item.append(element('p','거래 수정에서 손절·익절 비율을 설정하면 위험 금액과 손익비가 계산됩니다.','warning'));
      section.append(item);
    }
    const comparison=element('div',undefined,'card');comparison.id='v05-comparison';
    comparison.append(element('h2','4개 계좌 비교'),element('p','초기 가상자금은 계좌별 100,000원입니다. 평가가격이 없는 종목은 전체 수익률을 확정할 수 없습니다.','notice'));
    const table=element('div');
    for(const a of ACCOUNTS){
      const x=snapshot(data,a),equity=x.cash+x.value;
      const line=element('p',a+' · '+x.trades+'건 · '+(x.unpriced?'평가가격 미입력 '+x.unpriced+'종목': '총자산 '+won(equity)+' ('+percent((equity/100000-1)*100)+')'));
      if(a===account)line.style.fontWeight='700';table.append(line);
    }
    comparison.append(table);
    const prior=document.getElementById('v05-comparison');if(prior)prior.replaceWith(comparison);else section.insertAdjacentElement('afterend',comparison);
  }
  let pending=false;
  function start(){
    const target=document.getElementById('positions');if(!target)return;
    const observer=new MutationObserver(()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;draw();});});
    observer.observe(target,{childList:true});
    document.getElementById('accountView')?.addEventListener('change',()=>queueMicrotask(draw));
    draw();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
