const $ = id => document.getElementById(id);
const colors = ['#f9ce75','#eda28d','#9bbddc','#b1ca91','#c5afe0','#f3ede0'];
const names = ['ສີເຫຼືອງ','ສີບົວ','ສີຟ້າ','ສີຂຽວ','ສີມ່ວງ','ສີຄຣີມ'];
const roofs = ['#df826b','#779dbb','#83a17c','#b294bd','#d5b369','#8a9399'];
const categories = [ ['wall','🎨','ສີບ້ານ'],['roof','🏠','ຫຼັງຄາ'],['door','🚪','ປະຕູ'],['windows','🪟','ປ່ອງຢ້ຽມ'],['garden','🌳','ສວນ'] ];
const defaults = {wall:0,roof:0,door:0,windows:0,garden:0};
let state = {...defaults}, active = 'wall', history = [], sound = false, audio;
try { const saved = JSON.parse(localStorage.getItem('lyon-house-v1')); if(saved && categories.every(([key]) => Number.isInteger(saved[key]) && saved[key]>=0 && saved[key]<(key==='wall'||key==='roof'?6:3))) state = saved; } catch {}
function persist(){try{localStorage.setItem('lyon-house-v1',JSON.stringify(state));}catch{}}
function tone(freq=520){if(!sound)return;try{audio ||= new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.frequency.value=freq;g.gain.setValueAtTime(.08,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.18);o.start();o.stop(audio.currentTime+.2);}catch{}}
function tree(x,y,size=1){return `<g transform="translate(${x} ${y}) scale(${size})"><rect x="-9" y="-45" width="18" height="90" rx="7" fill="#a27d56"/><circle cy="-66" r="47" fill="#78a36b"/><circle cx="-23" cy="-45" r="32" fill="#83ae74"/><circle cx="22" cy="-48" r="35" fill="#83ae74"/></g>`;}
function flower(x,y,c){return `<g transform="translate(${x} ${y})"><path d="M0 0v25m0-8q-15-15-18-3m18 8q15-15 18-4" fill="none" stroke="#618e52" stroke-width="4"/><g fill="${c}"><circle cx="-7" r="7"/><circle cx="7" r="7"/><circle cy="-7" r="7"/><circle cy="7" r="7"/></g><circle r="5" fill="#fff0a2"/></g>`;}
function render(){
 $('wall').setAttribute('fill',colors[state.wall]);$('roof').setAttribute('fill',roofs[state.roof]);$('roof').setAttribute('stroke',roofs[state.roof]);
 const dc=['#759c8a','#b98061','#a58aba'][state.door];
 $('door').innerHTML=`<path d="M365 486V403a35 35 0 0170 0v83Z" fill="${dc}" stroke="#fff3d8" stroke-width="7"/>${state.door===1?'<path d="M378 412h44v50h-44Z" fill="none" stroke="#f5dfbd" stroke-width="3"/>':state.door===2?'<circle cx="400" cy="408" r="16" fill="#dbf1ed"/>':''}<circle cx="420" cy="445" r="5" fill="#ffe5a3"/>`;
 $('windows').innerHTML=[295,505].map(x=>state.windows===1?`<circle cx="${x}" cy="365" r="27" fill="#cae6e9" stroke="#fff8e7" stroke-width="9"/><path d="M${x-24} 365h48m-24-24v48" stroke="#fff8e7" stroke-width="5"/>`:`<rect x="${x-27}" y="337" width="54" height="57" rx="${state.windows===2?22:4}" fill="#cbe8ed" stroke="#fff8e7" stroke-width="8"/><path d="M${x-25} 365h50m-25-25v51" stroke="#fff8e7" stroke-width="5"/>${state.windows===2?`<path d="M${x-34} 399h68" stroke="#b48267" stroke-width="10" stroke-linecap="round"/>`:''}`).join('');
 $('garden').innerHTML=state.garden===0?tree(140,445)+tree(656,430,.8):state.garden===1?tree(660,430,.8)+[110,150,190,590,630,675].map((x,i)=>flower(x,470+i%2*15,['#e99c92','#efc669','#c3a3ce'][i%3])).join(''):tree(135,440)+`<g stroke="#fff5df" stroke-width="13" stroke-linecap="round"><path d="M575 450h160m-160 30h160"/>${[580,615,650,685,720].map(x=>`<path d="M${x} 430v65"/>`).join('')}</g>`;
 $('undo').disabled=!history.length;persist();
}
function options(){
 $('tabs').innerHTML=categories.map(([id,icon,label])=>`<button class="tab" role="tab" aria-selected="${active===id}" data-tab="${id}"><span>${icon}</span>${label}</button>`).join('');
 $('choice-title').textContent=categories.find(c=>c[0]===active)[2]+'ທີ່ເຈົ້າມັກ';
 const isColor=active==='wall'||active==='roof';
 const labels=isColor?(active==='roof'?['ສີສົ້ມ','ສີຟ້າ','ສີຂຽວ','ສີມ່ວງ','ສີທອງ','ສີເທົາ']:names):active==='door'?['ທຳມະດາ','ລາຍໄມ້','ມີປ່ອງ']:active==='windows'?['ສີ່ຫຼ່ຽມ','ວົງມົນ','ໂຄ້ງມົນ']:['ຕົ້ນໄມ້','ດອກໄມ້','ຮົ້ວນ້ອຍ'];
 $('choices').innerHTML=labels.map((name,i)=>`<button class="choice" aria-pressed="${state[active]===i}" data-choice="${i}">${isColor?`<span class="swatch" style="background:${(active==='wall'?colors:roofs)[i]}"></span>`:`<span class="sample">${(active==='door'?['🚪','▥','◉']:active==='windows'?['⊞','⊕','▰']:['🌳','🌷','🏡'])[i]}</span>`}${name}</button>`).join('');
}
 $('tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b){active=b.dataset.tab;options();$('tabs').querySelector(`[data-tab="${active}"]`).focus();tone(440);}});
 $('tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const i=categories.findIndex(c=>c[0]===active);active=categories[e.key==='Home'?0:e.key==='End'?4:(i+(e.key==='ArrowRight'?1:4))%5][0];options();$('tabs').querySelector(`[data-tab="${active}"]`).focus();});
 $('choices').addEventListener('click',e=>{const b=e.target.closest('[data-choice]');if(!b)return;const value=Number(b.dataset.choice);if(state[active]!==value){history.push({...state});state[active]=value;render();options();$('choices').children[value].focus();tone();$('status').textContent='ປ່ຽນແລ້ວ!';}});
 $('undo').onclick=()=>{if(history.length){state=history.pop();render();options();tone(350);}};
 $('reset').onclick=()=>{history.push({...state});state={...defaults};render();options();tone(350);};
 $('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'🔊':'🔇';$('sound').setAttribute('aria-pressed',sound);$('sound').setAttribute('aria-label',sound?'ປິດສຽງ':'ເປີດສຽງ');tone();};
 $('finish').onclick=()=>{$('celebrate').showModal();tone(660);$('confetti').innerHTML=Array.from({length:35},(_,i)=>`<i class="paper" style="left:${Math.random()*100}%;background:${colors[i%6]};animation-delay:${Math.random()*.6}s"></i>`).join('');setTimeout(()=>$('confetti').replaceChildren(),3300);};
 $('continue').onclick=()=>$('celebrate').close();
 $('save').onclick=()=>{const svg=$('scene').cloneNode(true);svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('width','1200');svg.setAttribute('height','930');const blob=new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='my-lyon-house.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 render();options();
