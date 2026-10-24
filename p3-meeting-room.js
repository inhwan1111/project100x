/* PROJECT 100X — touch-first design meeting. Separate storage from trading ledger. */
(()=>{'use strict';
const KEY='project100x_meeting_v1';
const fixed=[
['실패한 추천 처리','원인 분석·개선안 독립 검증'],
['종목 추천 기준','시장·데이터·검증·위험 종합 평가'],
['급락장 대응','위험 수준별 추천 제한'],
['가상투자 검증','최소 6~12개월 및 다양한 시장 국면'],
['성과 평가','수익률·MDD·손익비·비용·벤치마크'],
['전략 개선','자율 연구·독립 검증·사용자 승인 후 적용'],
['목표가·손절가','종합 위험관리형'],
['신호 알림','정기 보고 + 중요 신호 알림'],
['추천 종목 수','시장에 따라 0~5개, 추천 없음 허용']];
const questions=[{id:10,title:'백테스트 결과를 JT AI 추천에 언제 반영할까?',options:[
['A','백테스트 수익률이 높으면 바로 반영'],
['B','백테스트와 소규모 가상투자 검증 후 반영'],
['C','과거 학습·독립 홀드아웃·실시간 가상투자 검증 후 사용자 승인 시 반영']]}];
const el=(tag,txt)=>{const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;return n};
function read(){try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch{return {}}}
function init(){const home=document.getElementById('home');if(!home||document.getElementById('p100x-meeting'))return;
 const card=el('div');card.className='card';card.id='p100x-meeting';
 card.append(el('h2','🗳️ PROJECT 100X · 개발 회의실'));
 card.append(el('p','A·B·C를 직접 터치해 선택하세요. 확정하면 이 기기에 별도로 저장됩니다. 기존 가상투자 기록은 변경하지 않습니다.'));
 const fixedTitle=el('details');const summary=el('summary','확정된 ①~⑨ 회의 결정 보기 (모두 C)');fixedTitle.append(summary);
 const ul=el('ol');fixed.forEach(([a,b])=>{const li=el('li',a+' — C. '+b);li.style.margin='8px 0';ul.append(li)});fixedTitle.append(ul);card.append(fixedTitle);
 const q=questions[0],h=el('h3','안건 ⑩ · '+q.title);card.append(h);
 const form=el('form');form.id='p100x-meeting-form';
 const saved=read(),value=saved['10']?.choice;
 q.options.forEach(([letter,label])=>{const wrap=el('label');wrap.style.cssText='display:flex;align-items:flex-start;gap:12px;padding:13px 10px;margin:8px 0;border:1px solid #64748b;border-radius:12px;cursor:pointer;line-height:1.5';
 const radio=el('input');radio.type='radio';radio.name='choice';radio.value=letter;radio.required=true;radio.checked=value===letter;radio.style.cssText='width:22px;height:22px;flex:none;margin-top:3px;accent-color:#5eead4';
 const t=el('span',letter+'. '+label+(letter==='C'?' (추천)':''));wrap.append(radio,t);form.append(wrap)});
 const btn=el('button','선택 확정하기 →');btn.type='submit';form.append(btn);
 const status=el('p');status.setAttribute('role','status');status.style.marginTop='12px';
 if(value)status.textContent='저장된 선택: '+value+' · 변경하려면 다시 선택 후 확정하세요.';
 form.addEventListener('submit',e=>{e.preventDefault();const choice=form.querySelector('input[name="choice"]:checked');if(!choice)return;
 try{const state=read();state['10']={choice:choice.value,title:q.title,description:q.options.find(x=>x[0]===choice.value)[1],savedAt:new Date().toISOString()};localStorage.setItem(KEY,JSON.stringify(state));status.textContent='✅ 안건 ⑩ '+choice.value+' 확정 및 이 기기에 저장 완료';}catch{status.textContent='저장 실패: 기기 저장공간을 확인하세요.'}});
 card.append(form,status);
 const note=el('p','주의: 선택 결과는 현재 기기에만 저장됩니다. 기존 JSON 백업에 자동 포함되지 않으므로 기기 변경 전 별도 보존 기능이 필요합니다.');note.className='notice';card.append(note);
 home.append(card);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
