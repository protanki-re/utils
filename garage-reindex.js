import _ from 'lodash';

import { read } from './shared.js';

const indexEval = process.argv[2];

const item = await read(process.stdin);

const INDEX_START = '"index":';
const INDEX_END = ',';

const indexStart = item.indexOf(INDEX_START);
if(indexStart === -1) throw new Error('Failed to find \'index\' property start');

const indexEnd = item.indexOf(INDEX_END, indexStart);
if(indexEnd === -1) throw new Error('Failed to find \'index\' property end');

const index = Number(`${item.slice(indexStart + INDEX_START.length, indexEnd)}`);

console.log(`${item.slice(0, indexStart)}"index": ${eval(indexEval)},${item.slice(indexEnd + INDEX_END.length)}`);
