[![Quality Status](https://sonarcloud.io/api/project_badges/measure?project=de.hda.fbi.ds.mbredel:socket-client&metric=alert_status)](https://sonarcloud.io/dashboard?id=de.hda.fbi.ds.mbredel%3Asocket-client)

# A UDP Socket Server

A quite simple sever application that listens to a UDP socket and prints out received messages.


## Compile and Run using Docker

All you need to do is to run the following Docker Commands:

```
docker build -f ./docker/Dockerfile -t udp-socket-server ./sources
docker run --name udp-socket-server --net=host -h udp-socket-server udp-socket-server
```

One way to stop and remove this Container is to run the following Docker Command:

```
docker stop udp-socket-server && docker rm udp-socket-server 
```

## Compile and Run using Maven

### Compile

The application is written in Java leveraging the Maven build tool. Thus, it is quite easy to compile the application. All you need is a Java 8 JDK and Maven installed on your system. You can then build the whole system by typing

```
 $ mvn clean package
```

in the ./sources/ directory.

### Usage

Once the system is build, you may start the server by using the bash script, which is located at ./source/src/main/bash/:

```
 $ ./socket-server.sh
```

The server runs forever. You may terminate the server by pressing Ctrl + x. For more details call

```
 $ ./socket-server.sh --help
```