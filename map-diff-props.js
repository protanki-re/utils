import _ from 'lodash';
import { XMLParser } from 'fast-xml-parser';

import { readFile } from 'fs/promises';

const data1 = await readFile(process.argv[2]);
const data2 = await readFile(process.argv[3]);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: ''
});
const xml1 = parser.parse(data2).map;
const xml2 = parser.parse(data1).map;

const asArray = (object) => object ? object instanceof Array ? object : [object] : [];

const props1 = asArray(xml1['static-geometry']['prop']);
const props2 = asArray(xml2['static-geometry']['prop']);

const proplibs1 = _.chain(props1.map((prop) => prop['library-name'])).uniq().orderBy().value();
const proplibs2 = _.chain(props2.map((prop) => prop['library-name'])).uniq().orderBy().value();

// console.log(`Proplibs (${proplibs1.length}):\n${proplibs1.map((proplib) => `  > ${proplib}`).join('\n')}`);

console.log(`Props 1: ${props1.length}`);
console.log(`Props 2: ${props2.length}`);

const hash = (prop) => [prop['library-name'], prop['group-name'], prop['name']].join('|');

const diff = _.uniqBy(_.differenceWith(props1, props2, (prop1, prop2) => hash(prop1) == hash(prop2)), hash);
console.log(`Diff (${diff.length}):\n${diff.map((prop) => `  > ${prop['library-name']}.${prop['group-name']}.${prop['name']}`).join('\n')}`);
