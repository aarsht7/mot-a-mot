import {mkdir,copyFile} from 'node:fs/promises';
import {join} from 'node:path';
const output='dist';
await mkdir(join(output,'data'),{recursive:true});
const sourceFiles=['index.html','styles.css','app.js','recall.js','shared.js','advanced.js','favicon.svg','ATTRIBUTION.md','.nojekyll'];
const dataFiles=['cards.json','conjugations.json','french-vocabulary.csv'];
await Promise.all([
 ...sourceFiles.map(file=>copyFile(file,join(output,file))),
 ...dataFiles.map(file=>copyFile(join('data',file),join(output,'data',file)))
]);
console.log(`Static site assembled into ${output}/ for GitHub Pages or Vercel.`);
