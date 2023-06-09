[![Quality Status](https://sonarcloud.io/api/project_badges/measure?project=de.hda.fbi.ds.mbredel:socket-client&metric=alert_status)](https://sonarcloud.io/dashboard?id=de.hda.fbi.ds.mbredel%3Asocket-client)

# A UDP Socket Client 

A quite simple client application that sends a _Hello World_ message to a UDP Socket Server.


## Compile and Run using Docker

All you need to do is to run the following Docker Commands:

```
docker build -f ./docker/Dockerfile -t udp-socket-client ./sources
docker run --name udp-socket-client --net=host udp-socket-client
```

One way to stop and remove this Container is to run the following Docker Command:

```
docker stop udp-socket-client && docker rm udp-socket-client 
```

## Compile and Run using Maven

### Compile

The application is written in Java leveraging the Maven build tool. Thus, it is quite easy to compile the application. All you need is a Java 8 JDK and Maven installed on your system. You can then build the whole system by typing

```
 $ mvn clean package
```

in the ./sources/ directory.

### Usage

Once the system is build, you may start the client by using the bash script:

```
 $ ./socket-client.sh
```

The client just sends a single message to a local UDP Socket Server and terminates. For more details call

```
 $ ./socket-client.sh --help
```
