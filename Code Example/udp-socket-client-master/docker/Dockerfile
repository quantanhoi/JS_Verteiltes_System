
##
## Build stage
##

FROM maven:3.8.6-openjdk-11-slim AS build
LABEL maintainer = michael.vonrueden@h-da.de
LABEL stage = build

RUN mkdir -p /app
WORKDIR /app
COPY pom.xml /app/
RUN mvn dependency:go-offline
COPY . /app/
RUN mvn package


##
## Run stage
##
FROM openjdk:11.0-jre-slim
LABEL maintainer = michael.vonrueden@h-da.de

RUN mkdir -p /app
COPY --from=build /app/target/socket-client-1.0-SNAPSHOT.jar /app
CMD [ "/bin/bash", "-c", "while true; do java -jar /app/socket-client-1.0-SNAPSHOT.jar; sleep 2; done" ]
