import _ from 'lodash';
import { readFile, writeFile } from 'fs/promises';

import { read } from './shared.js';

const mapping = JSON.parse(await readFile('garage.json', { encoding: 'utf8' }));

const item = await readFile(process.argv[2], { encoding: 'utf8' });
// const item = await read(process.stdin);
const itemJson = JSON.parse(item);

const INDEX_START = '"index":';
const INDEX_END = ',';

const indexStart = item.indexOf(INDEX_START);
if(indexStart === -1) throw new Error('Failed to find \'index\' property start');

const indexEnd = item.indexOf(INDEX_END, indexStart);
if(indexEnd === -1) throw new Error('Failed to find \'index\' property end');

const index = Number(`${item.slice(indexStart + INDEX_START.length, indexEnd)}`);
const newItem = mapping.find((mappingItem) => mappingItem.id === itemJson.id);

const newContent = `${item.slice(0, indexStart)}"index": ${newItem.index},${item.slice(indexEnd + INDEX_END.length)}`;
await writeFile(process.argv[2], newContent, { encoding: 'utf8' });
