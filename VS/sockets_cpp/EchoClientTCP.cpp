#include <iostream>
#include <cstring>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <netdb.h>

const int BUFFER_SIZE = 1024;

const char* resolveHostname(const char* hostname) {
    struct hostent *h;
    struct sockaddr_in socket_addr;
    if ((h = gethostbyname(hostname)) == NULL) {
        std::cout<<"unable to find ip of hostname"<<std::endl;
        exit(-1);
    }

    memcpy ( (char *) &socket_addr.sin_addr.s_addr,
             h->h_addr_list[0], h->h_length);
    const char* ip= inet_ntoa(socket_addr.sin_addr);
    std::cout<<ip<<std::endl;
    return ip;
}

int main(int argc, char *argv[]) {
    if (argc < 3) {
        std::cerr << "Usage: " << argv[0] << " <host> <port>" << std::endl;
        return 1;
    }

    std::string host = argv[1];
    int port = std::stoi(argv[2]);

    host = resolveHostname(host.c_str());
    
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

	message += '\n';
        if (send(client_fd, message.c_str(), message.length(), 0) < 0) {
            std::cerr << "Error sending message to server" << std::endl;
            break;
        }

        char buffer[BUFFER_SIZE];
        std::memset(buffer, 0, BUFFER_SIZE);

        int bytes_received = recv(client_fd, buffer, BUFFER_SIZE, 0);

        if (bytes_received < 0) {
            std::cerr << "Error receiving message from server" << std::endl;
            break;
        }

        if (bytes_received == 0) {
            std::cout << "Server disconnected" << std::endl;
            break;
        }

        std::cout << "Received message from server: " << buffer << std::endl;
    }

    close(client_fd);

    return 0;
}
