#include "remote.hpp"
#include <iostream>

std::vector<std::string> SemaphoreStatesString = {"RED", "YELLOW", "GREEN"};
std::vector<std::string> SwitchStatesString = {"STRAIGHT", "DIVERTED", "UNKNOWN"};
inline std::string _ses(SemaphoreState state){return SemaphoreStatesString[static_cast<int>(state)];}
inline std::string _sws(SwitchState state){return SwitchStatesString[static_cast<int>(state)];}

bool responsePrinted=false;



void Resolver::add_ride(Parser &parser, ClientMemory &memory, RailID to, TrainID train, TrainConfig &tcfg){
    QueryStore qs = {.to = to, .train = train, .config=tcfg};
    auto insert_result = memory.queries->insert(qs);
    if(insert_result.second){
        if(!responsePrinted){
            printf("{\"status\": \"ok\", \"to\": %ld, \"train\": %ld}", to, train);
            responsePrinted = true;
        }
    }
    else{
        auto found = memory.queries->find(qs);
        assert(memory.queries->end() != found);
        if(!responsePrinted){
            printf("{\"status\": \"error\", \"description\": \"Train busy\", \"to\": %ld}", found->to);
            responsePrinted = true;
        }
    }
}

void Resolver::change_light_intensity(const IP_address &train_ip, const uint8_t &intensity){
    Train train(train_ip, ANY);
    struct TrainConfig cfg = {
        .id = ANY,
        .led = intensity,
        .speed = ANY,
        .mask = UDP_PACKET_VALID_LED
    };
    bool result = TrainMessenger::send(train, cfg);
    if(!responsePrinted){
        if(result){
            json output;
            output["status"] = "ok";
            json_print(output);
        }
        else{
            json output;
            output["status"] = "error";
            output["description"] = "Internal error";
            json_print(output);
        }
        responsePrinted = true;
    }
}

void Resolver::change_train_speed(const IP_address &train_ip, const int16_t &speed){
    Train train(train_ip, ANY);
    struct TrainConfig cfg = {
        .id = ANY,
        .led = ANY,
        .speed = speed,
        .mask = UDP_PACKET_VALID_SPEED
    };
    bool result = TrainMessenger::send(train, cfg);
    if(!responsePrinted){
        if(result){
            json output;
            output["status"] = "ok";
            json_print(output);
        }
        else{
            json output;
            output["status"] = "error";
            output["description"] = "Internal error";
            json_print(output);
        }
        responsePrinted = true;
    }
}

const std::map<SemaphoreState, std::string> Resolver::_colorConvertor = {
        {SemaphoreState::OFF, "-"},
        {SemaphoreState::RED, "R"},
        {SemaphoreState::YELLOW, "Y"},
        {SemaphoreState::GREEN, "G"}
};

const std::map<SwitchState, std::string> Resolver::_positionConvertor = {
        {SwitchState::STRAIGHT, "S"},
        {SwitchState::DIVERTED, "D"},
        {SwitchState::UNKNOWN, "U"}
};

const std::map<ServerState, std::string> Resolver::_stateConvertor = {
        {ServerState::RUNNING, "RUNNING"},
        {ServerState::EMERGENCY_STOP, "EMERGENCY_STOP"}
};

void Resolver::get_current_state(ClientMemory &memory, MessageSender<ClientMemory> &message_sender){
    json output;
    output["status"] = "ok";
    for(auto &train : *(memory.trains)){
        output["data"]["trains"][std::to_string(train.id)] = train.track;
    }
    for(auto &track : *(memory.tracks)){
        output["data"]["connections"][std::to_string(track.id)] = Resolver::_colorConvertor.at(track.state);
    }
    for(auto &semaphore : *(memory.semaphores)){
        output["data"]["semaphores"][std::to_string(semaphore.id)] = Resolver::_colorConvertor.at(semaphore.state);
    }
    for(auto &switchR : *(memory.switches)){
        output["data"]["switches"][std::to_string(switchR.id)] = Resolver::_positionConvertor.at(switchR.state);
    }
    output["data"]["serverstate"] = Resolver::_stateConvertor.at(*(memory.state));
    output["data"]["logs"] = json::object();
    std::vector<std::tuple<uint32_t, std::time_t, std::string>> messages;
    int count=0;
    if(message_sender.receive_messages(messages)){
        for(auto &msg : messages){
            output["data"]["logs"][std::to_string(std::get<0>(msg))] = std::pair(std::get<1>(msg), std::get<2>(msg));
        }
    }
    json_print(output);
}

void Resolver::get_loco_info(const IP_address &train_ip){
    Train train(train_ip, ANY);
    struct TrainConfig cfg = {
        .id = ANY,
        .led = ANY,
        .speed = ANY,
        .mask = UDP_PACKET_DISCOVERY_QUERY
    };
    TrainConfig train_state;
    bool result = TrainMessenger::send(train, cfg, 4, &train_state);
    if(!responsePrinted){
        if(result){
            json output;
            output["status"] = "ok";
            output["data"]["id"] = train_state.id;
            output["data"]["led"] = train_state.led;
            output["data"]["speed"] = train_state.speed;
            json_print(output);
        }
        else{
            json output;
            output["status"] = "error";
            output["description"] = "Internal error";
            json_print(output);
        }
        responsePrinted = true;
    }

}

void Resolver::emergency_stop(MessageSender<ClientMemory> &message_sender){
    message_sender.send_message("EMERGENCY_STOP");
    json output;
    output["status"] = "ok";
    json_print(output);
}

void Parser::_bad_args(){
    if(!responsePrinted){
        json output;
        output["status"] = "error";
        output["description"] = "Bad number of arguments";
        json_print(output);
        responsePrinted = true;
    }
}

bool Parser::parse(int argc, char *argv[]){
    if(argc < 2){
        this->_bad_args();
        return false;
    }
    std::string command = argv[1];
    if(command == "command"){
        if(argc < 5){
            this->_bad_args();
            return false;
        }
        if(!this->init_memory()){
            return false;
        }
        RailID to = atol(argv[2]);
        TrainID train = atol(argv[3]);
        uint8_t speed = atoi(argv[4]);
        TrainConfig tcfg = {
            .id = ANY,
            .led = ANY,
            .speed = speed,
            .mask = UDP_PACKET_VALID_SPEED
        };
        Resolver::add_ride(*this, *this->_mem, to, train, tcfg);
    }
    else if(command == "state"){
        if(!this->init_memory()){
            return false;
        }
        Resolver::get_current_state(*this->_mem, *this->_message_sender);
    }
    else if(command == "light"){
        if(argc < 4){
            this->_bad_args();
            return false;
        }
        IP_address train_ip = ip(argv[2]);
        uint8_t light = static_cast<uint8_t>(atoi(argv[3]));
        Resolver::change_light_intensity(train_ip, light);

    }
    else if(command == "shunting"){
        if(argc < 4){
            this->_bad_args();
            return false;
        }
        IP_address train_ip = ip(argv[2]);
        int16_t train_speed = static_cast<int16_t>(atoi(argv[3]));
        Resolver::change_train_speed(train_ip, train_speed);

    }
    else if(command == "loco"){
        if(argc < 3){
            this->_bad_args();
            return false;
        }
        IP_address train_ip = ip(argv[2]);
        Resolver::get_loco_info(train_ip);
    }
    else if(command == "stop"){
        if(!this->init_memory()){
            return false;
        }
        Resolver::emergency_stop(*this->_message_sender);
    }
    return true;
}
bool Parser::init_memory(){
    this->_mem = new ClientMemory();
    if(!this->_mem->check_init()){
        if(!responsePrinted){
            json output;
            output["status"] = "error";
            output["description"] = "Not initialized memory";
            json_print(output);
            responsePrinted = true;
        }
        return false;
    }
    this->_message_sender = new MessageSender<ClientMemory>(this->_mem, Device::CLIENT);
    return true;
}

Parser::~Parser(){
    delete this->_mem;
    delete this->_message_sender;
}

int main(int argc, char *argv[]){
    auto parser = Parser();
    if(!parser.parse(argc, argv)){
        if(!responsePrinted){
            json output;
            output["status"] = "error";
            output["description"] = "Not initialized parser";
            json_print(output);
            responsePrinted = true;
        }
        return 0;
    }
    if(!responsePrinted){
        json output;
        output["status"] = "error";
        output["description"] = "Other error";
        json_print(output);
        fflush(stdout);
    }
    
    return 0;   
}


