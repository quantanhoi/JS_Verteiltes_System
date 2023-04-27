#include <iostream>
#include <cstring>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>

const int BUFFER_SIZE = 1024;

int main(int argc, char *argv[]) {
    if (argc < 3) {
        std::cerr << "Usage: " << argv[0] << " <host> <port>" << std::endl;
        return 1;
    }

    std::string host = argv[1];
    int port = std::stoi(argv[2]);

    // Create socket
    int client_fd;
    if ((client_fd = socket(AF_INET, SOCK_STREAM, 0)) == 0) {
        std::cerr << "Could not create socket" << std::endl;
        return 1;
    }

    // Set server address
    struct sockaddr_in server_address;
    std::memset(&server_address, 0, sizeof(server_address));
    server_address.sin_family = AF_INET;
    server_address.sin_port = htons(port);

    if (inet_pton(AF_INET, host.c_str(), &server_address.sin_addr) <= 0) {
        std::cerr << "Invalid address or address not supported" << std::endl;
        return 1;
    }

    // Connect to server
    if (connect(client_fd, (struct sockaddr *)&server_address, sizeof(server_address)) < 0) {
        std::cerr << "Connect failed" << std::endl;
        return 1;
    }

    std::cout << "Connected to server " << host << ":" << port << std::endl;

    // Send and receive messages
    std::string message;

    while (true) {
        std::cout << "Enter message: ";
        std::getline(std::cin, message);

        if (message.empty()) {
            break;
        }

        if (send(client_fd, message.c_str(), message.length(), 0) < 0) {
            std::cerr << "Error sending message to server" << std::endl;
            break;
        }

        char buffer[BUFFER_SIZE];
        std::memset(buffer, 0, BUFFER_SIZE);

        int total_bytes_received = 0;
        int bytes_received;

        while ((bytes_received = recv(client_fd, buffer + total_bytes_received, BUFFER_SIZE - total_bytes_received, 0)) > 0) {
            total_bytes_received += bytes_received;

            // Check if message is complete
            if (buffer[total_bytes_received - 1] == '\n') {
                break;
            }
        }

        if (bytes_received < 0) {
            std::cerr << "Error receiving message from server" << std::endl;
            break;
        }

        if (total_bytes_received == 0) {
            std::cout << "Server disconnected" << std::endl;
            break;
        }

        std::cout << "Received message from server: " << buffer << std::endl;
    }

    close(client_fd);

    return 0;
}
