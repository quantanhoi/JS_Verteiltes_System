'use strict';
//dgram for UDP
import dgram from 'dgram';
//express for HTTP
import express from 'express';
import net from 'net';
//Cors for Cross-Origin ressource sharing
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




    startHttpServer() {
        const server = net.createServer((socket) => {
            let requestData = '';
            socket.on('data', (data) => {
                requestData += data.toString();
                if (requestData.endsWith('\r\n\r\n')) {
                    //get Method
                    const [requestLine, ...headerLines] = requestData;
                    const [method, path] = requestLine.split(' ');
                    //handle Get and Post requests
                    if (method === 'GET') {
                        this.handleGetRequest(socket, path);
                    }
                    else if (method === 'POST') {
                        this.handlePostRequest(socket, path);
                    }
                    else {
                        this.sendInvalidMethodResponse(socket);
                    }
                }
            });
        });
        server.listen(8080, () => {
            console.log('HTTP server listening on port 8080');
        });
    }




    handleGetRequest(socket, path) {
        const requestData = socket.read();
        const [requestLine, ...headerLines] = requestData.split('\r\n');
        //parse header:
        const headers = headerLines.reduce((acc, line) => {
            const [key, value] = line.split(': ');
            acc[key] = value;
            return acc;
        }, {});
        // Read request body based on Content-Length
        const contentLength = parseInt(headers['Content-Length'], 10);
        let requestBody = '';
        socket.on('data', (data) => {
            requestBody += data.toString();
            if (requestBody.length >= contentLength) {
                // Parse JSON data
                const jsonData = JSON.parse(requestBody);
                // Process JSON data based on the request path
                if (path === '/bank/addWertPapier') {
                    const { kurzel, count } = jsonData;
                    const wertpapier = this.getWertpapierByKurzel(kurzel);
                    if (wertpapier) {
                        this.addWertPapier(wertpapier, count);
                        this.sendJsonResponse(socket, { success: true });
                    } else {
                        this.sendJsonResponse(socket, { success: false, message: 'Invalid Wertpapier Kurzel' });
                    }
                } else {
                    this.sendInvalidPathResponse(socket);
                }
            }
        });
        //TODO:
    }


    getWertpapierByKurzel(kurzel) {
        // Add your logic to get Wertpapier by its Kurzel
        // This is just an example, you can implement it differently based on your requirements
        if (kurzel === 'MSFT') {
            return MSFT;
        } else if (kurzel === 'LSFT') {
            return LSFT;
        } else {
            return null;
        }
    }




    handlePostRequest() {
        //TODO:
    }




    sendInvalidMethodResponse(socket) {
        const response = 'HTTP/1.1 error 405 method not allowed \r\nContent: 0\r\n\r\n';
        socket.write(response, () => {
            socket.end();
        });
    }
}


//HTTP server code guideline
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


