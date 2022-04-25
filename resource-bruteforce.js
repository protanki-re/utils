import fetch from 'node-fetch';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';

import { encodeId } from './shared.js';
import { setTimeout } from 'timers/promises';

const SIZE = 500;

let version = 1;
for(let rid = 0; rid <= 999999; rid += SIZE) {
  const tasks = [];
  for(let id = rid; id <= rid + SIZE; id++) {
    const promise = (async () => {
      // console.log(`Fetching resource ${id}:${version}...`);
      const response = await fetch(`http://54.36.172.213:8080/resource/${encodeId(id, version)}/map.xml`);
    
      if(response.status === 404) {
        // console.error(`Failed to fetch resource ${id}:${version}: not found`);
        return;
      }
      if(response.status !== 200) {
        console.error(`Failed to fetch resource ${id}:${version}. Status code: ${response.status}`);
        console.error(`Response: ${await response.text()}`);
        return;
      }
      const data = Buffer.from(await response.arrayBuffer());

      const dir = join('bruteforced/', id.toString(), version.toString());
      const file = join(dir, 'map.xml');
      await mkdir(dir, { recursive: true });
      await writeFile(file, data);

      console.log(`Saved resource ${file}: ${data.byteLength} bytes`);
    })();
    tasks.push(promise);
  }
  await Promise.all(tasks);
  // await setTimeout(50);

  console.log(`  > Fetched resources ${rid} to ${rid + SIZE}`);
}
