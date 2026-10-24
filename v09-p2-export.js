/* v0.9 phase 3: validated history CSV -> P2 backtest CSV download, local-only. */
(()=>{'use strict';
function init(){
 const card=document.getElementById('p100x-history');if(!card||document.getElementById('p100x-history-export'))return;
 const btn=document.createElement('button');btn.type='button';btn.id='p100x-history-export';btn.textContent='검증 후 P2용 CSV 만들기';
 const out=document.createElement('p');out.setAttribute('role','status');card.append(btn,out);
 btn.onclick=async()=>{
  out.textContent='';try{
   const file=card.querySelector('input[type=file]')?.files?.[0];if(!file)throw Error('먼저 과거 데이터 CSV 파일을 선택하세요.');
   if(file.size>1048576)throw Error('1MB 이하 파일만 허용합니다.');
   const parser=window.Project100XHistoryV09?.parse,B=window.Project100XBacktest;
   if(!parser||!B)throw Error('검증 모듈을 불러오지 못했습니다.');
   const rows=parser(await file.text());const symbols=[...new Set(rows.map(x=>x.symbol))];
   if(symbols.length!==1)throw Error('백테스트용 파일은 종목 1개만 선택해야 합니다.');
   if(rows.length<35)throw Error('최소 35거래일이 필요합니다.');
   const bars=rows.map(({date,open,high,low,close,volume})=>({date,open,high,low,close,volume}));
   const valid=B.validate(bars);if(!valid.ok)throw Error(valid.reason);
   const csv='date,open,high,low,close,volume\n'+bars.map(b=>[b.date,b.open,b.high,b.low,b.close,b.volume].join(',')).join('\n')+'\n';
   const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download=symbols[0].replace(/[^A-Z0-9.^=-]/g,'_')+'-p2-ohlcv.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
   out.textContent='P2용 CSV 생성 요청 완료 · '+symbols[0]+' · '+rows.length+'거래일. 다운로드 폴더를 확인한 뒤 P2 연구실에서 선택하세요. 데이터 진위·수정주가·이용권한은 별도 검증이 필요합니다.';
  }catch(e){out.textContent='변환 중단: '+e.message;}
 };
}
function start(){init();if(document.getElementById('p100x-history-export'))return;const observer=new MutationObserver(()=>{init();if(document.getElementById('p100x-history-export'))observer.disconnect();});observer.observe(document.body,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),15000);}\nif(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();