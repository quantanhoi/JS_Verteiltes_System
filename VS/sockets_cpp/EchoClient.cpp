#include <iostream>
#include <cstring>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

const int BUFFER_SIZE = 1024;

int main(int argc, char *argv[]) {
    if (argc < 3) {
        std::cerr << "Usage: " << argv[0] << " <server IP address> <port>" << std::endl;
        return 1;
    }

    char *server_ip_address = argv[1];
    int port = std::stoi(argv[2]);

    // Create socket 
    int client_fd;
    if ((client_fd = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP)) == 0) {
        std::cerr << "Could not create socket" << std::endl;
        return 1;
    }

    // Set server address
    struct sockaddr_in server_address;
    std::memset(&server_address, 0, sizeof(server_address));
    server_address.sin_family = AF_INET;
    server_address.sin_port = htons(port);
    if (inet_pton(AF_INET, server_ip_address, &server_address.sin_addr) <= 0) {
        std::cerr << "Invalid server IP address" << std::endl;
        return 1;
    }

    // Send message to server
    std::string message;
    std::cout << "Enter message to send: ";
    std::getline(std::cin, message);

    int bytes_sent = sendto(client_fd, message.c_str(), message.length(), 0, (struct sockaddr *)&server_address, sizeof(server_address));

    if (bytes_sent < 0) {
        std::cerr << "Error sending message to server" << std::endl;
        return 1;
    }

    std::cout << "Sent message to server: " << message << std::endl;

    // Receive message from server
    char buffer[BUFFER_SIZE];
    struct sockaddr_in server_response_address;
    socklen_t server_response_address_length = sizeof(server_response_address);

    int bytes_received = recvfrom(client_fd, buffer, BUFFER_SIZE, 0, (struct sockaddr *)&server_response_address, &server_response_address_length);

    if (bytes_received < 0) {
        std::cerr << "Error receiving message from server" << std::endl;
        return 1;
    }

    std::cout << "Received message from server: " << buffer << std::endl;

    return 0;
}
