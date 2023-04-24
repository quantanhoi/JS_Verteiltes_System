'use strict';
import net from 'net';
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
        if (this.wertpapiers.has(Wertpapier)) {
            const newCount = this.wertpapiers.get(Wertpapier) + count;
            this.wertpapiers.set(Wertpapier, newCount);
        }
        else {
            this.wertpapiers.set(Wertpapier, count);
        }
        console.log(this.wertpapiers);
    }
    startServer() {
        const server = net.createServer((socket) => {
            console.log('Boerse connected');
            socket.on('data', (data) => {
                console.log('Received data: ', data.toString());
                const parsedData = JSON.parse(data.toString());
                this.receiveData(parsedData.wertpapier, parsedData.count);
            });
            socket.on('end', () => {
                console.log('Boerse discornnected');
            });
        });
        server.listen(3000, () => {
            console.log('Bank server listening on port 3000');
        })
    }
    receiveData(Wertpapier, count) {
        this.addWertPapier(Wertpapier, count);
        console.log(`Received data from Boerse: ${Wertpapier.kurzel}, count: ${count}`);
        console.log(this.calculatePortfolio());
    }
}


export const firstBank = new Bank('firstBank', 3000);


