import { join } from 'path';
import { readdir, readFile } from 'fs/promises';

const mappingFile = process.argv[2];
const mapsRoot = process.argv[3];

const mapping = JSON.parse(await readFile(mappingFile, { encoding: 'utf8' }));

const mapped = [];
for(const map of mapping) {
  if(map.name instanceof Array) {
    mapped.push(...map.name);
  } else {
    mapped.push(map.name);
  }
}

const maps = [];
for(const mapName of await readdir(mapsRoot)) {
  const mapPath = join(mapsRoot, mapName);
  for(const themeName of await readdir(mapPath)) {
    const themePath = join(mapPath, themeName);
    const map = JSON.parse(await readFile(themePath));

    const key = `${map.name}/${map.theme}`;
    maps.push(key);

    if(!mapped.includes(key)) {
      console.log(`Not mapped: ${key}`);
    }
  }
}

for(const map of mapped) {
  if(!maps.includes(map)) {
    console.log(`No map JSON: ${map}`);
  }
}

console.log(`Mapped: ${mapped.length} / ${maps.length}`);
