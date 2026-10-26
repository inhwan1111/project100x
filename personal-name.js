/* PROJECT 100X: per-device display name. Does not touch investment records. */
(()=>{'use strict';
const KEY='project100x_display_name_v1';
const el=(tag,txt)=>{const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;return n};
function init(){
 const home=document.getElementById('home');if(!home||document.getElementById('p100x-personal-name'))return;
 const card=el('div');card.className='card';card.id='p100x-personal-name';
 const title=el('h2','내 투자 연구실');
 const greeting=el('p');greeting.setAttribute('role','status');
 const label=el('label','이 기기에서 사용할 이름 (선택)');
 const input=el('input');input.type='text';input.maxLength=20;input.autocomplete='off';input.placeholder='예: 나의 연구실';
 const buttons=el('div');buttons.className='actions';
 const save=el('button','이름 저장'),clear=el('button','이름 삭제');clear.type='button';clear.className='secondary';save.type='button';
 const info=el('p','이름은 이 기기에만 저장됩니다. 회원가입·서버 전송은 없으며 가상투자 기록에는 영향을 주지 않습니다.');info.className='notice';
 function current(){try{return localStorage.getItem(KEY)||''}catch{return ''}}
 function render(){const name=current();greeting.textContent=name?name+'님의 투자 연구실에 오신 것을 환영합니다!':'나만의 투자 연구실을 만들어 보세요.';input.value=name;}
 save.addEventListener('click',()=>{
  const name=input.value.trim().replace(/\s+/g,' ');
  if(name.length>20){greeting.textContent='이름은 20자 이내로 입력해 주세요.';return;}
  try{if(name)localStorage.setItem(KEY,name);else localStorage.removeItem(KEY);render()}catch{greeting.textContent='기기 저장소에 접근할 수 없어 이름을 저장하지 못했습니다.';}
 });
 clear.addEventListener('click',()=>{try{localStorage.removeItem(KEY);render()}catch{greeting.textContent='기기 저장소에 접근할 수 없습니다.';}});
 label.append(input);buttons.append(save,clear);card.append(title,greeting,label,buttons,info);
 const nav=document.getElementById('p100x-quicknav')||document.getElementById('p100x-nav-placeholder');
 if(nav&&nav.parentElement===home)nav.after(card);else home.prepend(card);
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();