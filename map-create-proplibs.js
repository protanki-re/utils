import _ from 'lodash';
import { readFile } from 'fs/promises';
import { XMLParser } from 'fast-xml-parser';

const proplibs = JSON.parse(await readFile('proplibs.json', { encoding: 'utf8' }));

const data = await readFile(process.argv[2], { encoding: null });

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: ''
});
console.log('Parsing map XML...');
const xml = parser.parse(data).map;

const asArray = (object) => object ? object instanceof Array ? object : [object] : [];

const props = asArray(xml['static-geometry']['prop']);
console.log('Extracting proplibs...');
const mapProplibs = _.chain(props.map((prop) => prop['library-name'])).uniq().value();

console.log('Generating proplibs XML file...');
const xmlProplibs = [];
for(const proplibName of mapProplibs) {
  const proplib = proplibs.find((proplib) => proplib.name === proplibName);
  if(!proplib) throw new Error(`Unknown proplib: ${proplibName}`);

  xmlProplibs.push(`  <library name='${proplib.name}' resource-id='${proplib.id.toString(16)}' version='${proplib.version.toString(16)}' />`);
}

console.log('Generating proplibs JSON file...');
const jsonProplibs = [];
for(const proplibName of mapProplibs) {
  const proplib = proplibs.find((proplib) => proplib.name === proplibName);
  if(!proplib) throw new Error(`Unknown proplib: ${proplibName}`);

  jsonProplibs.push(`      ${JSON.stringify(proplib.name)}`);
}

console.log(`<proplibs>
${xmlProplibs.join('\n')}
</proplibs>`);

console.log();

console.log(`   "proplibs": [
${jsonProplibs.join(',\n')}
    ]`);
