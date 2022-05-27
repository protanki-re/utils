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

  let redacted = false;
  if(side === 'SENT' && args[0] === 'auth' && args[1] === 'login') {
    try {
      // Old client versions
      const info = JSON.parse(args[2]);
      info.password = '[REDACTED]';
      args[2] = JSON.stringify(info);
    } catch {
      args[5] = '[REDACTED]';
    }
    redacted = true;
  }

  if(side === 'RECEIVED' && args[0] === 'AUTH' && args[1] === 'set_entrance_hash') {
    args[2] = '[REDACTED]';
    redacted = true;
  }

  if(side === 'SENT' && args[0] === 'auth' && (args[1] === 'loginByHash' || args[1] === 'login_by_hash')) {
    args[2] = '[REDACTED]';
    redacted = true;
  }

  if(redacted) {
    console.log(args.join(';'));
  } else {
    console.log(line);
  }
});
