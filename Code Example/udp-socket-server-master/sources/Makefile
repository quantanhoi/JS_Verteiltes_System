##
## Makefile 
##
## The Makefile exists because I am old and
## crotchety and my fingers can't stop from
## running make commands. Obviously, everthing
## can be done running maven directly.
##

all: clean
	@mvn package

clean:
	@mvn clean

docker:
	@docker build -t mbredel/udp-socket-server:latest -f ../docker/Dockerfile .
	@docker image prune --filter label=stage=build --force

docker-remove:
	@docker rmi mbredel/udp-socket-server:latest -f


.PHONY: all docker docker-remove
