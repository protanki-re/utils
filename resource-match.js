import _ from 'lodash';
import fetch from 'node-fetch';
import { join } from 'path';
import { XMLParser } from 'fast-xml-parser';
import { readdir, readFile } from 'fs/promises';

import { encodeId } from './shared.js';

const unknownMaps = process.argv[2];
const mapsRoot = process.argv[3];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '$'
});

const unknownMapping = [];
for(const unknownMap of await readdir(unknownMaps)) {
  const unknownMapPath = join(unknownMaps, unknownMap);
  for(const unknownVersion of await readdir(unknownMapPath)) {
    const unknownVersionPath = join(unknownMapPath, unknownVersion);
    console.log(`Fetching proplibs for ${unknownMap}/${unknownVersion}...`)

    const response = await fetch(`http://54.36.172.213:8080/resource/${encodeId(Number(unknownMap), Number(unknownVersion))}/proplibs.xml`);
    const data = await response.text();
    const xml = parser.parse(data);

    let xmlProplibs = xml.proplibs.library;
    if(!(xmlProplibs instanceof Array)) xmlProplibs = [xmlProplibs];

    const unknownProplibs = xmlProplibs.map((xmlProplib) => ({
      name: xmlProplib.$name,
      id: xmlProplib['$resource-id'],
      version: xmlProplib['$version']
    }));

    unknownMapping.push({
      map: { id: unknownMap, version: unknownVersion },
      proplibs: unknownProplibs
    });
  }
}
// console.log(unknownMapping);

const knownMapping = [];
for(const mapName of await readdir(mapsRoot)) {
  const mapPath = join(mapsRoot, mapName);
  for(const themeName of await readdir(mapPath)) {
    const themePath = join(mapPath, themeName);
    console.log(`Reading ${mapName}/${themeName}...`);

    const map = JSON.parse(await readFile(themePath));

    knownMapping.push({
      name: map.name,
      theme: map.theme,
      proplibs: map.resources.proplibs
    });
  }
}
// console.log(knownMapping);

const mapping = [];
for(const unknownMap of unknownMapping) {
  // console.log(unknownMap.proplibs.map((proplib) => proplib.name))
  let known = knownMapping.filter((known) => _.isEqual(unknownMap.proplibs.map((proplib) => proplib.name).sort(), known.proplibs.sort()));
  console.log(`${unknownMap.map.id}/${unknownMap.map.version}`, known.map((known) => `${known.name}/${known.theme}`));

  let names = known.map((known) => `${known.name}/${known.theme}`);
  if(names.length === 1) names = names[0];

  mapping.push(`  { "id": ${unknownMap.map.id}, "name": ${JSON.stringify(names)} }`);
}
console.log(`[
${mapping.join(',\n')}
]`);
