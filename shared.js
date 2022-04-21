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
