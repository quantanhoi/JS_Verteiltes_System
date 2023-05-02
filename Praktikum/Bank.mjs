'use strict';
import dgram from 'dgram';
import express from 'express';
import cors from 'cors';
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
            const responseBuffer = Buffer.from(`Received from Boerse: ${rinfo.address}, on port ${rinfo.port} ${parsedData.wertpapier.kurzel}, ${parsedData.count}`);
            server.send(responseBuffer, rinfo.port, rinfo.address, (err) => {
                if (err) {
                    console.log('Error sending response:', err);
                } else {
                    console.log("sent message to client");
                }
            });
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

export function startHttpServer(bank) {
    const app = express();
    const port = 8080;
    app.use(express.json());
    // Add CORS middleware (cross-origin resource sharing)
    app.use(cors());
    app.get('/bank/portfolio', (req, res) => {
        res.json({ portfolio: bank.calculatePortfolio() });
    });
    app.post('/bank/addWertPapier', (req, res) => {
        const { kurzel, count } = req.body;
        const wertpapier = new Wertpapier(kurzel, 0);
        bank.addWertPapier(wertpapier, count);
        bank.calculatePortfolio();
        res.status(200).send('Added WertPapier');
    });
    app.listen(port, () => {
        console.log(`Bank HTTP server listening on port ${port}`);
    });
}


export const firstBank = new Bank('firstBank', 3000);


