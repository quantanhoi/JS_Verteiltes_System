# Verteiltes System Praktikum + Code Beispiele

## Installation
For the Praktikum

first change the directory into Praktikum folder
```
cd Praktikum/
```
Whenever you want to run docker file, you have to change this.ipAdress of Bank to a name you want
However I only make docker file to test the 1. Praktikum (Boerse to Bank), For 2. to connect to the web I just test it with bank running in terminal (with ip.Address = 'localhost')
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
