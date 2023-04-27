'use strict';
import {Bank, firstBank} from './Bank.mjs';
import { Wertpapier, MSFT, LSFT } from './Wertpapier.mjs';
firstBank.addWertPapier(MSFT, 100);
console.log(firstBank.wertpapiers);
console.log(firstBank.calculatePortfolio());
firstBank.startServer();