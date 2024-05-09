#ifndef COMMON_HPP
#define COMMON_HPP

/* directives intended to be modified */
#define LANG_CS 
#define HTTP_ROOT "/var/www/html/"

#include <cmath>
#include <vector>
#include <limits>
#include <chrono>
#include <opencv2/imgproc.hpp>
#include <opencv2/core.hpp>
#include <opencv2/imgcodecs.hpp>
#include <opencv2/highgui.hpp>
#include <opencv2/opencv.hpp>
#include "ip.hpp"
#include "dictionary.hpp"

#define WAIT() for(;;)
#define WAIT_UNTIL(value) for(;value;)
#define ARGUMENT_CONTROL() \
    if(argc < 2){ \
        std::cerr << "You need to pass .xml file" << std::endl; \
        return 1; \
    }
#define REQUIRE(statement, errCode) \
    if(!statement){ \
        std::cerr << "An error has occured. Error code: " << errCode << std::endl; \
        return errCode; \
    }

#define XML_FILE HTTP_ROOT "photo.xml"
#define JPG_FILE HTTP_ROOT "photo.jpg"
#define FPS2TIME(a) (1000000 / a)
#define INF UINT_MAX
#define ANY 0

#define UDP_PACKET_VALID_ID        0b00000001
#define UDP_PACKET_VALID_LED       0b00000010
#define UDP_PACKET_VALID_SPEED     0b00000100
#define UDP_PACKET_EMERGENCY_STOP  0b00000000
#define UDP_PACKET_ACK             0b01010101
#define UDP_PACKET_DISCOVERY_REPLY 0b10101010
#define UDP_PACKET_DISCOVERY_QUERY 0b11111111

#define MSPIN_MASK 0b00000010
#define LSPIN_MASK 0b00000001

#define MESSAGE_SIZE 150
#define MESSAGE_COUNT 100

#define NEIGHBOURHOOD 5

typedef std::vector<double> Vector;
typedef unsigned PointID;
typedef unsigned LineSegmentID;
typedef unsigned RailID;
typedef unsigned TrainID;
typedef unsigned SemaphoreID;
typedef unsigned SwitchID;
typedef unsigned Order;
typedef unsigned Distance;
typedef unsigned Pin;

enum class SemaphoreState{OFF, RED, YELLOW, GREEN};
enum class SwitchState{STRAIGHT, DIVERTED, UNKNOWN};
enum class Device{SERVER, CLIENT};
enum class ServerState{RUNNING, EMERGENCY_STOP};
enum class ProgramMode{NORMAL, CAPTURE};

template <typename T> class ValueContainer{
    private:
        T _value;
        bool _set;
    public:
        ValueContainer(T value) : _value(value), _set(true) { }
        ValueContainer() : _set(false) { }
        T get(){
            return this->_value;
        }
        void set(T value){
            this->_value = value;
            this->_set = true;
        }
        void unset(){
            this->_value = {};
            this->_set = false;
        }
        bool is_set(){
            return this->_set;
        }
        bool operator==(ValueContainer<T>& other) {
            if(!this->_set && !other.is_set()){
                return true;
            }
            else if(!this->_set || !other.is_set()){
                return false;
            }
            else{
                return this->_value == other.get();
            }
        }
        
};


struct TrainConfig{
    uint8_t id;
    uint8_t led;
    int16_t speed;
    uint8_t mask;
    bool operator==(const TrainConfig& other) const {
        return (this->id == other.id && this->led == other.led && this->speed == other.speed && this->mask == other.mask);
    }
};
class Point{
    public:
        double x;
        double y;
        Point(){}
        Point(double x, double y) : x(x), y(y) {}

        operator cv::Point (){
            return cv::Point(this->x, this->y);
        }
};
class Vector2D : public Point{
    public:
        Vector2D(double x, double y) : Point(x, y){}
        static inline double dot(Vector2D &u, Vector2D &v){
            return u.x*v.x + u.y*v.y;
        }
        double inline dot(Vector2D &u){
            return this->x*u.x + this->y*u.y;
        }
        static inline double cross(Vector2D &u, Vector2D &v){
            return u.x*v.y - v.x*u.y;
        }
        double inline cross(Vector2D &u){
            return this->x*u.y - u.x*this->y;
        }
        double inline length(){
            return sqrt(this->x*this->x + this->y*this->y);
        }
};
class Connection{
    public:
        RailID from;
        RailID to;
        ValueContainer<TrainID> occupied_by_train;
        ValueContainer<TrainID> reserved_by_train;
        SemaphoreState color = SemaphoreState::GREEN;
        std::vector<std::pair<SwitchID, SwitchState>> require_switches;
        std::vector<RailID> multi_occupy;
        Connection(){}
        Connection(RailID from, RailID to, std::vector<std::pair<SwitchID, SwitchState>> &_requires, std::vector<RailID> &_multi_occupy) : from(from), to(to){
            this->require_switches = std::move(_requires);
            this->multi_occupy = std::move(_multi_occupy);
        }
        bool operator==(Connection& other) {
            return (this->from == other.from && this->to == other.to && this->occupied_by_train == other.occupied_by_train && this->require_switches == other.require_switches && this->multi_occupy == other.multi_occupy);
        }
};
class Path{
    public:
        std::vector<std::pair<unsigned, Connection&>> path;
        //std::vector

};
class LineSegment{
    public:
        Point start;
        Point end;
        Point center;
        LineSegment(Point start, Point end) : start(start), end(end) {
            center.x = (start.x + end.x) / 2.0;
            center.y = (start.y + end.y) / 2.0;
        }
};
class Line{
    public:
        Point A;
        Vector u;
        Line(Point A, Vector u): A(A), u(u) {}
        std::pair<bool, double> contains(Point P);
};
class Switch{
    public:
        Pin pin;
        SwitchState state;
        Switch(Pin pin) : pin(pin), state(SwitchState::UNKNOWN) {}
};
class Semaphore{
    public:
        SemaphoreState state;
        RailID binded_to;
        Pin mspin;
        Pin lspin;
        Semaphore(RailID binded_to, Pin mspin, Pin lspin) : state(SemaphoreState::GREEN), binded_to(binded_to), mspin(mspin), lspin(lspin) {}
};
class Query{
    public:
        RailID to;
        TrainID train;
        TrainConfig config;
        bool being_satisfied;
        Query(RailID to, TrainID train, TrainConfig config) : to(to), train(train), config(config), being_satisfied(false) {}
        bool operator==(const Query& other) const {
            return (this->train == other.train && this->config == other.config && this->being_satisfied == other.being_satisfied);
        }

};
class QuerySegment{
    public:
        std::vector<std::pair<std::pair<RailID, Connection&>, bool>> tracks;
        Query &query;
        QuerySegment(Query &query, std::vector<std::pair<std::pair<RailID, Connection&>, bool>> &path) : tracks(std::move(path)), query(query){}
        QuerySegment(Query &query, const Path &path) : query(query){
            for(auto &node : path.path){
                this->tracks.push_back(std::pair<std::pair<RailID, Connection&>, bool>(node, false));
            }
        }
        bool operator==(const QuerySegment& other) const {
            return (this->query == other.query && this->tracks == other.tracks);
        }
};
class Train{
    public:
        IP_address ip;
        RailID track;
        bool is_moving;
        Train(IP_address ip, RailID track) : ip(ip), track(track), is_moving(false) {}
};
struct TrainStore{
    TrainID id;
    RailID track;
    bool operator<(const TrainStore& other) const {
        return this->id < other.id;
    }
    bool operator==(const TrainStore& other) const {
        return (this->id == other.id && this->track == other.track);
    }
};
struct TrackStore{
    RailID id;
    SemaphoreState state;
    bool operator<(const TrackStore& other) const {
        return this->id < other.id;
    }
    bool operator==(const TrackStore& other) const {
        return (this->id == other.id && this->state == other.state);
    }
};
struct SwitchStore{
    SwitchID id;
    SwitchState state;
};
struct SemaphoreStore{
    SemaphoreID id;
    SemaphoreState state;
};
struct QueryStore{
    RailID to;
    TrainID train;
    TrainConfig config;
    bool processed = false;
    bool operator<(const QueryStore& other) const {
        return this->train < other.train;
    }
    bool operator==(const QueryStore& other) const {
        return (this->to == other.to && this->train == other.train);
    }
};
struct Message{
    Device receiver;
    char message[MESSAGE_SIZE];
    uint32_t timestamp; // is valid to overflow
    std::time_t true_time;
};

#endif
