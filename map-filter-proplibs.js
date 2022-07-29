import _ from 'lodash';
import { readFile } from 'fs/promises';
import { XMLParser } from 'fast-xml-parser';

const data = await readFile(process.argv[2], { encoding: 'utf8' });
const dataProplibs = await readFile(process.argv[3], { encoding: 'utf8' });

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: ''
});
console.log('Parsing map XML...');
const xml = parser.parse(data).map;
const xmlDataProplibs = parser.parse(dataProplibs).proplibs;

const asArray = (object) => object ? object instanceof Array ? object : [object] : [];

const props = asArray(xml['static-geometry']['prop']);
console.log('Extracting proplibs...');
const mapProplibs = _.chain(props.map((prop) => prop['library-name'])).uniq().value();

const proplibs = asArray(xmlDataProplibs['library']);

console.log('Generating proplibs XML file...');
const xmlProplibs = [];
for(const proplibName of mapProplibs) {
  const proplib = proplibs.find((proplib) => proplib.name === proplibName);
  if(!proplib) throw new Error(`Unknown proplib: ${proplibName}`);

  xmlProplibs.push(`  <library name='${proplib.name}' resource-id='${proplib['resource-id'].toString(16)}' version='${proplib.version.toString(16)}' />`);
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
