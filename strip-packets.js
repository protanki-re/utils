import * as readline from 'readline';

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

  if(side === 'SENT') return;

  if(args[0] === 'SYSTEM' && args[1] === 'load_resources') {
    console.log(args[2]);
  }

  if(args[0] === 'BATTLE' && args[1] === 'init_battle_model') {
    console.log(args[2]);
  }
});
