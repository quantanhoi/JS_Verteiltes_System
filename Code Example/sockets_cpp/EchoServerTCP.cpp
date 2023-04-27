#include <iostream>
#include <cstring>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>

const int BUFFER_SIZE = 1024;

int main(int argc, char *argv[]) {
    if (argc < 2) {
        std::cerr << "Usage: " << argv[0] << " <port>" << std::endl;
        return 1;
    }

    int port = std::stoi(argv[1]);

    // Create socket
    int server_fd;
    if ((server_fd = socket(AF_INET, SOCK_STREAM, 0)) == 0) {
        std::cerr << "Could not create socket" << std::endl;
        return 1;
    }

    // Set server address
    struct sockaddr_in server_address;
    std::memset(&server_address, 0, sizeof(server_address));
    server_address.sin_family = AF_INET;
    server_address.sin_addr.s_addr = INADDR_ANY;
    server_address.sin_port = htons(port);

    // Bind socket to address and port
    if (bind(server_fd, (struct sockaddr *)&server_address, sizeof(server_address)) < 0) {
        std::cerr << "Bind failed" << std::endl;
        return 1;
    }

    // Listen for incoming connections
    if (listen(server_fd, 1) < 0) {
        std::cerr << "Listen failed" << std::endl;
        return 1;
    }

    std::cout << "Server listening on port " << port << std::endl;

    // Accept incoming connection
    int client_fd;
    struct sockaddr_in client_address;
    socklen_t client_address_length = sizeof(client_address);

    if ((client_fd = accept(server_fd, (struct sockaddr *)&client_address, &client_address_length)) < 0) {
        std::cerr << "Accept failed" << std::endl;
        return 1;
    }

    std::cout << "Accepted connection from " << inet_ntoa(client_address.sin_addr) << ":" << ntohs(client_address.sin_port) << std::endl;

    // Receive and send back message
    char buffer[BUFFER_SIZE];

    while (true) {
        std::memset(buffer, 0, BUFFER_SIZE);

        int bytes_received = recv(client_fd, buffer, BUFFER_SIZE, 0);

        if (bytes_received < 0) {
            std::cerr << "Error receiving message from client" << std::endl;
            break;
        }

        if (bytes_received == 0) {
            std::cout << "Client disconnected" << std::endl;
            break;
        }

        std::cout << "Received message from client: " << buffer << " with " << bytes_received << " bytes" << std::endl;

        int bytes_sent = send(client_fd, buffer, bytes_received, 0);

        if (bytes_sent < 0) {
            std::cerr << "Error sending message to client" << std::endl;
            break;
        }
    }

    close(client_fd);
    close(server_fd);

    return 0;
}
