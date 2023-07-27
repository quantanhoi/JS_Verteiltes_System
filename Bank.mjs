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
import http, { request } from 'http';

//import for grpc
import grpc from '@grpc/grpc-js';
import pkg from '@grpc/proto-loader';
import { emitWarning } from 'process';

//import for mqtt aufgabe 4
import mqtt from 'mqtt';

const { loadSync, protoLoader } = pkg;




const PROTO_PATH = 'bankService.proto';

const packageDefinition = pkg.loadSync(
    PROTO_PATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    }
);

const bank_proto = grpc.loadPackageDefinition(packageDefinition).BankService;

export class Bank {
    constructor(name, port, httpPort, rpcServerPort, rpcClientPort) {
        this.name = name;
        this.portfolio = 0;
        this.wertpapiers = new Map();
        this.gain = 0;
        this.port = port;
        this.httpPort = httpPort;
        this.ipAddress = 'startbank';
        this.count = 0;

        //mqtt topic to subscribe
        this.topic = '771043_verteiltes_system_aufgabe4_bank_broker';

        this.needHelp = false;


        //creating grpc server and client 

        //Server port for incoming data
        this.rpcServerPort = rpcServerPort;

        //client port for outgoing data
        this.rpcClientPort = rpcClientPort;
        this.server = new grpc.Server();

        //Service set for the bank
        this.server.addService(bank_proto.service, {
            requestLoan: this.requestLoan.bind(this), //binding bank object to requestLoan function, so that we can use class method later
            transferFunds: this.transferFunds.bind(this)
        });
        
        //list of client to send grpc request
        this.clients = new Map();
        this.loanList = new Map();
    }


    //aufgabe 4 mqtt
    startMQTTClient() {
        this.mqttClient = mqtt.connect('mqtt://broker.hivemq.com'); //Using public broker URL

        this.mqttClient.on('error', (err) => {
            console.log('MQTT Error:', err);
        });

        this.mqttClient.on('connect', () => {
            console.log('Connected to MQTT Broker');
            this.mqttClient.subscribe(this.topic, (err) => {
                if (err) {
                    console.log('Failed to subscribe:', err);
                } else {
                    console.log('Subscribed to topic');
                }
            });
        });

        this.mqttClient.on('message', (topic, messageBuffer) => {
            // Parse the received message
            let messageObject;
            try {
                const messageString = messageBuffer.toString();
                messageObject = JSON.parse(messageString);
            } catch(err) {
                console.log('Failed to parse message:', err);
                return;
            }
            
            console.log("Received message from ", messageObject.sender, ": ", messageObject.type);

            // Ignore message if it's from this bank
            if (messageObject.sender === this.name) {
                console.log("Bank Name: ", messageObject.sender);
                console.log('Ignoring own message');
                this.endMqttTime = new Date();
                console.log('MQTT Round Trip Time: ', this.calculateRTT(this.startMqttTime, this.endMqttTime));
                return;
            }

            // Handle the message based on its type
            switch (messageObject.type) {
                case 'requestHelp':
                    console.log(messageObject.sender, ' is requesting help from other Banks');
                    this.vote(messageObject.sender);
                    break;
                case 'vote':
                    console.log(messageObject.sender, ' has voted for ', messageObject.requester);
                    this.collectVote(messageObject.sender, messageObject.vote, messageObject.requester);
                    break;
                default:
                    console.log('Unknown message type: ', messageObject.type);
            }
        });
    }

    calculateRTT(startTime, endTime) {
        return endTime - startTime;
    }
    sendMqttMessage(topic = this.topic, messageObject) {
        this.startMqttTime = new Date();
        const messageString = JSON.stringify(messageObject);
        this.mqttClient.publish(topic, messageString);
    }
    
    requestHelp() {
        console.log(this.name, ' is requesting help from other Banks');
        this.needHelp = true;
        this.votes = new Map();  // To collect the votes
        this.sendMqttMessage(this.topic, {
            type: 'requestHelp',
            sender: this.name
        });
    }
    
    vote(requestingBank) {
        const vote = this.calculatePortfolio() > 30000; // Decide the vote based on some condition
        this.sendMqttMessage(this.topic, {
            type: 'vote',
            sender: this.name,
            requester: requestingBank,
            vote
        });
    }
    
    collectVote(votingBank, vote, requestingBank) {
        console.log(votingBank, ' has voted ', vote,' for ', requestingBank);
        if (!this.needHelp && requestingBank !== this.name) {
            return;
        }
        this.votes.set(votingBank, vote);
        // Check if all votes are collected
        if (this.votes.size === this.clients.size) {
            console.log('All votes collected');
            if (Array.from(this.votes.values()).every(v => v)) {
                this.commitHelp();
            } else {
                this.abortHelp();
            }
        }
    }



    commitHelp() {
        console.log('All banks agreed to help, commit the transaction');
        const request = {
            borrowing_bank: this.name,
            requestedWertpapier: {
                kurzel: 'MSFT',
                preis: 300
            },
            amount: 10
        };
        this.clients.forEach((client, targetBankName) => {
            // Update the lending_bank field for each client
            request.lending_bank = targetBankName;
            this.makeLoanRequest(request, targetBankName);
        });
        this.needHelp = false;
    }



    abortHelp() {
        console.log('Some banks disagreed to help, abort the transaction');
        this.needHelp = false;
    }



    startGRPC() {
        this.server.bindAsync(`0.0.0.0:${this.rpcServerPort}`, grpc.ServerCredentials.createInsecure(), () => {
            this.server.start();
            console.log(`Server running on 0.0.0.0:${this.rpcServerPort}`);
        });
    }


    //adding client (other banks) for grpc server
    addClient(targetBankName, targetBankServerPort) {
        const client = new bank_proto(
            `${targetBankName}:${targetBankServerPort}`, 
            grpc.credentials.createInsecure()
        );
        this.clients.set(targetBankName, client);
    }
    


    requestLoan(call, callback) {
        // handle loan request here
        let request = call.request;
        let lendingBank = request.lending_bank;
        let borrowingBank = request.borrowing_bank;
        let wertpapier = request.requestedWertpapier;
        let amount = request.amount;
        console.log("lending Bank: ", lendingBank);
        console.log("Borrowing Bank",borrowingBank);
        console.log("Kurzel: ", wertpapier.kurzel);
        console.log("Amount: ", amount);
        let message;
        let approved;
        let requestWertpapier = this.getWertpapierByKurzel(wertpapier.kurzel);
        if(this.loanWertpapier(borrowingBank, requestWertpapier, amount)) {
            approved = true;
            message = "Request approved";
        }
        else {
            approved = false;
            message = "Request denied";
        }
        console.log(this.calculatePortfolio());
        
        callback(null, {approved, message}); //response from server
    }

    transferFunds(call, callback) {
        let request = call.request;
        let source_bank = request.source_bank;
        let target_bank = request.target_bank;
        let wertpapier = request.requestedWertpapier;
        let amount = request.amount;
    
        console.log("Source Bank: ", source_bank);
        console.log("Target Bank", target_bank);
        console.log("Kurzel: ", wertpapier.kurzel);
        console.log("Amount: ", amount);
        let message = "denied";
        let success = false;
        let requestWertpapier = this.getWertpapierByKurzel(wertpapier.kurzel);
        if(this.addWertPapier(requestWertpapier, amount, requestWertpapier.preis)) {
            success = true;
            message = "Transfer succeeded";
        }
        else {
            success = false;
            message = "Transfer failed";
        }
        console.log(this.calculatePortfolio());
        
        callback(null, {success, message}); //response from server
    }



    makeTransferRequest(request, targetBankName) {
        let client = this.clients.get(targetBankName);
        if (!client) {
            console.log(`No client found for bank: ${targetBankName}`);
            return;
        }
        let startTime = new Date();
        client.transferFunds(request, (function(err, response) {
            let endTime = new Date();
            let roundTripTime = endTime - startTime;
            console.log("Round trip time transfer: ", roundTripTime, ' ms');
            if (err) {
                console.log('Error:', err);
            } else {
                if(response.success) {
                    const requestWertpapier = this.getWertpapierByKurzel(request.requestedWertpapier.kurzel);
                    const amount = request.amount;
                    console.log('Transfer approved: ' ,response.message);
                    console.log("Wertpapier: " , requestWertpapier);
                    console.log("Amount: ", amount);
                    this.addWertPapier(requestWertpapier, -amount, requestWertpapier.preis);
                } else {
                    console.log('Transfer denied: ', response.message);
                    console.log(this.calculatePortfolio());
                }
            }
        }).bind(this)); // bind this to the callback function
    }

    makeLoanRequest(request, targetBankName) {
        let client = this.clients.get(targetBankName);
        if (!client) {
            console.log(`No client found for bank: ${targetBankName}`);
            return;
        }
        //start time and end time for calculation of round trip time
        let startTime = new Date();
        client.requestLoan(request, (function(err, response) {
            let endTime = new Date();
            let roundTripTime = endTime - startTime;
            console.log("Round trip time loan: ", roundTripTime, ' ms');
            if (err) {
                console.log('Error:', err);
            } else {
                if(response.approved) {
                    const requestWertpapier = this.getWertpapierByKurzel(request.requestedWertpapier.kurzel);
                    if(!requestWertpapier) {
                        console.log('Requested Wertpapier not found');
                        return;
                    }
                    const amount = request.amount;
                    const bankName = request.borrowing_bank;
                    console.log('Loan approved: ' ,response.message);
                    console.log("Wertpapier: " , requestWertpapier);
                    console.log("Amount: ", amount);
                    this.addWertPapier(requestWertpapier, amount, requestWertpapier.preis);
                } else {
                    console.log('Loan denied: ', response.message);
                    console.log(this.calculatePortfolio());
                }
            }
        }).bind(this)); // bind this to the callback function
    }


    loanWertpapier( bankName, Wertpapier, count) {
        let exists = false;
        for (const [existingWertpapier, existingCount] of this.wertpapiers.entries()) {
            if (existingWertpapier.kurzel === Wertpapier.kurzel) {
                //check if amount of wertpapier in the bank is enough
                const newCount = existingCount - count;
                if(newCount <= 0) {
                    console.log("There are not enough wertpapiers in the bank");
                    return false;
                }
                else {
                    this.wertpapiers.set(existingWertpapier, newCount);
                    exists = true;
                    // Add the loan to the loan list
                    let loanData = this.loanList.get(bankName) || [];
                    loanData.push({
                        wertpapier: existingWertpapier,
                        count: count
                    });
                    this.loanList.set(bankName, loanData);
                }
                console.log(this.wertpapiers);
                console.log(this.calculatePortfolio());
                console.log(this.loanList);
                return true;
            }
        }
        //exists variable is unnecessary here because for loop will return if there is a match
        if (!exists) {
            this.wertpapiers.set(Wertpapier, count);
        }
    }
    



    calculatePortfolio() {
        // console.log("calculatePortfolio");
        // console.log(this.name);
        console.log("Wertpapier price " + MSFT.kurzel + " " + MSFT.preis);
        var gesamtPort = 0;
        for (const [Wertpapier, count] of this.wertpapiers) {
            const sumWert = Wertpapier.preis * count;
            gesamtPort += sumWert;
        }
        this.portfolio = gesamtPort;
        return this.portfolio
    }



    //TODO: Wertpapier here is a class, which means if the if wertpapier does not exist in the map
    // then we have to be careful about the price of the wertpapier that got added to the map
    addWertPapier(Wertpapier, count, preis) {
        let exists = false;
        for (const [existingWertpapier, existingCount] of this.wertpapiers.entries()) {
            if (existingWertpapier.kurzel === Wertpapier.kurzel) {
                this.updateWertpapierPreis(existingWertpapier.kurzel, preis);
                //check if amount of wertpapier in the bank is enough
                const newCount = existingCount + count;
                if(newCount <= 0) {
                    console.log("There are not enough wertpapiers in the bank");
                    return false;
                }
                else {
                    this.wertpapiers.set(existingWertpapier, newCount);
                    exists = true;
                }
                console.log(this.wertpapiers);
                console.log(this.calculatePortfolio());
                return true;
            }
        }
        if (!exists) {
            this.wertpapiers.set(Wertpapier, count);
        }
        return true;
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
            const responseBuffer = Buffer.from(`Received from Boerse: ${rinfo.address}, on port ${rinfo.port} ${parsedData.wertpapier.kurzel}, ${parsedData.count}`);
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
        server.bind(this.port);
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
                    // Get the Content-Length
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
                    //if content-length == 0
                    else {
                        if(method === 'GET') {
                            this.handleGetRequest(socket, path, requestData);
                            requestData = '';
                        }
                        else if (method === 'POST') {
                            this.handlePostRequest(socket, path, requestData);
                            requestData = '';
                        }
                        else if (method === 'OPTIONS') {
                            this.handleOptionsRequest(socket);
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
        server.listen(this.httpPort, '0.0.0.0', () => {
            console.log(`HTTP server listening on port ${this.httpPort}`);
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
        }
        else if(path === '/bank/requestHelp') {
            this.requestHelp();
            this.sendJsonResponse(socket, {success: true});
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
            }
            else if (path === '/bank/transferFunds') {
                const { source_bank, target_bank, requestedWertpapier: { kurzel }, amount } = jsonData;
                const requestedWertpapier = { kurzel: kurzel, preis: 300 };
                const wertpapier = this.getWertpapierByKurzel(requestedWertpapier.kurzel);
                console.log("targets: " + target_bank);
                console.log("source: " + source_bank);
                console.log("amount: " + amount);
                console.log("wertpapier: " + wertpapier.kurzel);
                if (wertpapier) {
                    let request = {
                        source_bank: source_bank,
                        target_bank: target_bank,
                        requestedWertpapier: {
                            kurzel: requestedWertpapier.kurzel,
                            preis: requestedWertpapier.preis
                        },
                        amount: amount
                    };
                    
                    this.makeTransferRequest(request, target_bank);
                    this.sendJsonResponse(socket, { success: true });
                } else {
                    this.sendJsonResponse(socket, { success: false, message: 'Invalid Wertpapier Kurzel' });
                }

                
            } else if (path === '/bank/requestLoan') {
                const { lending_bank, borrowing_bank, requestedWertpapier: { kurzel }, amount } = jsonData;
                const requestedWertpapier = { kurzel: kurzel, preis: 300 };
                const wertpapier = this.getWertpapierByKurzel(requestedWertpapier.kurzel);
                console.log("targets: " + borrowing_bank);
                console.log("source: " + lending_bank);
                console.log("amount: " + amount);
                console.log("wertpapier: " + wertpapier.kurzel);
                if (wertpapier) {
                    let request = {
                        lending_bank: lending_bank,
                        borrowing_bank: borrowing_bank,
                        requestedWertpapier: {
                            kurzel: requestedWertpapier.kurzel,
                            preis: requestedWertpapier.preis
                        },
                        amount: amount
                    };
                    
                    this.makeLoanRequest(request, lending_bank);
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






//end of class bank
}


export const firstBank = new Bank('firstBank', 3000, 8080, 50051, 50052);
export const secondBank = new Bank('secondBank', 4000, 8081, 50053, 50054);
export const thirdBank = new Bank('thirdBank', 5000, 8082, 50055, 50056);


