#include "network.hpp"

bool TrainMessenger::send(Train &train, TrainConfig &config, unsigned tries, TrainConfig *responsePointer){
    // Create a UDP socket
    int sockfd = socket(AF_INET, SOCK_DGRAM, 0);
    if (sockfd < 0){
        return sockfd;
    }
    // Server address and port
    struct sockaddr_in server_addr;
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(1111); // Destination port
    const char *ipaddr = ip_get_string(train.ip).c_str();
    server_addr.sin_addr.s_addr = inet_addr(ipaddr); // Destination IP address

    
    size_t bytes_sent;
    TrainConfig response;
    struct sockaddr_in server_response_addr;
    socklen_t addr_len = sizeof(server_response_addr);
    ssize_t bytes_received;
    unsigned try_num = 0;
    do{
        // Send the message
        bytes_sent = sendto(sockfd, &config, sizeof(config), 0, (struct sockaddr*)&server_addr, sizeof(server_addr));
        // Receive the response
        struct timeval timeout = {.tv_sec=0, .tv_usec=MAX_WAIT_TIME_US};
        if(setsockopt(sockfd, SOL_SOCKET, SO_RCVTIMEO, (char*)&timeout, sizeof(timeout)) < 0){
            close(sockfd);
            return -1;
        }
        bytes_received = recvfrom(sockfd, &response, sizeof(response), 0, (struct sockaddr*)&server_response_addr, &addr_len);
        try_num++;
    }while(bytes_received < 0 && try_num < tries);

    // Close the socket
    close(sockfd);
    if(responsePointer != nullptr){
        *responsePointer = response;
    }
    if(config.mask == UDP_PACKET_DISCOVERY_QUERY){
        return (response.mask == UDP_PACKET_DISCOVERY_REPLY);
    }
    return (response.mask == UDP_PACKET_ACK);
}
