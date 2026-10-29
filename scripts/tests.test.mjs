import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDeck,metaFor,chapterUrl,CHAPTERS} from '../shared.js';
test('recognizes noun gender and verb grammar correctly',()=>{
 assert.deepEqual(metaFor('la maison','house').gender,'Feminine');
 assert.deepEqual(metaFor('un café','coffee').gender,'Masculine');
 assert.equal(metaFor("l'histoire (f)",'history').gender,'Feminine');
 assert.equal(metaFor('aller','to go').type,'verb');
 assert.equal(metaFor('aller','to go').gender,null);
 assert.equal(metaFor('parler','to speak').lemma,'parler');
});
test('deduplicates and adds advanced learning groups',()=>{
 const mock=CHAPTERS.map(()=> '');mock[0]='la maison|house\nparler|to speak\nla maison|house\n';
 const cards=buildDeck(mock);assert.equal(cards.filter(c=>c.fr==='la maison').length,1);
 assert.ok(cards.some(c=>c.level==='C1'));
 assert.ok(cards.some(c=>c.fr==='parler'&&c.type==='verb'));
 assert.ok(cards.every(c=>c.fr&&c.en&&c.id));
});
test('source URLs include chapter name',()=>assert.match(decodeURIComponent(chapterUrl(13)),/amour et l'argent/));
