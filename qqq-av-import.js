/* PROJECT 100X: Alpha Vantage daily CSV importer. User downloads CSV from provider; no keys stored. */
(()=>{'use strict';
function init(){const host=document.getElementById('home');if(!host||document.getElementById('p100x-av-import'))return;
const card=document.createElement('div');card.className='card';card.id='p100x-av-import';
const h=document.createElement('h2');h.textContent='QQQ · 실제 시세 CSV 가져오기';card.append(h);
const p=document.createElement('p');p.textContent='Alpha Vantage TIME_SERIES_DAILY CSV (timestamp,open,high,low,close,volume)를 기기에서만 변환합니다. API 키를 앱에 입력하거나 저장하지 않습니다. 원본 가격 진위·수정주가·배당은 별도 확인이 필요합니다.';card.append(p);
const label=document.createElement('label');label.textContent='Alpha Vantage CSV 파일 선택';const input=document.createElement('input');input.type='file';input.accept='.csv,text/csv';label.append(input);card.append(label);
const btn=document.createElement('button');btn.type='button';btn.textContent='QQQ 데이터 검증 및 P2 CSV 생성';card.append(btn);
const out=document.createElement('p');out.setAttribute('role','status');card.append(out);
btn.onclick=async()=>{out.textContent='';try{
const file=input.files?.[0];if(!file)throw Error('CSV 파일을 먼저 선택하세요.');if(file.size>1024*1024)throw Error('파일이 1MB를 초과합니다.');
const raw=(await file.text()).replace(/^\uFEFF/,'').trim().split(/\r?\n/),header=raw.shift()?.toLowerCase().split(',').map(x=>x.trim());
const fields=['timestamp','open','high','low','close','volume'];if(!header||fields.some(x=>!header.includes(x)))throw Error('Alpha Vantage 일별 CSV가 아닙니다. 헤더를 확인하세요.');
if(raw.length<35||raw.length>5000)throw Error('35~5000개 거래일 데이터가 필요합니다.');
const bars=raw.map((line,i)=>{const cols=line.split(',').map(x=>x.trim());if(cols.length!==header.length)throw Error((i+2)+'행 열 개수 오류');const b={date:cols[header.indexOf('timestamp')]};for(const k of fields.slice(1)){const val=cols[header.indexOf(k)];if(!val)throw Error((i+2)+'행 누락: '+k);b[k]=Number(val);}return b;}).sort((a,b)=>a.date.localeCompare(b.date));
const B=window.Project100XBacktest;if(!B)throw Error('P2 검증 엔진이 없습니다.');const valid=B.validate(bars);if(!valid.ok)throw Error(valid.reason);
const csv='date,open,high,low,close,volume\n'+bars.map(b=>[b.date,b.open,b.high,b.low,b.close,b.volume].join(',')).join('\n')+'\n';
const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='QQQ-alpha-vantage-p2.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
out.textContent=bars.length+'거래일 형식 검증 통과. P2용 CSV 다운로드를 요청했습니다. 실제 시세 정확성·수정주가·출처 권한은 검증되지 않았습니다.';
}catch(e){out.textContent='변환 중단: '+e.message;}};
host.append(card);
}
function start(){init();if(document.getElementById('p100x-av-import'))return;const observer=new MutationObserver(()=>{init();if(document.getElementById('p100x-av-import'))observer.disconnect();});observer.observe(document.body,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),15000);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();