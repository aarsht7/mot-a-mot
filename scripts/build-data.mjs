import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { buildDeck, CHAPTERS, chapterUrl } from '../shared.js';
const require = createRequire(import.meta.url);
const TENSES = ['PRESENT','PASSE_COMPOSE','IMPARFAIT','FUTUR','CONDITIONNEL_PRESENT','SUBJONCTIF_PRESENT','PLUS_QUE_PARFAIT'];
async function fetchChapter(i){
 const url=chapterUrl(i);let lastError;
 for(let attempt=0;attempt<3;attempt++){
  try{const r=await fetch(url,{headers:{'User-Agent':'MotAMot-StudyDeck/1.0'}});if(!r.ok)throw Error(`HTTP ${r.status}`);return await r.text()}
  catch(e){lastError=e;await new Promise(ok=>setTimeout(ok,700*(attempt+1)))}
 }
 throw new Error(`Unable to download chapter ${i}: ${lastError}`);
}
const source=await Promise.all(CHAPTERS.map((_,i)=>fetchChapter(i)));
const cards=buildDeck(source);
if(cards.length<1500)throw new Error(`Only ${cards.length} cards; build requires at least 1,500 distinct cards`);
let frenchVerbs=null, lefff=null;
try{frenchVerbs=require('french-verbs');lefff=require('french-verbs-lefff/dist/conjugations.json')}catch(err){throw new Error('Conjugation packages are required: run npm install before npm run build. '+err.message)}
const conj={};
const lemmas=[...new Set(cards.filter(c=>c.type==='verb'&&c.lemma).map(c=>c.lemma))];
for(const verb of lemmas){
 const tables={};
 for(const tense of TENSES){
  const forms=[];
  for(let person=0;person<6;person++){
   try{
    const form=frenchVerbs.getConjugation(lefff,verb,tense,person,{agreeGender:'M',agreeNumber:person>=3?'P':'S'});
    forms.push(typeof form==='string'&&form.trim()?form:null);
   }catch{forms.push(null)}
  }
  if(forms.some(Boolean))tables[tense]=forms;
 }
 if(Object.keys(tables).length)conj[verb]=tables;
}
await mkdir('data',{recursive:true});
await writeFile('data/cards.json',JSON.stringify(cards));
await writeFile('data/conjugations.json',JSON.stringify(conj));
const escapeCsv=x=>'"'+String(x??'').replace(/"/g,'""')+'"';
const columns=['id','fr','en','level','type','gender','plural','lemma','topic'];
await writeFile('data/french-vocabulary.csv','\uFEFF'+columns.join(',')+'\r\n'+cards.map(c=>columns.map(k=>escapeCsv(c[k])).join(',')).join('\r\n'));
const stats=Object.fromEntries(['A1','A2','B1','B2','C1'].map(l=>[l,cards.filter(c=>c.level===l).length]));
console.log(`Built ${cards.length} unique French cards; ${lemmas.length} candidate verbs, ${Object.keys(conj).length} with conjugations. CEFR learning-group estimates: ${JSON.stringify(stats)}`);
