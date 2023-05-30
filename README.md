# Verteiltes System Praktikum + Code Beispiele

## Installation
For the Praktikum

Whenever you want to run docker file, you have to change this.ipAdress of Bank to a name you want
````
export class Bank {
    constructor(name, port) {
        this.name = name;
        this.portfolio = 0;
        this.wertpapiers = new Map();
        this.gain = 0;
        this.port = port;
        this.ipAddress = 'localhost';
    }
````
change this.ipAddress from 'localhost' to 'startbank' to match with docker build below

Build Docker startBank
```
docker build -t startbank -f Dockerfile.startBank . 
```

Build Docker startBoerse 
```
docker build -t startboerse -f Dockerfile.startBoerse .
```

Build Docker File
```
docker run --name startbank -d startbank
```

Build Docker File
```
docker run --name startboerse --link startbank startboerse
```

For Praktikum 3, install gRPC for nodeJS
```
npm install @grpc/grpc-js @grpc/proto-loader
```
