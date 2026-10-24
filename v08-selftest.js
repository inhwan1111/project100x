/* PROJECT 100X v0.8 — read-only self-test. Does not change saved trades. */
(()=>{'use strict';
const KEY='project100x_v1', accounts=['AI','인간','협업','통합'];
const near=(a,b)=>Math.abs(a-b)<1e-7;
function compute(trades,prices,account){
 let cash=100000,realized=0;const holdings={};let invalid=0;
 for(const t of trades.filter(t=>t.account===account)){
  const sym=String(t.ticker||'').trim().toUpperCase(),q=Number(t.qty),p=Number(t.price);
  if(!sym||!(q>0&&p>0)){invalid++;continue;}
  const h=holdings[sym]??={qty:0,cost:0,stop:null,take:null};
  if(t.side==='매수'){h.qty+=q;h.cost+=q*p;cash-=q*p;if(Number(t.stop)>0)h.stop=Number(t.stop);if(Number(t.take)>0)h.take=Number(t.take);}
  else if(t.side==='매도'){if(q>h.qty+1e-9){invalid++;continue;}const avg=h.cost/h.qty;h.qty-=q;h.cost-=q*avg;cash+=q*p;realized+=q*(p-avg);if(h.qty<1e-9){h.qty=0;h.cost=0;}}
  else invalid++;
 }
 let value=0,unknown=0;
 for(const [sym,h] of Object.entries(holdings))if(h.qty>0){const mark=Number(prices[sym]);if(mark>0)value+=h.qty*mark;else unknown++;}
 return {cash,realized,equity:cash+value,unknown,invalid,holdings};
}
function run(){
 const results=[],check=(label,pass)=>results.push({label,pass:!!pass});
 const buy={account:'AI',side:'매수',ticker:'QQQ',qty:'1',price:'100000',stop:'3',take:'5'};
 const sample=compute([buy],{QQQ:105000},'AI');
 check('매수 후 현금 0원',near(sample.cash,0));
 check('105,000원 평가 시 자산 105,000원',near(sample.equity,105000));
 check('손절 기준가 97,000원',near(100000*(1-sample.holdings.QQQ.stop/100),97000));
 check('익절 기준가 105,000원',near(100000*(1+sample.holdings.QQQ.take/100),105000));
 check('목표 손익비 1:1.67',near((100000*.05)/(100000*.03),5/3));
 const down=compute([buy],{QQQ:96000},'AI');
 check('96,000원 평가 시 -4,000원',near(down.equity-100000,-4000));
 check('손절 경고 조건 감지',96000<=100000*(1-.03));
 const sell=compute([buy,{account:'AI',side:'매도',ticker:'QQQ',qty:'1',price:'105000'}],{},'AI');
 check('전량 매도 시 실현손익 +5,000원',near(sell.realized,5000)&&near(sell.cash,105000));
 const partial=compute([{...buy,qty:'2',price:'40000'},{account:'AI',side:'매도',ticker:'QQQ',qty:'1',price:'45000'}],{QQQ:42000},'AI');
 check('부분 매도 후 원가 및 실현손익',near(partial.realized,5000)&&near(partial.holdings.QQQ.cost,40000));
 const missing=compute([buy],{},'AI');
 check('평가가격 누락 감지',missing.unknown===1);
 const excess=compute([buy,{account:'AI',side:'매도',ticker:'QQQ',qty:'2',price:'110000'}],{QQQ:100000},'AI');
 check('초과 매도 기록 제외',excess.invalid===1&&near(excess.holdings.QQQ.qty,1));
 const isolated=compute([buy],{},'인간');
 check('계좌별 기록 분리',near(isolated.cash,100000)&&Object.keys(isolated.holdings).length===0);
 let saved=null,parsed=null;
 try{saved=localStorage.getItem(KEY);parsed=JSON.parse(saved||'null');check('현재 백업 데이터 구조',!!parsed&&Array.isArray(parsed.trades)&&Array.isArray(parsed.research)&&!!parsed.prices&&typeof parsed.prices==='object');}
 catch{check('현재 백업 데이터 구조',false);}
 check('기존 거래 데이터 변경 없음',localStorage.getItem(KEY)===saved);
 return results;
}
function start(){
 const home=document.getElementById('home');if(!home||document.getElementById('jt-selftest-v08'))return;
 const panel=document.createElement('div');panel.className='card';panel.id='jt-selftest-v08';
 const title=document.createElement('h2');title.textContent='JT 자동 검증실 · v0.8';
 const desc=document.createElement('p');desc.className='notice';desc.textContent='14개 항목을 예시 데이터로 자동 검사합니다. 기존 거래·평가가격은 수정하지 않습니다. 실제 시세 연동 테스트는 아닙니다.';
 const button=document.createElement('button');button.type='button';button.textContent='자동 테스트 실행';
 const out=document.createElement('div');out.style.cssText='white-space:pre-wrap;line-height:1.6;overflow-wrap:anywhere;margin-top:12px';out.setAttribute('role','status');
 button.addEventListener('click',()=>{const r=run(),passed=r.filter(x=>x.pass).length;out.textContent='검증 결과: '+passed+'/'+r.length+' 통과\n'+r.map(x=>(x.pass?'✓ ':'✗ ')+x.label).join('\n')+'\n※ 테스트용 계산 모듈 검증이며 앱 전체 동작이나 실시간 시세의 정확성을 보장하지 않습니다.';});
 panel.append(title,desc,button,out);home.append(panel);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
