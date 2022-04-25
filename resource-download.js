import _ from 'lodash';
import fetch from 'node-fetch';
import { dirname, join } from 'path';
import { mkdir, readdir, readFile, writeFile } from 'fs/promises';

import { encodeId, toLong } from './shared.js';

/**
 * Resource locations:
 * - auth/lobby/garage.json
 * - proplibs.json
 * - maps/* (skybox & map)
 */

const CHUNK_SIZE = 50;

const root = process.argv[2];
console.log(`Resource root directory: ${root}`);

const RESOURCE_TYPES = {
  1: [ ], /* SwfLibrary */
  2: [ ], /* ModelAlternativa3D */
  3: [ ], /* MovieClip */
  4: [ 'sound.swf' ], /* Sound */
  7: [ 'map.xml', 'proplibs.xml' ], /* Map */
  8: [ 'library.tara' ], /* PropLibrary */
  9: [ '3ds.tara', 'images.xml', 'object.3ds' ], /* LegacyModel3DS (unused) */
  10: [ 'image.jpg' ], /* Image */
  11: [ 'image.tara' ], /* MultiframeImage */
  13: [ 'image.jpg' ], /* LocalizedImage */
  17: [ 'images.xml', 'object.3ds' ] /* Model3DS */
}

const downloadQueue = [];
async function doDownload(id, version, file) {
  const response = await fetch(`http://54.36.172.213:8080/resource/${encodeId(id, version)}/${file}`);

  if(response.status !== 200) {
    console.error(`  > Failed to fetch resource ${id}:${version}: ${response.status}`);
    if(response.status !== 200) {
      console.error(`  > Response: ${await response.text()}`);
    }
    return;
  }
  const data = Buffer.from(await response.arrayBuffer());

  const path = join(root, 'static', 'original', id.toString(), version.toString(), file);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, data);
  
  console.log(`  > Downloaded resource ${id}:${version}/${file}`);
}

async function download(id, version, file) {
  for(let realVersion = version; realVersion > 0; realVersion--) {
    downloadQueue.push({ id: id, version: version, file: file });
  }
}

const screensDirectory = join(root, 'resources');
for(const screenName of await readdir(screensDirectory)) {
  const screen = join(screensDirectory, screenName);
  const json = JSON.parse(await readFile(screen, { encoding: 'utf8' }));

  for(const resource of json.resources) {
    const id = toLong(resource.idhigh, resource.idlow);
    const version = toLong(resource.versionhigh, resource.versionlow);
    const files = [...RESOURCE_TYPES[resource.type]];

    if((resource.type === 10 || resource.type === 13) && resource.alpha) files.push('alpha.jpg');
    if(files.length < 1) throw new Error(`Missing files for resource type: ${resource.type}`);
    for(const file of files) {
      await download(id, version, file);
    }
  }
}

const proplibs = JSON.parse(await readFile(join(root, 'proplibs.json'), { encoding: 'utf8' }));
for(const resource of proplibs) {
  await download(resource.id, resource.version, RESOURCE_TYPES[8][0]);
}

const mapsRoot = join(root, 'maps');
for(const mapName of await readdir(mapsRoot)) {
  const mapPath = join(mapsRoot, mapName);
  for(const themeName of await readdir(mapPath)) {
    const themePath = join(mapPath, themeName);
    console.log(`Reading ${mapName}/${themeName}...`);

    const map = JSON.parse(await readFile(themePath));
    for(const resource of map.resources.skybox) {
      const files = [...RESOURCE_TYPES[resource.type]];
  
      if((resource.type === 10 || resource.type === 13) && resource.alpha) files.push('alpha.jpg');
      if(files.length < 1) throw new Error(`Missing files for resource type: ${resource.type}`);
      for(const file of files) {
        await download(resource.id, resource.version, file);
      }
    }

    const resource = map.resources.map
    const files = [...RESOURCE_TYPES[7]];
    for(const file of files) {
      await download(resource.id, resource.version, file);
    }
  }
}

const chunks = _.chunk(downloadQueue, CHUNK_SIZE);
for(const chunk of chunks) {
  const tasks = chunk.map(async (entry) => {
    await doDownload(entry.id, entry.version, entry.file);
  });
  await Promise.all(tasks);
}
console.log(`Downloaded: ${downloadQueue.length} files`);
