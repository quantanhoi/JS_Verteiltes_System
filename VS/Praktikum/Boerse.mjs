'use strict';
import net from 'net';
import { Wertpapier, MSFT, LSFT } from './Wertpapier.mjs';
import { Bank, firstBank } from './Bank.mjs';
import { takeCoverage } from 'v8';
export class Boerse {
    constructor(sendS) {
        this.wertpapiers = new Map();
        this.connectedBank = null;
        this.client;
    }
    addWerpapier(Wertpapier, count) {
        if (count >= 0) {
            if (this.wertpapiers.has(Wertpapier)) {
                const newCount = this.wertpapiers.get(Wertpapier) + count;
                this.wertpapiers.set(Wertpapier, newCount);
            }
            else {
                this.wertpapiers.set(Wertpapier, count);
                return true;
            }
        }
        else {
            if (this.wertpapiers.has(Wertpapier)) {
                if (this.count + count < 0) {
                    console.log('not enough wertpapier');
                    return false;
                }
                else {
                    const newCount = this.wertpapiers.get(Wertpapier) + count;
                    this.wertpapiers.set(Wertpapier, newCount);
                    return true;
                }
            }
        }
    }
    connectToBank(bank) {
        this.client = new net.Socket();
        this.connectedBank = bank;
        this.client.connect(bank.port, bank.ipAddress, () => {
            console.log(`connected to bank ${bank.name} at ${bank.ipAddress} on port ${bank.port}`);
        });
        this.client.on('close', () => {
            console.log('Connection to Bank closed');
        });
    }
    sendData(Wertpapier, count) {
        if (this.connectedBank) {
            if (this.addWerpapier(Wertpapier, (0 - count))) {
                this.client.write(JSON.stringify({ wertpapier: Wertpapier, count: count }));
                console.log(`sent data to Bank: ${Wertpapier.kurzel}, count: ${count}`);
            }
            else {
                console.log('fail to send');
            }
        }
        else {
            console.log('No connected bank');
        }
    }
}
export const b1 = new Boerse();

