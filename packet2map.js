import fetch from 'node-fetch';
import * as readline from 'readline';
import { readFile } from 'fs/promises';
import { XMLParser } from 'fast-xml-parser';

const rl = readline.createInterface({ 
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

let resources = [];
let map = null;

const await4lines = () => new Promise((resolve, reject) => {
  let index = 0;
  rl.on('line', (line) => {
    if(index < 3) {
      resources.push(line);
    }
    if(index === 3) {
      map = JSON.parse(line);
      resolve();
    }

    index++;
  });
});

const question = (query) => new Promise((resolve, reject) => {
  rl.question(query, (input) => resolve(input));
});

await await4lines();

// const resources = [
//   await question('resources[0]: '),
//   await question('resources[1]: '),
//   await question('resources[2]: ')
// ];

resources = resources.map((json) => JSON.parse(json)).map((resources) => resources.resources !== undefined ? resources.resources : resources);

// const map = JSON.parse(await question('init_battle_model: '));

rl.close();

function encodeId(id, version) {
  if(typeof id !== 'bigint') id = BigInt(id);

  const _1 = (id & 0xff000000n) >> 24n;
  const _2 = (id & 0xff0000n) >> 16n;
  const _3 = (id & 0xff00n) >> 8n;
  const _4 = id & 0xffn;

  const encoded =
    _1.toString(8) +
    '/' +
    _2.toString(8) +
    '/' +
    _3.toString(8) +
    '/' +
    _4.toString(8) +
    '/' +
    version.toString(8);

  return encoded;
}

const maps = JSON.parse(await readFile('maps.json', { encoding: 'utf8' }));

const js = JSON.stringify;

const toLong = (high, low) => (BigInt(high) << 32n) | BigInt(low);

const skybox = JSON.parse(map.skybox);
const visual = JSON.parse(map.map_graphic_data);

const mapResource = resources[2][0];

const response = await fetch(`http://54.36.172.213:8080/resource/${encodeId(toLong(mapResource.idhigh, mapResource.idlow), toLong(mapResource.versionhigh, mapResource.versionlow))}/map.xml`);
const data = await response.text();

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '$'
});
const xml = parser.parse(data).map;

const spawnPoints = xml['spawn-points']['spawn-point'];

const flags = xml['ctf-flags'];

let points = [];
if(xml['dom-keypoints']['dom-keypoint']) points = xml['dom-keypoints']['dom-keypoint'];
if(!(points instanceof Array)) points = [points];

let theme;
if(visual.mapTheme === 'SUMMER') theme = 'summer_day';
else if(visual.mapTheme === 'SUMMER_NIGHT') theme = 'summer_night';
else if(visual.mapTheme === 'WINTER') theme = 'winter_day';
else if(visual.mapTheme === 'WINTER_NIGHT') theme = 'winter_night';
else if(visual.mapTheme === 'SPACE') theme = 'space';
else throw Error(`Unknown map theme: ${visual.mapTheme}`);

const result = `{
  "name": ${js(map.map_id)},
  "theme": ${js(theme)},

  "id": ${js(map.mapId)},
  "preview": ${js(maps.find((item) => item.mapId === map.map_id && item.theme === visual.mapTheme).preview)},

  "visual": {
    "angleX": ${js(visual.angleX)},
    "angleZ": ${js(visual.angleZ)},

    "lightColor": ${js(visual.lightColor)},
    "shadowColor": ${js(visual.shadowColor)},

    "fogAlpha": ${js(visual.fogAlpha)},
    "fogColor": ${js(visual.fogColor)},

    "farLimit": ${js(visual.farLimit)},
    "nearLimit": ${js(visual.nearLimit)},

    "gravity": ${js(visual.gravity)},
    "skyboxRevolutionSpeed": ${js(visual.skyboxRevolutionSpeed)},
    "ssaoColor": ${js(visual.ssaoColor)},

    "dustAlpha": ${js(visual.dustAlpha)},
    "dustDensity": ${js(visual.dustDensity)},
    "dustFarDistance": ${js(visual.dustFarDistance)},
    "dustNearDistance": ${js(visual.dustNearDistance)},
    "dustParticle": ${js(visual.dustParticle)},
    "dustSize": ${js(visual.dustSize)}
  },
  "skybox": {
    "top": ${js(skybox.top)},
    "front": ${js(skybox.front)},
    "back": ${js(skybox.back)},
    "bottom": ${js(skybox.bottom)},
    "left": ${js(skybox.left)},
    "right": ${js(skybox.right)}
  },
  "resources": {
    "props": [
${resources[0].map((resource) => `      { "id": ${toLong(resource.idhigh, resource.idlow)}, "version": ${toLong(resource.versionhigh, resource.versionlow)}, "lazy": ${resource.lazy}${resource.alpha !== undefined ? `, "alpha": ${resource.alpha}` : ''}, "type": ${resource.type} }`).join(',\n')}
    ],
    "skybox": [
${resources[1].map((resource) => `      { "id": ${toLong(resource.idhigh, resource.idlow)}, "version": ${toLong(resource.versionhigh, resource.versionlow)}, "lazy": ${resource.lazy}${resource.alpha !== undefined ? `, "alpha": ${resource.alpha}` : ''}, "type": ${resource.type} }`).join(',\n')}
    ],
    "map": [
${resources[2].map((resource) => `      { "id": ${toLong(resource.idhigh, resource.idlow)}, "version": ${toLong(resource.versionhigh, resource.versionlow)}, "lazy": ${resource.lazy}${resource.alpha !== undefined ? `, "alpha": ${resource.alpha}` : ''}, "type": ${resource.type} }`).join(',\n')}
    ]
  },
  "spawnPoints": [
${spawnPoints.map((point) => {
  let type = point.$type;
  let team = point.$team;

  if(type === 'blue' || type === 'red') {
    team = type;
    type = undefined;
  }

  if(type === 'dom') type = 'cp';
  if(team === 'free') team = undefined;

  const values = [
    ...(type !== undefined ? [`"mode": ${JSON.stringify(type.toUpperCase())}`] : []),
    ...(team !== undefined ? [`"team": ${JSON.stringify(team.toUpperCase())}`] : []),
    ...(point.$point_id !== undefined ? [`"point": ${JSON.stringify(point.$point_id.toUpperCase())}`] : []),
    `"position": { "x": ${JSON.stringify(point.position.x ?? 0)}, "y": ${JSON.stringify(point.position.y ?? 0)}, "z": ${JSON.stringify(point.position.z ?? 0)} }`,
    `"rotation": { "x": ${JSON.stringify(point.rotation.x ?? 0)}, "y": ${JSON.stringify(point.rotation.y ?? 0)}, "z": ${JSON.stringify(point.position.z ?? 0)} }`
  ];

  return `    {\n${values.map((value) => `      ${value}`).join(',\n')}\n    }`;
}).join(',\n')}
  ],
  "flags": {
    "RED": {
      "position": { "x": ${JSON.stringify(flags['flag-red'].x ?? 0)}, "y": ${JSON.stringify(flags['flag-red'].y ?? 0)}, "z": ${JSON.stringify(flags['flag-red'].z ?? 0)} }
    },
    "BLUE": {
      "position": { "x": ${JSON.stringify(flags['flag-blue'].x ?? 0)}, "y": ${JSON.stringify(flags['flag-blue'].y ?? 0)}, "z": ${JSON.stringify(flags['flag-blue'].z ?? 0)} }
    }
  },
  "points": [
${points.map((point) => {
  return `    {
      "id": ${JSON.stringify(point.$name)},
      "distance": ${JSON.stringify(Number(point.$distance))},
      "free": ${JSON.stringify(point.$free === 'true' ? true : false)},
      "position": { "x": ${JSON.stringify(Number(point.position.x) ?? 0)}, "y": ${JSON.stringify(Number(point.position.y) ?? 0)}, "z": ${JSON.stringify(Number(point.position.z) ?? 0)} }
    }`;
}).join(',\n')}
  ]
}`;

console.log(result);
