#ifndef RAILSTATE_HPP
#define RAILSTATE_HPP

#include <vector>
#include <map>
#include <string>
#include <map>
#include <list>
#include <chrono>
#include <thread>
#include "pugixml.hpp"
#include "hw.hpp"
#include "memory.hpp"
#include "network.hpp"
#include "algs.hpp"

extern bool PROGRAM_RUNNING;

class Algs;

class RailState{
    private:
        int _width;
        int _height;
        Algs *_algs;
        ServerMemory *_mem;
        std::vector<Point> _possible_trains;
        MessageSender<ServerMemory> _message_sender;
        static const std::map<SwitchState, char> _switchstate_convertor;
    public:
        RailState(ServerMemory *memory) : _mem(memory), _message_sender(memory, Device::SERVER){
            this->_message_sender.send_message(TXT_SETUP);
        }
        ~RailState();
        void link_algs(Algs &algs);
        void link_mem(ServerMemory &mem);
        Point &get_point_by_id(const unsigned id);
        Connection &get_connection_by_id(const unsigned id);
        void set_resolution(const int width, const int height);
        bool load_map(const std::string map);
        void config_pins();
        void release_pins();
        void init_switches();
        void init_semaphores();
        void turn_off_semaphores();
        void set_trains_id();
        void update_memory();
        void clear_memory();
        void read_messages();
        void trains_new_iteration();
        void train_at_track(Point point);
        void trains_search();
        void state_update();
        void handle_queries();
        void runtime_error();
        void emergency_break();

        std::map<SemaphoreID, Semaphore> semaphores;
        std::map<SwitchID, Switch> switches;
        std::map<RailID, Connection> tracks;
        std::map<PointID, Point> points;
        std::map<LineSegmentID, LineSegment> line_segments;
        std::map<TrainID, Train> trains;
        std::list<Query> queries;
        std::list<QuerySegment> query_segments;
//        std::list<Path> paths;
};

#endif // RAILSTATE_HPP