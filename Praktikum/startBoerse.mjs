import {Bank, firstBank} from './Bank.mjs';
import { Boerse, b1 } from './Boerse.mjs';
import { Wertpapier, MSFT, LSFT } from './Wertpapier.mjs';
import { createInterface } from 'readline';
import { stdin, stdout } from 'process';
b1.connectToBank(firstBank);
b1.addWerpapier(MSFT, 100);
console.log(b1.wertpapiers);
b1.sendData(MSFT, 50);
setInterval(() => {
    b1.addWerpapier(MSFT, 100);
    console.log(b1.wertpapiers);
    b1.sendData(MSFT, 50);
}, 1000);



// const rl = createInterface({
//     input: stdin,
//     output: stdout
//   });  
// process.stdin.setRawMode(true);
// process.stdin.resume();
// console.log("Press e key to send data to the bank or q to quit");
// rl.input.on('data', (key) => {
//     const keyPressed = key.toString();
//     if (keyPressed === 'q') {
//       console.log('Exiting...');
//       rl.close();
//     } else if (keyPressed === 'e' || keyPressed === 'E') {
//       b1.addWerpapier(MSFT, 100);
//       console.log(b1.wertpapiers);
//       b1.sendData(MSFT, 50);
//     }
//   });
  

// rl.on('close', () => {
//     process.exit(0);
// })