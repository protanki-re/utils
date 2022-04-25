import { read } from './shared.js';

const mapping = JSON.parse(await read(process.stdin));

let emptyCount = 0;
for(const map of mapping) {
  if(typeof map.name === 'string') continue;
  if(map.name.length < 1) emptyCount++;

  console.log(`${map.id} => ${JSON.stringify(map.name)}`);
}

console.log(`Empty: ${emptyCount}`);
