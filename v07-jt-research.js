/* PROJECT 100X v0.7 JT Research Assistant — offline, rules-based; no AI API or orders. */
(()=>{'use strict';
const KEY='project100x_v1',ACCOUNTS=['AI','인간','협업','통합'];
const won=n=>'₩'+Number(n||0).toLocaleString('ko-KR',{maximumFractionDigits:2});
const pct=n=>(n>=0?'+':'')+n.toFixed(2)+'%';
const el=(tag,txt)=>{const x=document.createElement(tag);if(txt!==undefined)x.textContent=txt;return x;};
function read(){try{const d=JSON.parse(localStorage.getItem(KEY)||'{}');return {trades:Array.isArray(d.trades)?d.trades:[],research:Array.isArray(d.research)?d.research:[],prices:d.prices&&typeof d.prices==='object'?d.prices:{}};}catch{return {trades:[],research:[],prices:{}};}}
function calc(data,account){let cash=100000,realized=0,invalid=0;const holdings={};for(const t of data.trades.filter(t=>t.account===account)){
 const symbol=String(t.ticker||'').trim().toUpperCase(),q=Number(t.qty),price=Number(t.price);if(!symbol||!(q>0&&price>0)){invalid++;continue;}
 const p=holdings[symbol]??={qty:0,cost:0,stop:null,take:null};if(t.side==='매수'){p.qty+=q;p.cost+=q*price;cash-=q*price;if(Number(t.stop)>0)p.stop=Number(t.stop);if(Number(t.take)>0)p.take=Number(t.take);}else if(t.side==='매도'){
 if(q>p.qty+1e-9){invalid++;continue;}const avg=p.qty?p.cost/p.qty:0;p.qty-=q;p.cost-=q*avg;cash+=q*price;realized+=q*(price-avg);if(p.qty<1e-9){p.qty=0;p.cost=0;}
 }else invalid++;
 }let value=0,unknown=0;for(const [symbol,p] of Object.entries(holdings)){if(p.qty<=0)continue;const mark=Number(data.prices[symbol]);if(mark>0){p.mark=mark;value+=mark*p.qty;}else{p.mark=null;unknown++;}}return {cash,realized,holdings,value,unknown,invalid,equity:cash+value};}
function answer(kind){const data=read(),a=document.getElementById('accountView')?.value||'AI',p=calc(data,a),active=Object.entries(p.holdings).filter(([,v])=>v.qty>0),lines=[];
 if(kind==='account'){
 lines.push('['+a+' 계좌 진단]','현금 '+won(p.cash)+' · 실현손익 '+won(p.realized));
 if(p.unknown)lines.push('평가가격 미입력 '+p.unknown+'종목이 있어 총자산과 수익률은 확정할 수 없습니다.');else lines.push('총 평가자산 '+won(p.equity)+' · 누적 수익률 '+pct((p.equity/100000-1)*100));
 lines.push('보유 종목 '+active.length+'개 · 거래 기록 '+data.trades.filter(t=>t.account===a).length+'건');if(p.cash<0)lines.push('주의: 가상 현금이 음수입니다.');
 }else if(kind==='risk'){
 lines.push('['+a+' 계좌 위험 분석]');if(!active.length)lines.push('현재 보유 종목이 없습니다.');for(const [sym,h] of active){const loss=h.stop!==null?h.cost*h.stop/100:null,gain=h.take!==null?h.cost*h.take/100:null;lines.push(sym+' '+h.qty+'주 · 보유 원가 '+won(h.cost));lines.push('예상 손절 손실 '+(loss===null?'미설정':won(loss))+' · 목표 수익 '+(gain===null?'미설정':won(gain))+' · 손익비 '+(loss>0&&gain!==null?'1 : '+(gain/loss).toFixed(2):'계산 불가'));if(h.mark===null)lines.push('평가가격 미입력: 현재 수익률 확인 불가');else{const ch=(h.mark/(h.cost/h.qty)-1)*100;lines.push('직접 입력한 평가가격 기준 '+pct(ch)+(h.take!==null&&ch>=h.take?' · 익절 목표 도달':h.stop!==null&&ch<=-h.stop?' · 손절 기준 도달':''));}}
 }else if(kind==='compare'){
 lines.push('[4개 계좌 비교]');for(const ac of ACCOUNTS){const x=calc(data,ac);lines.push(ac+' · '+(x.unknown?'미평가 '+x.unknown+'종목':'총자산 '+won(x.equity)+' / '+pct((x.equity/100000-1)*100))+' · 실현손익 '+won(x.realized));}lines.push('서로 다른 거래 시점과 위험 수준을 고려하지 않은 단순 비교입니다.');
 }else if(kind==='research'){
 lines.push('[연구 기록 점검]');if(!data.research.length)lines.push('아직 연구 기록이 없습니다. 연구 탭에서 전략·근거·위험을 기록해 주세요.');else{const count={};for(const r of data.research){const s=String(r.strategy||'미분류');count[s]=(count[s]||0)+1;}lines.push('총 '+data.research.length+'건 · 전략별 '+Object.entries(count).map(([k,v])=>k+' '+v+'건').join(', '));for(const r of data.research.slice(-3).reverse())lines.push(String(r.ticker||'종목 미입력')+' · '+String(r.strategy||'미분류')+' · 근거: '+String(r.reason||'없음').slice(0,100)+' · 위험: '+String(r.risk||'없음').slice(0,80));lines.push('연구 기록과 거래 성과는 아직 자동 연결되지 않습니다.');}
 }else{lines.push('JT 연구원은 저장된 가상거래 데이터를 읽는 무료 분석 도구입니다.');}
 if(p.invalid)lines.push('참고: 현재 계좌에서 유효하지 않은 거래 '+p.invalid+'건은 계산에서 제외했습니다.');lines.push('※ 수수료·세금·환율·슬리피지 미반영. 실시간 시세나 생성형 AI 분석이 아닙니다.');return lines.join('\n');}
function start(){const home=document.getElementById('home');if(!home||document.getElementById('jt-research-v07'))return;const panel=el('div');panel.className='card';panel.id='jt-research-v07';const h=el('h2','JT 연구원 · 무료 분석 비서');const note=el('p','저장된 가상거래 데이터를 분석합니다. 외부 전송·실시간 시세·자동 주문 없음.');note.className='notice';const buttons=el('div');buttons.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin:12px 0';const output=el('div','분석 항목을 선택해 주세요.');output.setAttribute('role','status');output.setAttribute('aria-live','polite');output.style.cssText='white-space:pre-wrap;line-height:1.65;padding:12px;border:1px solid #7775;border-radius:10px;overflow-wrap:anywhere';for(const [k,label] of [['account','내 계좌 진단'],['risk','위험·손익비 분석'],['compare','4개 계좌 비교'],['research','연구 근거 점검']]){const b=el('button',label);b.type='button';b.className='secondary';b.addEventListener('click',()=>{output.textContent=answer(k);});buttons.append(b);}panel.append(h,note,buttons,output);home.append(panel);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
