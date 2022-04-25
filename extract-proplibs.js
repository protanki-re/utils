import _ from 'lodash';
import fetch from 'node-fetch';
import { join } from 'path';
import { XMLParser } from 'fast-xml-parser';
import { readdir, readFile } from 'fs/promises';

import { encodeId, taraRead } from './shared.js';

const root = process.argv[2];
const BRUTE_FORCE_ATTEMPTS = 10;

const rawProplibs = [];
for(const mapName of await readdir(root)) {
  const mapPath = join(root, mapName);
  for(const themeName of await readdir(mapPath)) {
    const themePath = join(mapPath, themeName);
    console.log(`Reading ${mapName}/${themeName}...`);

    const map = JSON.parse(await readFile(themePath));
    for(const proplib of map.resources.props) {
      console.log(`  > ${proplib.id}:${proplib.version}`);
      rawProplibs.push({ id: proplib.id, version: proplib.version });
    }
  }
}

const uniqueProplibs = _
  .chain(rawProplibs)
  .groupBy((proplib) => proplib.id)
  .map((proplibs, id) => _.maxBy(proplibs, (proplib) => proplib.version))
  .value();

console.log(uniqueProplibs);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '$'
});

const proplibs = [];
for(const proplib of uniqueProplibs) {
  let attempt = 0;
  let realVersion = proplib.version;
  while(true) {
    const response = await fetch(`http://54.36.172.213:8080/resource/${encodeId(proplib.id, realVersion)}/library.tara`);
    if(response.status !== 200) {
      console.error(`${attempt !== 0 ? '  > ' : ''}Failed to fetch proplib ${proplib.id}:${realVersion}. Status code: ${response.status}`);
      // console.error(`Response: ${await response.text()}`);
      if(attempt === 0) {
        console.log(`  > Trying to brute force resource version (${BRUTE_FORCE_ATTEMPTS} attempts)...`);
        realVersion = realVersion + BRUTE_FORCE_ATTEMPTS;
      } else {
        realVersion--;
        if(realVersion <= proplib.version) {
          console.error(`  > Failed to brute force resource version in ${attempt} attempts`);
          break;
        }
      }
      attempt++;
      continue;
    }

    const data = Buffer.from(await response.arrayBuffer());
    const files = taraRead(data);
    const metadata = files['library.xml'].toString();

    const xml = parser.parse(metadata).library;

    const name = xml.$name;
    let props = xml['prop-group'].prop;
    if(!(props instanceof Array)) props = [props];
    
    console.log(`Fetched ${proplib.id}:${realVersion}${attempt > 0 ? ` in ${attempt} brute force attempts` : ''}`);
    console.log(`  > ${name}: ${props.length} props`);

    proplibs.push(`  { "name": ${JSON.stringify(name)}, "id": ${proplib.id}, "version": ${realVersion} }`);

    break;
  }
}

console.error(`Extracted ${proplibs.length} proplibs`);
console.log(`[
${proplibs.join(',\n')}
]`);
