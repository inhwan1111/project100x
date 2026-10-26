/* PROJECT 100X — read-only automated data status. Never modifies virtual trades. */
(()=>{'use strict';
function init(){
 const home=document.getElementById('home');if(!home||document.getElementById('p100x-auto-status'))return;
 const box=document.createElement('div');box.className='card';box.id='p100x-auto-status';
 const h=document.createElement('h2');h.textContent='v1.0 · 자동 시세 수집 상태';
 const p=document.createElement('p');p.setAttribute('role','status');p.textContent='데이터 확인 중…';
 box.append(h,p);home.prepend(box);
 fetch('./market-data/status.json?ts='+Date.now(),{cache:'no-store'})
 .then(r=>{if(!r.ok)throw Error('status unavailable');return r.json();})
 .then(s=>{
  const rows=Number(s.rows),date=String(s.latestDate||''),updated=Date.parse(s.updatedAt);
  if(s.symbol!=='QQQ'||!Number.isInteger(rows)||rows<1||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)||!Number.isFinite(updated))throw Error('invalid status');
  const ageDays=(Date.now()-updated)/86400000;
  const stale=ageDays>4||ageDays< -1;
  p.textContent=(stale?'⚠️ 수집 상태 확인 필요 · ':'✅ 수집 기록 확인 · ')+
   'QQQ · '+rows+'거래일 · 최근 거래일 '+date+
   ' · 마지막 수집 '+new Date(updated).toLocaleString('ko-KR')+
   ' · 원본 일별 데이터(수정주가 아님). '+
   (stale?'최근 수집 기록이 오래되었거나 시간이 올바르지 않습니다.':'표시된 날짜는 실시간 시세를 의미하지 않습니다.');
 }).catch(()=>{p.textContent='⚠️ 검증된 자동 수집 결과 없음 · GitHub Actions 실행 기록과 API 키 설정을 확인해야 합니다. 기존 가상투자 데이터는 변경되지 않습니다.';});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();