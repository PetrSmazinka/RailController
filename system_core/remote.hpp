#ifndef REMOTE_HPP
#define REMOTE_HPP

#include <sstream>
#include <nlohmann/json.hpp>
#include "algs.hpp"
#include "memory.hpp"
#include "network.hpp"

#define each(a, b) auto a=b->begin(); a != b->end(); a++
#define json_print(json) if(!responsePrinted){ \
            std::cout << json.dump(); \
            responsePrinted = true; \
        }

using json = nlohmann::json;

class Parser{
    private:
        ClientMemory  *_mem;
        MessageSender<ClientMemory>  *_message_sender;
        void _bad_args();
    public:
        bool parse(int argc, char *argv[]);
        bool init_memory();
        ~Parser();

};
class Resolver{
    private:
        static const std::map<SemaphoreState, std::string> _colorConvertor;
        static const std::map<SwitchState, std::string> _positionConvertor;
        static const std::map<ServerState, std::string> _stateConvertor;
    public:
        static void add_ride(Parser &parser, ClientMemory &memory, RailID to, TrainID train, TrainConfig &tcfg);
        static void change_light_intensity(const IP_address &train_ip, const uint8_t &intensity);
        static void change_train_speed(const IP_address &train_ip, const int16_t &speed);
        static void get_current_state(ClientMemory &memory, MessageSender<ClientMemory> &message_sender);
        static void get_loco_info(const IP_address &train_ip);
        static void emergency_stop(MessageSender<ClientMemory> &message_sender);
};

#endif