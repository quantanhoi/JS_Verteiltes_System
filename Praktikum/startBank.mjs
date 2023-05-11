'use strict';
import {Bank, firstBank, startHttpServer} from './Bank.mjs';
import { Wertpapier, MSFT, LSFT } from './Wertpapier.mjs';
firstBank.addWertPapier(MSFT, 100);
firstBank.addWertPapier(LSFT, 50);
console.log(firstBank.wertpapiers);
console.log(firstBank.calculatePortfolio());
firstBank.startServer();
startHttpServer(firstBank);‚