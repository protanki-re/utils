import { readFile } from 'fs/promises';

import { read } from './shared.js';

const mapping = JSON.parse(await readFile('match-mapping.json', { encoding: 'utf8' }));

const map = await read(process.stdin);
const mapJson = JSON.parse(map);

const newMap = mapping.find((entry) => {
  let names = entry.name;
  if(!(names instanceof Array)) names = [names];

  return names.includes(`${mapJson.name}/${mapJson.theme}`);
});

const ID_START = '"id":';
const ID_END = ',';

const idStart = map.indexOf(ID_START);
if(idStart === -1) throw new Error('Failed to find \'id\' property start');

const idEnd = map.indexOf(ID_END, idStart);
if(idEnd === -1) throw new Error('Failed to find \'id\' property end');

const MAP_START = '"map":';
const MAP_END = ']';

const mapStart = map.indexOf(MAP_START);
if(mapStart === -1) throw new Error('Failed to find \'map\' property start');

const mapEnd = map.indexOf(MAP_END, mapStart);
if(mapEnd === -1) throw new Error('Failed to find \'map\' property end');

console.log(`${map.slice(0, idStart)}"id": ${newMap.id},${map.slice(idEnd + ID_END.length, mapStart)}"map": { "id": ${newMap.id}, "version": ${1} }${map.slice(mapEnd + MAP_END.length)}`);
