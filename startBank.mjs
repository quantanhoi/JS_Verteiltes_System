'use strict';
import {Bank, firstBank} from './Bank.mjs';
import { Wertpapier, MSFT, LSFT } from './Wertpapier.mjs';
import BankClient from './BankClient.mjs';
const secondBankClient = new BankClient('localhost', 50052)
firstBank.addWertPapier(MSFT, 100);
firstBank.addWertPapier(LSFT, 50);
console.log(firstBank.wertpapiers);
console.log(firstBank.calculatePortfolio());
firstBank.startServer();
firstBank.startHttpServer();
firstBank.startGrpcServer();
secondBankClient.calculatePortfolio()
    .then((response) => {
        console.log('Portfolio of secondBank:', response.portfolio);
    })
    .catch((error) => {
        console.error('Error in calculatePortfolio:', error);
    });