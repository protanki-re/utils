import _ from 'lodash';
import fetch from 'node-fetch';

import { encodeId, read } from './shared.js';

const BRUTE_FORCE_ATTEMPTS = 20;

const map = await read(process.stdin);

const VERSION_START = '"version":';
const VERSION_END = ',';

const versionStart = map.indexOf(VERSION_START);
if(versionStart === -1) throw new Error('Failed to find \'version\' property start');

const versionEnd = map.indexOf(VERSION_END, versionStart);
if(versionEnd === -1) throw new Error('Failed to find \'version\' property end');

const parsed = JSON.parse(map);
const id = parsed.resources.map[0].id;
const version = parsed.resources.map[0].version;

let attempt = 0;
let realVersion = version;
while(true) {
  const response = await fetch(`http://54.36.172.213:8080/resource/${encodeId(id, realVersion)}/map.xml`);
  if(response.status !== 200) {
    console.error(`${attempt !== 0 ? '  > ' : ''}Failed to fetch map ${id}:${realVersion}. Status code: ${response.status}`);
    // console.error(`Response: ${await response.text()}`);
    if(attempt === 0) {
      console.log(`  > Trying to brute force resource version (${BRUTE_FORCE_ATTEMPTS} attempts)...`);
      realVersion = realVersion + BRUTE_FORCE_ATTEMPTS;
    } else {
      realVersion--;
      if(realVersion <= version) {
        console.error(`  > Failed to brute force resource version in ${attempt} attempts`);
        throw new Error();
      }
    }
    attempt++;
    continue;
  }
  
  console.log(`Fetched ${id}:${realVersion}${attempt > 0 ? ` in ${attempt} brute force attempts` : ''}`);

  break;
}

console.log(`${map.slice(0, versionStart)}"version": ${realVersion},${map.slice(versionEnd + VERSION_END.length)}`);
