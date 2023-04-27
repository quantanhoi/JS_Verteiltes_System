# Verteiltes System Praktikum + Code Beispiele

## Installation
For the Praktikum
first change the directory into Praktikum folder
```
cd Praktikum/
```
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
