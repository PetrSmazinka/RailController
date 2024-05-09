#include "network.hpp"

int main(int argc, char *argv[]) {
    if(argc<6){
        return 1;
    }

    Train train(ip(argv[1]), 1);
    struct TrainConfig cfg = {
        .id=(uint8_t)atoi(argv[2]),
        .led=(uint8_t)atoi(argv[3]),
        .speed=(int16_t)atoi(argv[4]),
        .mask=(uint8_t)atoi(argv[5])
    };

    int result = TrainMessenger::send(train, cfg);

    return 0;
}
