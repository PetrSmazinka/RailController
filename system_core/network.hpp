#ifndef NETWORK_HPP
#define NETWORK_HPP

#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include "common.hpp"

#define MAX_WAIT_TIME_US 40000 // Waiting time for response is set to 20 ms

class TrainMessenger{
    public:
        static bool send(Train &train, TrainConfig &config, unsigned tries=4, TrainConfig *responsePointer=nullptr);
};

#endif // NETWORK_HPP