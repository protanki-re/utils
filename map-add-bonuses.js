import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';

import { encodeId, read } from './shared.js';

const map = await read(process.stdin);
const mapJson = JSON.parse(map);

const response = await fetch(`http://54.36.172.213:8080/resource/${encodeId(mapJson.resources.map[0].id, mapJson.resources.map[0].version)}/map.xml`);
const data = await response.text();

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '$'
});
const xml = parser.parse(data).map;

const regions = xml['bonus-regions']['bonus-region'];

const insert = `${regions.length > 0 ? `"bonuses": [
${regions.map((region) => {
    let modes = region['game-mode'];
    if(!modes) modes = [];
    if(!(modes instanceof Array)) modes = [modes];

    let types = region['bonus-type'];
    if(!types) types = [];
    if(!(types instanceof Array)) types = [types];
    
    types = types.map((type) => {
      if(type === 'medkit') return 'health';
      if(type === 'armorup') return 'double_armor';
      if(type === 'damageup') return 'double_damage';
      if(type === 'nitro') return 'nitro';
      if(type === 'crystal') return 'crystal';
      if(type === 'crystal_100') return 'gold';
      if(type === 'crystal_500') return 'gold';
      throw new Error(`Unknown bonus: ${type}`);
    }).map((value) => JSON.stringify(value));

    const values = [
      `"name": ${JSON.stringify(region.$name)}`,
      `"free": ${JSON.stringify(region.$free === 'true' ? true : false)}`,
      `"types": [ ${types.join(', ')} ]`,
      `"modes": ${modes.length > 0 ? `[ ${modes.map((mode) => JSON.stringify((mode === 'dom' ? 'cp' : mode).toUpperCase())).join(', ')} ]` : `[ ]`}`,
      `"parachute": ${JSON.stringify(region.$parachute === 'true' ? true : false)}`,
      region.min && region.max ? [
        `"position": {
        "min": { "x": ${JSON.stringify(Number(region.min.x ?? 0))}, "y": ${JSON.stringify(Number(region.min.y ?? 0))}, "z": ${JSON.stringify(Number(region.min.z ?? 0))} },
        "max": { "x": ${JSON.stringify(Number(region.max.x ?? 0))}, "y": ${JSON.stringify(Number(region.max.y ?? 0))}, "z": ${JSON.stringify(Number(region.max.z ?? 0))} }
      }`
      ] : [
        `"position": { "x": ${JSON.stringify(Number(region.position.x ?? 0))}, "y": ${JSON.stringify(Number(region.position.y ?? 0))}, "z": ${JSON.stringify(Number(region.position.z ?? 0))} }`
      ],
      `"rotation": { "x": ${JSON.stringify(Number(region.rotation.x ?? 0))}, "y": ${JSON.stringify(Number(region.rotation.y ?? 0))}, "z": ${JSON.stringify(Number(region.rotation.z ?? 0))} }`
    ];

    return `    {\n${values.map((value) => `      ${value}`).join(',\n')}\n    }`;
  }).join(',\n')}
  ]` : ''}`;
console.log(map.slice(0, -5) + `,\n  ${insert}\n}`);
