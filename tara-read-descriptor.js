import _ from 'lodash';
import { readFile } from 'fs/promises';

import { taraRead } from './shared.js';

const file = process.argv[2];
const files = taraRead(await readFile(file, { encoding: null }));

console.log(`Files:\n${Object.keys(files).map((file) => `  > ${file}`).join('\n')}`);
console.log();
console.log(`library.xml:\n${files['library.xml']}`);
