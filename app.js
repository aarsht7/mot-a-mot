import {buildDeck, fallbackDeck, CHAPTERS, chapterUrl} from './shared.js';
const $=id=>document.getElementById(id);
const STORAGE='motamot-progress-v1';
const day=86400_000;
const defaultData=()=>({version:1,records:{}});
let progress=loadProgress(),cards=[],conjugations={},active=null,flipped=false,conjOpen=false,currentTense='PRESENT',visited=new Set(),history=[],sessionNo=0,shuffleSeed=0,shuffledOrder=null,loading=true;
const countsByStatus=()=>{
 const counts={known:0,learning:0,unknown:0,unseen:0,due:0};
 for(const c of cards){const r=progress.records[c.id];if(!r)counts.unseen++;else counts[r.status]++;if(r&&r.due<=Date.now())counts.due++}
 return counts;
};
function loadProgress(){try{const o=JSON.parse(localStorage.getItem(STORAGE));return o&&o.records&&typeof o.records==='object'?o:defaultData()}catch{return defaultData()}}
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(progress))}catch{toast('Could not save progress. Check browser storage settings.')}}
function toast(message){$('feedback').textContent=message;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('feedback').textContent='',3200)}
function normalize(s){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim()}
function filters(){return {level:$('levelFilter').value,type:$('typeFilter').value,mode:$('modeFilter').value,q:normalize($('searchInput').value)}}
function filteredPool(){const f=filters();const now=Date.now();return cards.filter(c=>{
 if(f.level!=='all'&&c.level!==f.level)return false;
 if(f.type!=='all'&&c.type!==f.type)return false;
 if(f.q&&!normalize(c.fr+' '+c.en+' '+c.topic).includes(f.q))return false;
 const r=progress.records[c.id];
 if(f.mode==='new'&&r)return false;
 if(f.mode==='unknown'&&r?.status!=='unknown')return false;
 if(f.mode==='due'&&(!r||r.due>now))return false;
 if(f.mode==='smart'&&r&&r.due>now)return false;
 return true;
})}
function cardPriority(c){const r=progress.records[c.id];if(!r)return 3;if(r.due<=Date.now())return r.status==='unknown'?0:r.status==='learning'?1:2;return 4}
function chooseNext(){
 const pool=filteredPool().filter(c=>!visited.has(c.id));if(!pool.length)return null;
 const mode=$('modeFilter').value;
 const order=new Map((shuffledOrder||cards).map((c,i)=>[c.id,i]));
 if(mode==='smart')pool.sort((a,b)=>cardPriority(a)-cardPriority(b)||order.get(a.id)-order.get(b.id));
 else pool.sort((a,b)=>order.get(a.id)-order.get(b.id));
 return pool[0];
}
function showNewCard(){active=chooseNext();flipped=false;conjOpen=false;currentTense='PRESENT';sessionNo++;render()}
function resetSession(){visited.clear();history.length=0;shuffleSeed=0;shuffledOrder=null;sessionNo=0;showNewCard()}
function showCount(){const c=countsByStatus(),total=cards.length; $('datasetBadge').textContent=loading?'Loading deck…':`${total.toLocaleString()} cards · A1–C1`; $('masteredCount').textContent=c.known.toLocaleString();$('learningCount').textContent=c.learning.toLocaleString();$('unknownCount').textContent=c.unknown.toLocaleString();$('remainingCount').textContent=c.unseen.toLocaleString();$('dueCount').textContent=c.due.toLocaleString();$('progressFill').style.width=total?Math.min(100,c.known/total*100)+'%':'0%'}
function setText(id,value){$(id).textContent=value}
function render(){showCount();const buttons=['unknownButton','learningButton','knownButton','listenButton','conjButton'];
 if(!active){
  setText('sessionCounter',`${visited.size} studied this session`);setText('cardFrench',loading?'Loading vocabulary…':'All caught up!');setText('cardEnglish','');setText('cardGrammar',loading?'Fetching the vocabulary library': 'Change filters or shuffle for another round.');setText('tapHint',loading?'':'No more cards in this set right now.');$('translationWrap').hidden=true;$('tapHint').hidden=false;$('cardLevel').textContent='—';$('cardType').textContent='DONE';$('cardTopic').textContent=loading?'Loading':'Your learning deck';$('cardIndex').textContent='';buttons.forEach(id=>$(id).disabled=true);$('conjButton').hidden=true;$('conjPanel').hidden=true;$('undoButton').disabled=!history.length;return;
 }
 buttons.forEach(id=>$(id).disabled=false);
 setText('sessionCounter',`Card ${visited.size+1} of ${filteredPool().length+visited.size} in this study set`);
 setText('cardFrench',active.fr);setText('cardEnglish',active.en);setText('cardLevel',active.level);setText('cardType',active.type.toUpperCase());setText('cardTopic',active.topic);setText('cardIndex',`${String(cards.indexOf(active)+1).padStart(3,'0')} / ${cards.length}`);
 const grammar=active.type==='noun'?(active.gender?`${active.gender.toUpperCase()}${active.plural?' · PLURAL':''}`:active.plural?'PLURAL · GENDER NOT VERIFIED':'NOUN · GENDER NOT VERIFIED'):active.type==='verb'?'VERB · NO GRAMMATICAL GENDER':active.type==='phrase'?'USEFUL EXPRESSION':'VOCABULARY';
 setText('cardGrammar',grammar);$('conjButton').hidden=active.type!=='verb';$('conjButton').disabled=false;$('translationWrap').hidden=!flipped;$('tapHint').hidden=flipped;$('flashcard').setAttribute('aria-label',flipped?'Translation shown. Tap to hide':'Tap or press space to reveal translation');$('conjPanel').hidden=!conjOpen;$('conjButton').setAttribute('aria-expanded',String(conjOpen));$('undoButton').disabled=!history.length;
 if(conjOpen)renderConjugations();
}
function flip(){if(!active)return;flipped=!flipped;$('translationWrap').hidden=!flipped;$('tapHint').hidden=flipped;$('flashcard').setAttribute('aria-label',flipped?'Translation shown. Tap to hide':'Tap or press space to reveal translation')}
function rating(status){if(!active)return;
 const old=progress.records[active.id]||null,now=Date.now(),streak=status==='known'?(old?.status==='known'?Math.min(5,(old.streak||0)+1):1):0;
 const spacing=status==='unknown'?10/1440:status==='learning'?1:[0,3,7,14,30,60,90][streak]||3;
 history.push({card:active,prev:old,visited:new Set(visited)});if(history.length>30)history.shift();
 progress.records[active.id]={status,streak,reviews:(old?.reviews||0)+1,last:now,due:now+spacing*day};
 visited.add(active.id);save();showNewCard();toast(status==='known'?'Well done — spaced review scheduled':status==='learning'?'Saved for tomorrow':'Saved — review again soon');
}
function undo(){const h=history.pop();if(!h)return;if(h.prev)progress.records[h.card.id]=h.prev;else delete progress.records[h.card.id];visited=h.visited;active=h.card;flipped=true;conjOpen=false;save();render();toast('Rating undone')}
function shuffle(){visited.clear();shuffleSeed++;history.length=0;shuffledOrder=[...cards];for(let i=shuffledOrder.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffledOrder[i],shuffledOrder[j]]=[shuffledOrder[j],shuffledOrder[i]]}showNewCard();toast('Cards shuffled — new study round')}
const TENSE_NAMES={PRESENT:'Présent',PASSE_COMPOSE:'Passé composé',IMPARFAIT:'Imparfait',FUTUR:'Futur simple',CONDITIONNEL_PRESENT:'Conditionnel',SUBJONCTIF_PRESENT:'Subjonctif',PLUS_QUE_PARFAIT:'Plus-que-parfait'};
const PRONOUNS=['je','tu','il / elle','nous','vous','ils / elles'];
const BASIC={
 'être':{PRESENT:['suis','es','est','sommes','êtes','sont'],IMPARFAIT:['étais','étais','était','étions','étiez','étaient'],FUTUR:['serai','seras','sera','serons','serez','seront'],CONDITIONNEL_PRESENT:['serais','serais','serait','serions','seriez','seraient'],PASSE_COMPOSE:['ai été','as été','a été','avons été','avez été','ont été'],SUBJONCTIF_PRESENT:['sois','sois','soit','soyons','soyez','soient']},
 'avoir':{PRESENT:['ai','as','a','avons','avez','ont'],IMPARFAIT:['avais','avais','avait','avions','aviez','avaient'],FUTUR:['aurai','auras','aura','aurons','aurez','auront'],CONDITIONNEL_PRESENT:['aurais','aurais','aurait','aurions','auriez','auraient'],PASSE_COMPOSE:['ai eu','as eu','a eu','avons eu','avez eu','ont eu'],SUBJONCTIF_PRESENT:['aie','aies','ait','ayons','ayez','aient']},
 'aller':{PRESENT:['vais','vas','va','allons','allez','vont'],IMPARFAIT:['allais','allais','allait','allions','alliez','allaient'],FUTUR:['irai','iras','ira','irons','irez','iront'],CONDITIONNEL_PRESENT:['irais','irais','irait','irions','iriez','iraient'],PASSE_COMPOSE:['suis allé','es allé','est allé','sommes allés','êtes allés','sont allés'],SUBJONCTIF_PRESENT:['aille','ailles','aille','allions','alliez','aillent']},
 'faire':{PRESENT:['fais','fais','fait','faisons','faites','font'],IMPARFAIT:['faisais','faisais','faisait','faisions','faisiez','faisaient'],FUTUR:['ferai','feras','fera','ferons','ferez','feront'],CONDITIONNEL_PRESENT:['ferais','ferais','ferait','ferions','feriez','feraient'],PASSE_COMPOSE:['ai fait','as fait','a fait','avons fait','avez fait','ont fait'],SUBJONCTIF_PRESENT:['fasse','fasses','fasse','fassions','fassiez','fassent']},
 'parler':{PRESENT:['parle','parles','parle','parlons','parlez','parlent'],IMPARFAIT:['parlais','parlais','parlait','parlions','parliez','parlaient'],FUTUR:['parlerai','parleras','parlera','parlerons','parlerez','parleront'],CONDITIONNEL_PRESENT:['parlerais','parlerais','parlerait','parlerions','parleriez','parleraient'],PASSE_COMPOSE:['ai parlé','as parlé','a parlé','avons parlé','avez parlé','ont parlé'],SUBJONCTIF_PRESENT:['parle','parles','parle','parlions','parliez','parlent']},
 'pouvoir':{PRESENT:['peux','peux','peut','pouvons','pouvez','peuvent'],IMPARFAIT:['pouvais','pouvais','pouvait','pouvions','pouviez','pouvaient'],FUTUR:['pourrai','pourras','pourra','pourrons','pourrez','pourront'],CONDITIONNEL_PRESENT:['pourrais','pourrais','pourrait','pourrions','pourriez','pourraient'],PASSE_COMPOSE:['ai pu','as pu','a pu','avons pu','avez pu','ont pu'],SUBJONCTIF_PRESENT:['puisse','puisses','puisse','puissions','puissiez','puissent']},
 'vouloir':{PRESENT:['veux','veux','veut','voulons','voulez','veulent'],IMPARFAIT:['voulais','voulais','voulait','voulions','vouliez','voulaient'],FUTUR:['voudrai','voudras','voudra','voudrons','voudrez','voudront'],CONDITIONNEL_PRESENT:['voudrais','voudrais','voudrait','voudrions','voudriez','voudraient'],PASSE_COMPOSE:['ai voulu','as voulu','a voulu','avons voulu','avez voulu','ont voulu'],SUBJONCTIF_PRESENT:['veuille','veuilles','veuille','voulions','vouliez','veuillent']},
 'prendre':{PRESENT:['prends','prends','prend','prenons','prenez','prennent'],IMPARFAIT:['prenais','prenais','prenait','prenions','preniez','prenaient'],FUTUR:['prendrai','prendras','prendra','prendrons','prendrez','prendront'],CONDITIONNEL_PRESENT:['prendrais','prendrais','prendrait','prendrions','prendriez','prendraient'],PASSE_COMPOSE:['ai pris','as pris','a pris','avons pris','avez pris','ont pris'],SUBJONCTIF_PRESENT:['prenne','prennes','prenne','prenions','preniez','prennent']}
};
function formWithPronoun(form,i,tense){if(!form)return '—';const p=PRONOUNS[i];if(tense==='SUBJONCTIF_PRESENT'){
 const sub=i===0?'que je':i===1?'que tu':i===2?'qu’il / elle':i===3?'que nous':i===4?'que vous':'qu’ils / elles';
 if(i===0&&/^[aeiouyàâéèêëîïôùûüœ]/i.test(form))return "que j'"+form;
 return sub+' '+form;
 }
 if(i===0&&/^[aeiouyàâéèêëîïôùûüœ]/i.test(form))return "j'"+form;
 return p+' '+form;
}
function renderConjugations(){if(!active)return;const lemma=active.lemma;setText('conjTitle',lemma===active.fr?lemma:`${lemma} · from “${active.fr}”`);
 const tables=conjugations[lemma]||BASIC[lemma]||{};
 const available=Object.keys(TENSE_NAMES).filter(k=>Array.isArray(tables[k])&&tables[k].some(Boolean));
 if(available.length&&!available.includes(currentTense))currentTense=available[0];
 const tabEl=$('tenseTabs'),body=$('conjBody');tabEl.replaceChildren();body.replaceChildren();
 if(!available.length){
  tabEl.hidden=true;const p=document.createElement('p');p.className='conj-unavailable';p.textContent='No verified table is included for this verb form. You can look it up in a full dictionary instead.';
  const a=document.createElement('a');a.href='https://dictionnaire.lerobert.com/en/conjugation';a.target='_blank';a.rel='noopener noreferrer';a.textContent='Open Le Robert conjugator ↗';body.append(p,a);return;
 }
 tabEl.hidden=false;
 for(const tense of available){const b=document.createElement('button');b.type='button';b.textContent=TENSE_NAMES[tense];b.className=tense===currentTense?'selected':'';b.setAttribute('aria-pressed',String(tense===currentTense));b.addEventListener('click',()=>{currentTense=tense;renderConjugations()});tabEl.append(b)}
 const table=document.createElement('table');table.className='conj-table';const tbody=document.createElement('tbody');
 tables[currentTense].forEach((form,i)=>{const row=document.createElement('tr');const p=document.createElement('td');const v=document.createElement('td');p.textContent=PRONOUNS[i];v.textContent=formWithPronoun(form,i,currentTense);row.append(p,v);tbody.append(row)});table.append(tbody);body.append(table);
}
function toggleConj(force){if(!active||active.type!=='verb')return;conjOpen=typeof force==='boolean'?force:!conjOpen;$('conjPanel').hidden=!conjOpen;$('conjButton').setAttribute('aria-expanded',String(conjOpen));if(conjOpen)renderConjugations()}
function speak(){if(!active)return;if(!('speechSynthesis' in window)){toast('Speech playback is unavailable in this browser');return}try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(active.fr.replace(/\s*\([^)]*\)/g,''));u.lang='fr-FR';u.rate=.83;const voices=speechSynthesis.getVoices().filter(v=>v.lang.toLowerCase().startsWith('fr'));if(voices.length)u.voice=voices[0];speechSynthesis.speak(u)}catch{toast('Could not play the French pronunciation')}}
function openSettings(){$('settingsDialog').showModal()}
function exportProgress(){const blob=new Blob([JSON.stringify({...progress,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`mot-a-mot-progress-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function importProgress(file){if(!file)return;try{const text=await file.text();if(text.length>4_000_000)throw Error('Backup is too large');const obj=JSON.parse(text);if(!obj||!obj.records||Array.isArray(obj.records)||typeof obj.records!=='object')throw Error('Invalid backup format');let n=0;for(const [id,r] of Object.entries(obj.records)){if(!/^fr-[a-z0-9]+$/.test(id)||!['known','learning','unknown'].includes(r?.status))continue;if(!Number.isFinite(r.due))continue;const old=progress.records[id];if(!old||r.last>=old.last){progress.records[id]={status:r.status,streak:Math.max(0,Math.min(6,+r.streak||0)),reviews:Math.max(0,+r.reviews||1),last:+r.last||0,due:+r.due};n++}}save();resetSession();$('settingsDialog').close();toast(`Imported ${n} card ratings`)}catch(e){alert('Could not import backup: '+e.message)}finally{$('importInput').value=''}}
function wire(){
 $('flashcard').addEventListener('click',e=>{if(e.target.closest('button'))return;if(Date.now()<suppressClickUntil)return;flip()});
 let start=null,suppressClickUntil=0;
 $('flashcard').addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;start={x:e.clientX,y:e.clientY,time:Date.now()}});
 $('flashcard').addEventListener('pointerup',e=>{if(!start||e.target.closest('button'))return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(Math.abs(dx)>75&&Math.abs(dx)>Math.abs(dy)*1.2){suppressClickUntil=Date.now()+500;rating(dx<0?'unknown':'known')}else if(dy>90&&dy>Math.abs(dx)*1.1){suppressClickUntil=Date.now()+500;rating('learning')}});
 $('flashcard').addEventListener('pointercancel',()=>start=null);
 $('flashcard').addEventListener('keydown',e=>{if(e.target!==$('flashcard'))return;if(e.key===' '||e.key==='Enter'){e.preventDefault();e.stopPropagation();flip()}});
 for(const status of ['unknown','learning','known'])$(status+'Button').addEventListener('click',()=>rating(status));
 $('undoButton').addEventListener('click',undo);$('shuffleButton').addEventListener('click',shuffle);
 $('conjButton').addEventListener('click',e=>{e.stopPropagation();toggleConj()});$('closeConj').addEventListener('click',()=>toggleConj(false));$('listenButton').addEventListener('click',e=>{e.stopPropagation();speak()});
 for(const id of ['levelFilter','typeFilter','modeFilter'])$(id).addEventListener('change',resetSession);
 $('searchInput').addEventListener('input',resetSession);
 $('clearFilters').addEventListener('click',()=>{$('levelFilter').value='all';$('typeFilter').value='all';$('modeFilter').value='smart';$('searchInput').value='';resetSession()});
 document.addEventListener('keydown',e=>{if($('settingsDialog').open||['INPUT','SELECT','TEXTAREA','BUTTON'].includes(document.activeElement?.tagName))return;
 if(e.key==='ArrowLeft'){e.preventDefault();rating('unknown')}else if(e.key==='ArrowRight'){e.preventDefault();rating('known')}else if(e.key==='ArrowDown'){e.preventDefault();rating('learning')}else if(e.key===' '){e.preventDefault();flip()}});
 $('settingsButton').addEventListener('click',openSettings);$('closeSettings').addEventListener('click',()=>$('settingsDialog').close());$('exportButton').addEventListener('click',exportProgress);$('importInput').addEventListener('change',e=>importProgress(e.target.files[0]));
 $('resetButton').addEventListener('click',()=>{if(confirm('Reset ALL learning progress on this browser? This cannot be undone unless you have exported a backup.')){progress=defaultData();save();resetSession();$('settingsDialog').close();toast('All progress reset')}});
}
async function start(){wire();render();
 try{const r=await fetch('./data/cards.json',{cache:'no-cache'});if(!r.ok)throw Error('Static deck not available');const result=await r.json();if(!Array.isArray(result)||result.length<1500)throw Error('Static deck incomplete');cards=result;
 }catch{
  try{const fetched=await Promise.all(CHAPTERS.map((_,i)=>fetch(chapterUrl(i),{signal:AbortSignal.timeout(6500)}).then(r=>{if(!r.ok)throw Error(`Chapter ${i} HTTP ${r.status}`);return r.text()})));cards=buildDeck(fetched);if(cards.length<1500)throw Error('Incomplete source data');}
  catch(e){cards=fallbackDeck();toast('Offline preview: only the additional vocabulary is available. Publish via GitHub Actions for the full 1,500+ card deck.');console.warn('Fallback vocabulary:',e)}
 }
 try{const r=await fetch('./data/conjugations.json');if(r.ok)conjugations=await r.json()}catch{}
 loading=false;resetSession();}
start();
