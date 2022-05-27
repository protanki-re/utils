import * as readline from 'readline';

// Example: R::system::set_aes_data::data
const filters = process.argv[2].split(',').map((command) => command.split('::'));

const rl = readline.createInterface({ 
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  const index = line.indexOf(':');
  const side = line.slice(0, index).trim();
  const data = line.slice(index + 2);
  const args = data.split(';');

  for(const filter of filters) {
    const filterSide = filter[0] === 'S' ? 'SENT' : filter[0] === 'R' ? 'RECEIVED' : null;
    if(filterSide !== null && side !== filterSide) continue; // Side
    if(args[0].toLowerCase() !== filter[1].toLowerCase()) continue; // Category
    if(args[1].toLowerCase() !== filter[2].toLowerCase()) continue; // Command
    if(filter[3] === 'raw') {
      console.log(data);
    } else if(filter[3] === 'data') {
      console.log(args.slice(2).filter((data) => data.length > 0).join(';'));
    } else {
      throw new Error(`Unknown format: ${filter[3]}`)
    }
  }
});
