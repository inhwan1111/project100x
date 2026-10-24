/* PROJECT 100X regression suite v0.9.2 — read-only, no persistence or network. */
(()=>{'use strict';
function run(){
 const C=window.Project100XCore,M=window.Project100XMarketDataV09;
 const checks=[],test=(name,fn)=>{try{checks.push({name,ok:!!fn()})}catch(e){checks.push({name,ok:false,error:String(e.message||e)})}};
 if(!C||!M)return [{name:'필수 모듈 로드',ok:false}];
 const buy=(qty=1,price=40000,account='AI')=>({account,side:'매수',ticker:'QQQ',qty,price});
 const sell=(qty=1,price=45000,account='AI')=>({account,side:'매도',ticker:'QQQ',qty,price});
 const eq=(a,b)=>Math.abs(a-b)<1e-7;
 test('빈 계좌 초기 현금',()=>eq(C.evaluate([],{},'AI').cash,100000));
 test('계좌별 자산 독립',()=>eq(C.evaluate([buy()],{},'인간').cash,100000));
 test('매수 현금 차감',()=>eq(C.evaluate([buy()],{QQQ:40000},'AI').cash,60000));
 test('평가 수익률',()=>eq(C.evaluate([buy()],{QQQ:42000},'AI').returnPct,2));
 test('부분 매도 실현 손익',()=>eq(C.evaluate([buy(2),sell()],{QQQ:42000},'AI').realized,5000));
 test('부분 매도 잔여 수량',()=>eq(C.evaluate([buy(2),sell()],{QQQ:42000},'AI').positions.QQQ.qty,1));
 test('초과 매도 차단',()=>!C.validateLedger([buy(),sell(2)]).ok);
 test('현금 초과 매수 차단',()=>!C.validateLedger([buy(3)]).ok);
 test('음수 가격 차단',()=>!C.validateLedger([buy(1,-1)]).ok);
 test('잘못된 계좌 차단',()=>!C.validateLedger([buy(1,100,'X')]).ok);
 test('가격 누락 시 수익률 미산출',()=>C.evaluate([buy()],{},'AI').returnPct===null);
 test('거래 수정 사전 검증',()=>!C.validateChange([buy()],'edit',0,buy(3)).ok);
 test('거래 삭제 후 초과매도 차단',()=>!C.validateChange([buy(),sell()],'delete',0).ok);
 const backup={trades:[buy()],research:[],prices:{QQQ:42000}};
 test('정상 백업 검증',()=>C.validateBackup(backup).ok);
 test('손상 백업 차단',()=>!C.validateBackup({...backup,trades:'bad'}).ok);
 test('CSV 정상 파싱',()=>M.parse('symbol,date,close,currency,source\nQQQ,2026-10-23,420,USD,test').length===1);
 test('CSV 음수 가격 차단',()=>{try{M.parse('symbol,date,close,currency,source\nQQQ,2026-10-23,-1,USD,test');return false}catch{return true}});
 test('CSV 필수 열 확인',()=>{try{M.parse('symbol,date,close\nQQQ,2026-10-23,42');return false}catch{return true}});
 test('CSV 최신값 선택',()=>{const rows=M.parse('symbol,date,close,currency,source\nQQQ,2026-10-22,40,USD,a\nQQQ,2026-10-23,41,USD,a');return M.assess(rows).length===1&&M.assess(rows)[0].close===41});
 test('CSV 데이터 자동 추천 금지 상태',()=>M.assess(M.parse('symbol,date,close,currency,source\nQQQ,2026-10-23,40,USD,a'))[0].status!=='추천 가능');
 return checks;
}
function init(){
 const home=document.getElementById('home');if(!home||document.getElementById('p100x-regression'))return;
 const card=document.createElement('div');card.id='p100x-regression';card.className='card';
 const title=document.createElement('h2');title.textContent='P0 · 독립 회귀 검증실 (20항목)';
 const desc=document.createElement('p');desc.textContent='예시 데이터로 계산·백업·시세 형식을 검증합니다. 실제 투자 기록은 읽거나 변경하지 않습니다.';
 const button=document.createElement('button');button.type='button';button.textContent='20항목 검증 실행';
 const out=document.createElement('pre');out.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.6';out.setAttribute('role','status');
 button.onclick=()=>{const results=run(),passed=results.filter(x=>x.ok).length;out.textContent='검증 결과: '+passed+'/'+results.length+' 통과\n'+results.map(x=>(x.ok?'✓ ':'✗ ')+x.name+(x.error?' — '+x.error:'')).join('\n')+'\n※ 단위·회귀 테스트이며 실시간 시세·수익 예측력 검증은 아닙니다.'};
 card.append(title,desc,button,out);home.append(card);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.Project100XRegression={run};
})();
