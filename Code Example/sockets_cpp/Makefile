CC = g++
CFLAGS = -Wall -Werror -pedantic -std=c++11

all: EchoServer EchoClient EchoServerTCP EchoClientTCP_correct EchoClientTCP

EchoServer: EchoServer.cpp
	$(CC) $(CFLAGS) -o $@ $^

EchoClient: EchoClient.cpp
	$(CC) $(CFLAGS) EchoClient.cpp -o EchoClient

EchoServerTCP: EchoServerTCP.cpp
	$(CC) $(CFLAGS) -o $@ $^

EchoClientTCP: EchoClientTCP.cpp
	$(CC) $(CFLAGS) -o $@ $^

EchoClientTCP_correct: EchoClientTCP_correct.cpp
	$(CC) $(CFLAGS) -o $@ $^

clean:
	rm -f EchoServer EchoClient EchoServerTCP EchoClientTCP_correct EchoClientTCP


