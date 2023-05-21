'use strict';
import dgram from 'dgram';
import { Wertpapier, MSFT, LSFT } from './Wertpapier.mjs';
import { Bank, firstBank } from './Bank.mjs';
import { takeCoverage } from 'v8';
export class Boerse {
    constructor(sendS) {
        this.wertpapiers = new Map();
        this.connectedBank = null;
        this.client;
        this.countSent = 0;
        this.countReceived = 0;
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
        this.client = dgram.createSocket('udp4');
        this.connectedBank = bank;
        console.log(`connected to bank ${bank.name} at ${bank.ipAddress} on port ${bank.port}`);
        this.client.on('message', (msg, rinfo) => {
            console.log(msg.toString());
        });
    }
    sendData(Wertpapier, count) {
        if (this.connectedBank) {
            if (this.addWerpapier(Wertpapier, 0 - count)) {
                const message = JSON.stringify({ wertpapier: Wertpapier, count: count, preis: Wertpapier.preis });
                this.client.send(message, 0, message.length, this.connectedBank.port, this.connectedBank.ipAddress, (err) => {
                    if (err) {
                        console.log('Error sending data:', err);
                    } else {
                        this.countSent++;
                        console.log(`sent data to Bank: ${Wertpapier.kurzel}, count: ${count}`);
                    }
                });
            } else {
                console.log('fail to send');
            }
        } else {
            console.log('No connected bank');
        }
    }
}
export const b1 = new Boerse();

