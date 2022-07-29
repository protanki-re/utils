import _ from 'lodash';
import fetch from 'node-fetch';
import { readFile } from 'fs/promises';

import { encodeId } from './shared.js';

const proplibs = JSON.parse(await readFile('proplibs.json', { encoding: 'utf8' }));

const BRUTEFORCE_ATTEMPTS = 15;

const proplibsNew = [];
for(const proplib of proplibs) {
  const id = proplib.id;
  let realVersion = proplib.version + BRUTEFORCE_ATTEMPTS;
  console.log(`Updating proplib ${id}:${proplib.version} (${proplib.name})...`);
  while(true) {
    if(realVersion <= proplib.version) {
      console.error(`  - No update for ${id}:${proplib.version} (${proplib.name}): no attempts left`);
      break;
    }

    try {
      // console.log(`  > Fetching resource ${id}:${realVersion}...`);
      const response = await fetch(`http://54.36.172.213:8080/resource/${encodeId(id, realVersion)}/library.tara`);

      if(response.status === 404) {
        // console.error(`  > Failed to fetch resource ${id}:${realVersion}: not found`);
        realVersion--;
        continue;
      }
      if(response.status !== 200) {
        console.error(`  > Failed to fetch resource ${id}:${realVersion}. Status code: ${response.status}`);
        console.error(`  > Response: ${await response.text()}`);
        continue;
      }

      console.log(`  + Updated ${id}:${proplib.version} -> ${realVersion}`);
      break;
    } catch(error) {
      console.error(`  > Failed to fetch resource ${id}:${realVersion}. ${error}`);
    }
  }

  proplibsNew.push(`  { "name": ${JSON.stringify(proplib.name)}, "id": ${proplib.id}, "version": ${realVersion} }`);
}

console.log(`[
${proplibsNew.join(',\n')}
]`);