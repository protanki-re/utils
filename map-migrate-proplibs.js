import { readFile } from 'fs/promises';

import { read } from './shared.js';

const proplibs = JSON.parse(await readFile('proplibs.json', { encoding: 'utf8' }));

const map = await read(process.stdin);

const PROPS_START = '"props":';
const PROPS_END = ']';

const propsStart = map.indexOf(PROPS_START);
if(propsStart === -1) throw new Error('Failed to find \'props\' property start');

const propsEnd = map.indexOf(PROPS_END, propsStart);
if(propsEnd === -1) throw new Error('Failed to find \'props\' property end');

const propsRaw = map.substring(propsStart + PROPS_START.length, propsEnd + PROPS_END.length);
const props = JSON.parse(propsRaw);

const newProplibs = props.map((prop) => {
  const proplib = proplibs.find((proplib) => proplib.id === prop.id);

  return `      ${JSON.stringify(proplib.name)}`;
});

console.log(`${map.slice(0, propsStart)}"proplibs": [
${newProplibs.join(',\n')}
    ]${map.slice(propsEnd + PROPS_END.length)}`);
