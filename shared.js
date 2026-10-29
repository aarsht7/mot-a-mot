import { ADVANCED_TEXT } from './advanced.js';

export const CHAPTERS = [
 'Bienvenue!', 'Bonjour!', 'Me voici !', 'Les vacances en France', 'Les gens', 'Bon appétit!', 'La ville', 'Les fêtes', 'La maison', 'Médias et communications', 'Mode, Forme et santé', 'Les études', 'La vie professionnelle', "L'amour et l'argent"
];
export const SOURCE_BASE = 'https://raw.githubusercontent.com/darigovresearch/Universal-Foreign-Language-Flashcards/master/fr-en/';
export const chapterFileName = n => `UFLF fr-en Vocabulary Chapter ${n} ${CHAPTERS[n]}.txt`;
export const chapterUrl = n => SOURCE_BASE + encodeURIComponent(chapterFileName(n));
export const LEVEL_BY_CHAPTER = n => n <= 2 ? 'A1' : n <= 6 ? 'A2' : n <= 10 ? 'B1' : 'B2';
export const clean = s => s.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
export const keyOf = s => s.toLowerCase().normalize('NFC').replace(/\s+/g,' ').trim();
export function hashCode(s){let h=2166136261;for(const c of s){h^=c.codePointAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
export function metaFor(fr,en){
 const f=fr.trim().toLowerCase(); const meaning=en.trim().toLowerCase();
 const intro=(f.match(/^(?:le |la |les |l['’]|un |une |des |du |de la )/)||[])[0]||'';
 let gender=null,plural=false;
 if(/\(f(?:\s|\)|\.|,)/.test(f))gender='Feminine';else if(/\(m(?:\s|\)|\.|,)/.test(f))gender='Masculine';
 if(!gender){if(/^(la |une |de la )/.test(f)) gender='Feminine'; else if(/^(le |un |du )/.test(f))gender='Masculine'}
 plural=/^(les |des )/.test(f)||/\bpl\b/.test(f);
 const verbLike=/^to(?:\s|$)/i.test(meaning);
 const head=(f.match(/^(?:s['’]|se\s+)?[a-zà-ÿœç-]+/u)||[])[0]||'';
 const bare=head.replace(/^(se\s+|s['’])/, '');
 const plausible=/(er|ir|re|oir|être|avoir|aller|faire)$/.test(bare);
 let type=verbLike&&plausible?'verb':intro?'noun':f.includes(' ')||/[!?.…]/.test(f)?'phrase':'other';
 const lemma=type==='verb'?head.replace(/\s+$/,''):null;
 return {type,gender,plural,lemma};
}
export function parseChapters(texts){
 const used = new Set();const cards=[];
 texts.forEach((content,n)=>{
  String(content||'').split(/\r?\n/).forEach(line=>{
   if(!line.includes('|')||/^(?:Introduction \(UFLF|<|\s*$)/.test(line))return;
   const ix=line.indexOf('|');const fr=clean(line.slice(0,ix)),en=clean(line.slice(ix+1));
   if(!fr||!en||/^<|^"?\s*</.test(fr)||/^<|^"?\s*</.test(en))return;
   const k=keyOf(fr);if(used.has(k))return;used.add(k);
   cards.push({id:'fr-'+hashCode(k),fr,en,level:LEVEL_BY_CHAPTER(n),topic:CHAPTERS[n],source:'UFLF / Français Interactif',...metaFor(fr,en)});
  });
 });
 return {cards,used};
}
export function buildDeck(texts){
 const {cards,used}=parseChapters(texts);
 for(const line of ADVANCED_TEXT.trim().split('\n')){
  const [level,fr,en,topic]=line.split('|');if(!level||!fr||!en)continue;
  const k=keyOf(fr);if(used.has(k))continue;used.add(k);
  cards.push({id:'fr-'+hashCode(k),fr,en,level,topic,source:'Original additions',...metaFor(fr,en)});
 }
 return cards;
}
export function fallbackDeck(){return buildDeck(Array(CHAPTERS.length).fill(''))}
