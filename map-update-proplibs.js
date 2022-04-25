import fetch from 'node-fetch';
import { readFile } from 'fs/promises';
import { XMLParser } from 'fast-xml-parser';

import { encodeId, read } from './shared.js';

const proplibs = JSON.parse(await readFile('proplibs.json', { encoding: 'utf8' }));

const map = await read(process.stdin);
const mapJson = JSON.parse(map);

const PROPS_START = '"proplibs":';
const PROPS_END = ']';

const propsStart = map.indexOf(PROPS_START);
if(propsStart === -1) throw new Error('Failed to find \'proplibs\' property start');

const propsEnd = map.indexOf(PROPS_END, propsStart);
if(propsEnd === -1) throw new Error('Failed to find \'proplibs\' property end');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '$'
});

let realVersion = 1;
const response = await fetch(`http://54.36.172.213:8080/resource/${encodeId(mapJson.id, realVersion)}/proplibs.xml`);
if(response.status !== 200) {
  console.error(`Failed to fetch map proplibs ${mapJson.id}:${realVersion}. Status code: ${response.status}`);
  throw new Error();
}
const data = await response.text();

const xml = parser.parse(data).proplibs;

let libraries = xml.library;
if(!(libraries instanceof Array)) libraries = [libraries];

const newProplibs = libraries.map((library) => {
  const newId = parseInt(library['$resource-id'], 16);
  const newVersion = parseInt(library.$version, 16);

  const exising = proplibs.find((proplib) => proplib.name === library.$name);
  if(!exising) {
    console.error(`  > Proplib missing in proplibs.json`);
    console.error(`  > Add new entry: { "name": ${JSON.stringify(library.$name)}, "id": ${newId}, "version": ${newVersion} }`);
    throw new Error();
  }

  if(exising.id !== newId) {
    console.error(`Invalid ID for ${exising.name} in proplibs.json. Map: ${newId}, proplibs.json: ${exising.id}`);
    throw new Error();
  }

  if(exising.version !== newVersion) {
    console.error(`Invalid version for ${exising.name} in proplibs.json. Map: ${newVersion}, proplibs.json: ${exising.version}`);
    throw new Error();
  }

  return `      ${JSON.stringify(library.$name)}`;
});

console.log(`${map.slice(0, propsStart)}"proplibs": [
${newProplibs.join(',\n')}
    ]${map.slice(propsEnd + PROPS_END.length)}`);
