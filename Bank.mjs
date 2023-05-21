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
import http from 'http';



export class Bank {
    constructor(name, port) {
        this.name = name;
        this.portfolio = 0;
        this.wertpapiers = new Map();
        this.gain = 0;
        this.port = port;
        this.ipAddress = 'localhost';
        this.count = 0;
    }




    calculatePortfolio() {
        console.log("Wertpapier price " + MSFT.kurzel + " " + MSFT.preis);
        var gesamtPort = 0;
        for (const [Wertpapier, count] of this.wertpapiers) {
            const sumWert = Wertpapier.preis * count;
            gesamtPort += sumWert;
        }
        this.portfolio = gesamtPort;
        return this.portfolio
    }


    addWertPapier(Wertpapier, count, preis) {
        let exists = false;
        for (const [existingWertpapier, existingCount] of this.wertpapiers.entries()) {
            if (existingWertpapier.kurzel === Wertpapier.kurzel) {
                this.updateWertpapierPreis(existingWertpapier.kurzel, preis);
                const newCount = existingCount + count;
                this.wertpapiers.set(existingWertpapier, newCount);
                exists = true;
                console.log(this.wertpapiers);
                console.log(this.calculatePortfolio());
                break;
            }
        }
        if (!exists) {
            this.wertpapiers.set(Wertpapier, count);
        }
    }

    updateWertpapierPreis(kurzel, preis) {
        for (const [existingWertpapier, existingCount] of this.wertpapiers.entries()) {
            if (existingWertpapier.kurzel === kurzel) {
                // console.log("dsaddsadad" + existingWertpapier.kurzel);
                existingWertpapier.updatePrice(preis);
            }
        }
    }


    startServer() {
        //create a new udp socket (udp4 = ipv4)
        const server = dgram.createSocket('udp4');
        //event listener for message , emit when a new datagram is available on socket
        //msg: buffer containing the incoming message 
        //rinfo: containing sender's address, port, size of datagram
        server.on('message', (msg, rinfo) => {
            // console.log(`Received data: ${msg.toString()}`);
            const parsedData = JSON.parse(msg.toString());
            this.receiveData(parsedData.wertpapier, parsedData.count, parsedData.preis);
            const responseBuffer = Buffer.from(`Received from Boerse 1234: ${rinfo.address}, on port ${rinfo.port} ${parsedData.wertpapier.kurzel}, ${parsedData.count}`);
            //send a reponse back to client
            server.send(responseBuffer, rinfo.port, rinfo.address, (err) => {
                if (err) {
                    console.log('Error sending response:', err);
                } else {
                    console.log("sent message to client");
                }
            });
        });
        //emit when the server is on (bound to an address and port, ready for listening)
        server.on('listening', () => {
            const address = server.address();
            console.log(`Bank server listening on ${address.address}:${address.port}`);
        });
        //server start listening for incoming data gram ipAddress:port
        server.bind(3000, this.ipAddress);
    }




    receiveData(Wertpapier, count, preis) {
        for (let [wertpapier, existingCount] of this.wertpapiers) {
            if (Wertpapier.kurzel === wertpapier.kurzel) {
                this.addWertPapier(Wertpapier, count, preis);
            }
        }
        console.log(`Received data from Boerse: ${Wertpapier.kurzel}, count: ${count}`);
        console.log(this.calculatePortfolio());
    }





    //aufgabe 2
    startHttpServer() {
        const server = net.createServer((socket) => {
            let requestData = '';
            socket.on('data', (data) => {
                requestData += data.toString();
                console.log(`requested ${this.count}: ` + requestData);
                this.count++;
                // Check if the end of the headers has been reached
                const headerEndIndex = requestData.indexOf('\r\n\r\n');
                if (headerEndIndex !== -1) {
                    // Get the headers
                    const headers = requestData.substring(0, headerEndIndex).split('\r\n');
                    // Get the request line
                    const [method, path] = headers[0].split(' ');
                    // Get the Content-Length header
                    const contentLength = headers.find(header => header.startsWith('Content-Length: '));
                    if (contentLength) {
                        const length = parseInt(contentLength.split(': ')[1]);
                        // Check if all of the body has been received
                        const body = requestData.substring(headerEndIndex + 4);
                        if (body.length >= length) {
                            // All of the body has been received, handle the request
                            console.log(`method ${this.count -1 }: ` + method);
                            if (method === 'OPTIONS') {
                                this.handleOptionsRequest(socket);
                                requestData = '';
                            }
                            // handle other methods...
                            else if (method === 'GET') {
                                this.handleGetRequest(socket, path, requestData);
                                requestData = '';
                            } else if (method === 'POST') {
                                this.handlePostRequest(socket, path, requestData);
                                requestData = '';
                            } else {
                                this.sendInvalidMethodResponse(socket);
                                requestData = '';
                            }
                        }
                    }
                    //if content-length = 0
                    else {
                        if(method === 'GET') {
                            this.handleGetRequest(socket, path, requestData);
                            requestData = '';
                        }
                    }
                }
            });
            socket.on('error', function (err) {
                if (err.code === 'EPIPE') {
                    console.log('Client closed connection');
                }
                else {
                    console.error('Socket error', err);
                }
                socket.destroy();
            });
        });
        server.listen(8080, () => {
            console.log('HTTP server listening on port 8080');
        });
    }

    handleGetRequest(socket, path) {
        console.log("handling get request");
        if (path === '/bank/portfolio') {
            const portfolio = this.calculatePortfolio();
            this.sendJsonResponse(socket, portfolio);
        } else if (path.startsWith('/bank/wertpapier/')) {
            const kurzel = path.substring('/bank/wertpapier/'.length);
            const wertpapier = this.getWertpapierByKurzel(kurzel);
            if (wertpapier) {
                this.sendJsonResponse(socket, { wertpapier });
            } else {
                this.sendJsonResponse(socket, { success: false, message: 'Invalid Wertpapier Kurzel' });
            }
        } else {
            this.sendInvalidPathResponse(socket);
        }
    }

    // Method for handling Option requests
    handleOptionsRequest(socket) {
        const response = [
            'HTTP/1.1 200 OK',
            'Access-Control-Allow-Origin: *',
            'Access-Control-Allow-Methods: GET, POST, OPTIONS',
            'Access-Control-Allow-Headers: Content-Type',
            'Content-Length: 0',
            '\r\n'
        ].join('\r\n');
        console.log("socket write option");
        socket.write(response);
    }



    getWertpapierByKurzel(kurzel) {
        if (kurzel === 'MSFT') {
            return MSFT;
        } else if (kurzel === 'LSFT') {
            return LSFT;
        } else {
            return null;
        }
    }


    // Method for Handling Post requests
    handlePostRequest(socket, path, requestData) {
        console.log("handling post request");
        // console.log("request: " + requestData)
        if (requestData === null) {
            console.error("requestData is null");
            return;
        }
        const [requestLine, ...headerLines] = requestData.split('\r\n');
        // Parse headers
        const headers = headerLines.reduce((acc, line) => {
            const [key, value] = line.split(': ');
            acc[key] = value;
            return acc;
        }, {});
        // Read request body based on Content-Length
        const contentLength = parseInt(headers['Content-Length'], 10);
        const requestBody = requestData.split('\r\n\r\n')[1];
        try {
            JSON.parse(requestBody);
        } catch (e) {
            console.error('Invalid JSON:', requestBody);
            console.log("asddasdsdasda");
            this.sendInvalidPathResponse(socket);
            return;
        }
        // Check if there's extra data and remove it
        const jsonStartIndex = requestBody.indexOf('{');
        if (jsonStartIndex > 0) {
            requestBody = requestBody.substring(jsonStartIndex);
        }
        console.log('request body: ' + requestBody);
        if (requestBody.length >= contentLength) {
            // Parse JSON data
            const jsonData = JSON.parse(requestBody);
            console.log(jsonData);
            // Process JSON data based on the request path
            if (path === '/bank/addWertPapier') {
                const { kurzel, count } = jsonData;
                console.log("kurzel" + kurzel);
                const wertpapier = this.getWertpapierByKurzel(kurzel);
                if (wertpapier) {
                    console.log("adding wertpapier...");
                    console.log(wertpapier.kurzel + " " + wertpapier.preis + " " + count);
                    this.addWertPapier(wertpapier, count, wertpapier.preis);
                    this.sendJsonResponse(socket, { success: true });
                } else {
                    this.sendJsonResponse(socket, { success: false, message: 'Invalid Wertpapier Kurzel' });
                }
            } else {
                this.sendInvalidPathResponse(socket);
            }
        }
        console.log('ok post request');
    }



    sendJsonResponse(socket, data) {
        const jsonResponse = JSON.stringify(data);
        const response = [
            'HTTP/1.1 200 OK', 
            'Content-Type: application/json',
            'Access-Control-Allow-Origin: *',  
            'Access-Control-Allow-Methods: GET, POST, OPTIONS',  
            'Access-Control-Allow-Headers: Content-Type',  
            'Content-Length: ' + Buffer.byteLength(jsonResponse),
            '', // blank line required by HTTP protocol
            jsonResponse
        ].join('\r\n');
        console.log("socket write sendJsonResponse");
        socket.write(response);
        console.log('ok send json request');
    }


    sendInvalidMethodResponse(socket) {
        const response = 'HTTP/1.1 error 405 method not allowed \r\nContent: 0\r\n\r\n';
        console.log("socket write sendInvalidMethodResponse");
        socket.write(response, () => {
            socket.end();
        });
    }
    sendResponse(socket, statusCode, headers = {}, body = '') {
        headers = {
            ...headers,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        };
        const statusLine = `HTTP/1.1 ${statusCode} ${http.STATUS_CODES[statusCode]}`;
        const headerLines = Object.entries(headers).map(([key, value]) => `${key}: ${value}`);
        const response = [statusLine, ...headerLines, '', body].join('\r\n');
        console.log("socket write SendResponse");
        socket.write(response, 'utf-8', () => {
            socket.end();
        });
    }

    sendInvalidPathResponse(socket) {
        const response = 'HTTP/1.1 404 Not Found\r\n' +
            'Content-Type: application/json\r\n' +
            'Access-Control-Allow-Origin: *\r\n' +
            '\r\n' +
            JSON.stringify({ error: 'Invalid path' }) + '\r\n';
        console.log("socket write sendInvalidPathResponse");
        socket.write(response, 'utf-8', () => {
            socket.end();
        });
    }



}




//HTTP server code guideline, do not use
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
export const secondBank = new Bank('secondBank', 4000);


