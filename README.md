# Verteiltes System Praktikum + Code Beispiele
This is solution for Distributed System Praktikum which contains implementation of pure udp, building http with pure tcp, remote procedure calls (gRPC) and MQTT for Message oriented middleware (using hiveMQ as broker)   

Praktikumsaufgaben: [Verteiltes System Praktikum](vs_praktikum.pdf)

## Installation
For the Praktikum

To install grpc package for Aufgabe 3 + mqtt for Aufgabe 4
```
npm install @grpc/grpc-js
npm install grpc-tools
npm install mqtt --save
```
Generate client and server stub for grpc (here I'm using macOS)
```
grpc_tools_node_protoc --js_out=import_style=commonjs,binary:./output --grpc_out=./output --plugin=protoc-gen-grpc=`which grpc_tools_node_protoc_plugin` bankService.proto 
```

Build Docker for Banks
```
docker build -t startbank -f Dockerfile.startBank . 
docker build -t secondbank -f Dockerfile.startSecondBank .
docker build -t thirdbank -f Dockerfile.startThirdBank .
```


Run Docker File startbank for first bank and secondbank for second bank
```
# Create a new network for Grpc Simulation
docker network create mynetwork
# Run containers on the new network
docker run -d -p 8080:8080 -p 50051:50051 --name startbank --network=mynetwork startbank
docker run -d -p 8081:8080 -p 50053:50051 --name secondbank --network=mynetwork secondbank
docker run -d -p 8082:8080 -p 50055:50051 --name thirdbank --network=mynetwork thirdbank
```

Build Docker startBoerse 
```
docker build -t startboerse -f Dockerfile.startBoerse .
```
Run Docker File StartBoerse
```
docker run --name startboerse --network=mynetwork startboerse
```

Then all you need is to run index.html for the UI


