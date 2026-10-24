/* PROJECT 100X mobile navigation: read-only, no saved data changes. */
(()=>{'use strict';
function init(){const home=document.getElementById('home');if(!home||document.getElementById('p100x-quicknav'))return;
const card=document.getElementById('p100x-nav-placeholder')||document.createElement('div');card.replaceChildren();card.id='p100x-quicknav';card.className='card';
const h=document.createElement('h2');h.textContent='연구실 바로가기';card.append(h);
const p=document.createElement('p');p.textContent='원하는 연구실로 바로 이동합니다. 투자 기록은 변경하지 않습니다.';card.append(p);
const targets=[['성과 분석','v06-performance'],['자동 검증','jt-selftest-v08'],['시세 CSV 검증','p100x-v09'],['과거 OHLCV 검증','p100x-history'],['회귀 검증','p100x-regression'],['QQQ CSV 가져오기','p100x-av-import'],['P2 백테스트','p100x-p2-lab']];
const buttons=document.createElement('div');buttons.className='actions';
for(const [label,id] of targets){const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=label;b.onclick=()=>{const target=document.getElementById(id);if(target){target.scrollIntoView({behavior:'smooth',block:'start'});}else alert('해당 연구실이 아직 표시되지 않습니다.');};buttons.append(b);}
card.append(buttons);if(!card.isConnected)home.prepend(card);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();