#include <iostream>
#include <string.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>

#define PORT 8080
#define BUFFER_SIZE 1024

int main() {
    int sockfd;
    struct sockaddr_in server_addr, client_addr;
    char buffer[BUFFER_SIZE];

    // create socket
    sockfd = socket(AF_INET, SOCK_DGRAM, 0);
    if (sockfd < 0) {
        std::cout << "Failed to create socket" << std::endl;
        return 1;
    }

    // prepare server address
    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(PORT);

    // bind socket to server address
    if (bind(sockfd, (struct sockaddr*) &server_addr, sizeof(server_addr)) < 0) {
        std::cout << "Failed to bind socket to address" << std::endl;
        return 1;
    }

    std::cout << "Echo server listening on port " << PORT << std::endl;

    // receive and echo messages
    while (true) {
        unsigned int client_len = sizeof(client_addr);
        int num_bytes = recvfrom(sockfd, buffer, BUFFER_SIZE, 0, (struct sockaddr*) &client_addr, &client_len);
        if (num_bytes < 0) {
            std::cout << "Failed to receive message" << std::endl;
            return 1;
        }
        std::cout << "Received message from client: " << buffer << std::endl;
        int num_sent = sendto(sockfd, buffer, num_bytes, 0, (struct sockaddr*) &client_addr, client_len);
        if (num_sent < 0) {
            std::cout << "Failed to send message" << std::endl;
            return 1;
        }
    }

    close(sockfd);
    return 0;
}
