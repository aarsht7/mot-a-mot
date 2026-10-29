import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDeck,metaFor,chapterUrl,CHAPTERS} from '../shared.js';
import {outcomeForSwipe,validSlowThreshold,DEFAULT_SLOW_THRESHOLD_SECONDS} from '../recall.js';
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

test('two swipes, with slow known responses sent to Learning',()=>{
 assert.equal(outcomeForSwipe('left',1000), 'unknown');
 assert.equal(outcomeForSwipe('left',18000), 'unknown');
 assert.equal(outcomeForSwipe('right',1500), 'known');
 assert.equal(outcomeForSwipe('right',12000), 'known');
 assert.equal(outcomeForSwipe('right',12001), 'learning');
 assert.equal(outcomeForSwipe('right',10000,8), 'learning');
 assert.equal(outcomeForSwipe('right',10000,20), 'known');
 assert.equal(validSlowThreshold('30'),30);
 assert.equal(validSlowThreshold(500),DEFAULT_SLOW_THRESHOLD_SECONDS);
 assert.throws(()=>outcomeForSwipe('down',2000),/Only left and right/);
});
