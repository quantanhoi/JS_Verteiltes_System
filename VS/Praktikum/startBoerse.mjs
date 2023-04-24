import {Bank, firstBank} from './Bank.mjs';
import { Boerse, b1 } from './Boerse.mjs';
import { Wertpapier, MSFT, LSFT } from './Wertpapier.mjs';
b1.addWerpapier(MSFT, 100);
console.log(b1.wertpapiers);
b1.connectToBank(firstBank);
b1.sendData(MSFT, 50);