'use strict';
import dgram from 'dgram';
import { Wertpapier, MSFT, LSFT } from './Wertpapier.mjs';
import { Socket } from 'dgram';
export class Bank {
    constructor(name, port) {
        this.name = name;
        this.portfolio = 0;
        this.wertpapiers = new Map();
        this.gain = 0;
        this.port = port;
        this.ipAddress = 'localhost';
    }
    calculatePortfolio() {
        var gesamtPort = 0;
        for (const [Wertpapier, count] of this.wertpapiers) {
            const sumWert = Wertpapier.preis * count;
            gesamtPort += sumWert;
        }
        this.portfolio = gesamtPort;
        return this.portfolio
    }
    addWertPapier(Wertpapier, count) {
        let exists = false;
        for (const [existingWertpapier, existingCount] of this.wertpapiers.entries()) {
            if (existingWertpapier.kurzel === Wertpapier.kurzel) {
                const newCount = existingCount + count;
                this.wertpapiers.set(existingWertpapier, newCount);
                exists = true;
                break;
            }
        }
        if (!exists) {
            this.wertpapiers.set(Wertpapier, count);
        }
        console.log(this.wertpapiers);
    }
    startServer() {
        const server = dgram.createSocket('udp4');
        server.on('message', (msg, rinfo) => {
            console.log(`Received data: ${msg.toString()}`);
            const parsedData = JSON.parse(msg.toString());
            this.receiveData(parsedData.wertpapier, parsedData.count);
        });

        server.on('listening', () => {
            const address = server.address();
            console.log(`Bank server listening on ${address.address}:${address.port}`);
        });

        server.bind(3000);
    }
    receiveData(Wertpapier, count) {
        this.addWertPapier(Wertpapier, count);
        console.log(`Received data from Boerse: ${Wertpapier.kurzel}, count: ${count}`);
        console.log(this.calculatePortfolio());
    }
}


export const firstBank = new Bank('firstBank', 3000);


