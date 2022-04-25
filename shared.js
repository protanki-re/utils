import { PassThrough } from 'stream';

export async function read(stream) {
  const chunks = [];
  for await(const chunk of stream) chunks.push(chunk); 
  return Buffer.concat(chunks).toString('utf8');
}

export function encodeId(id, version) {
  if(typeof id !== 'bigint') id = BigInt(id);

  const _1 = (id & 0xff000000n) >> 24n;
  const _2 = (id & 0xff0000n) >> 16n;
  const _3 = (id & 0xff00n) >> 8n;
  const _4 = id & 0xffn;

  const encoded =
    _1.toString(8) +
    '/' +
    _2.toString(8) +
    '/' +
    _3.toString(8) +
    '/' +
    _4.toString(8) +
    '/' +
    version.toString(8);

  return encoded;
}

/**
 * @typedef FileInfo
 * @property {string} name
 * @property {number} size
 */

export function taraRead(/** @type {Buffer} */ buffer) {
  const stream = new PassThrough();
  stream.write(buffer);

  // console.log(buffer)

  /** @type {FileInfo} */
  const fileTable = [];
  /** @type {Record<string, Buffer>} */
  const files = {};

  const entriesCount = stream.read(4).readInt32BE();
  // console.log(`Entries: ${entriesCount}`);
  
  for(let index = 0; index < entriesCount; index++) {
    const nameLength = stream.read(2).readUInt16BE();
    // console.log('name length', nameLength);
    fileTable.push({
      name: stream.read(nameLength).toString(),
      size: stream.read(4).readInt32BE()
    });
  }
  // console.log(fileTable);

  for(const file of fileTable) {
    // console.log(`Reading ${stream.readableLength} / ${file.size}`)

    /** @type {Buffer} */
    const data = stream.read(file.size);

    files[file.name] = data;
  }

  return files;
}
