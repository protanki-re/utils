import { readFile } from 'fs/promises';

import { readBuffer } from './shared.js';

const proplibs = JSON.parse(await readFile('proplibs.json', { encoding: 'utf8' }));

const data = await readBuffer(process.stdin);

const map = JSON.parse(data);

const xmlProplibs = [];
for(const proplibName of map.resources.proplibs) {
  const proplib = proplibs.find((proplib) => proplib.name === proplibName);
  if(!proplib) throw new Error(`Unknown proplib: ${proplibName}`);

  xmlProplibs.push(`  <library name='${proplib.name}' resource-id='${proplib.id.toString(16)}' version='${proplib.version.toString(16)}' />`);
}

console.log(`<proplibs>
${xmlProplibs.join('\n')}
</proplibs>`);
