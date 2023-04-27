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
