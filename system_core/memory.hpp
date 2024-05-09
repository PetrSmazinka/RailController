#ifndef MEMORY_HPP
#define MEMORY_HPP

#include <vector>
#include <boost/interprocess/managed_shared_memory.hpp>
#include <boost/interprocess/containers/vector.hpp>
#include <boost/interprocess/containers/set.hpp>
#include <boost/interprocess/containers/deque.hpp>
#include <boost/interprocess/allocators/allocator.hpp>
#include "common.hpp"

typedef boost::interprocess::allocator<SwitchStore, boost::interprocess::managed_shared_memory::segment_manager> SwitchShmemAllocator;
typedef boost::container::vector<SwitchStore, SwitchShmemAllocator> SwitchVector;
typedef boost::interprocess::allocator<SemaphoreStore, boost::interprocess::managed_shared_memory::segment_manager> SemaphoreShmemAllocator;
typedef boost::container::vector<SemaphoreStore, SemaphoreShmemAllocator> SemaphoreVector;
typedef boost::interprocess::allocator<QueryStore, boost::interprocess::managed_shared_memory::segment_manager> QueryShmemAllocator;
typedef boost::container::set<QueryStore, std::less<QueryStore>, QueryShmemAllocator> QuerySet;
typedef boost::interprocess::allocator<TrainStore, boost::interprocess::managed_shared_memory::segment_manager> TrainShmemAllocator;
typedef boost::container::set<TrainStore, std::less<TrainStore>, TrainShmemAllocator> TrainSet;
typedef boost::interprocess::allocator<TrackStore, boost::interprocess::managed_shared_memory::segment_manager> TrackShmemAllocator;
typedef boost::container::set<TrackStore, std::less<TrackStore>, TrackShmemAllocator> TrackSet;

typedef boost::interprocess::allocator<Message, boost::interprocess::managed_shared_memory::segment_manager> MessageShmemAllocator;
typedef boost::container::deque<Message, MessageShmemAllocator> MessageDeque;


class ServerMemory{
    private:
        boost::interprocess::managed_shared_memory _switchSegment;
        boost::interprocess::managed_shared_memory _semaphoreSegment;
        boost::interprocess::managed_shared_memory _querySegment;
        boost::interprocess::managed_shared_memory _trainSegment;
        boost::interprocess::managed_shared_memory _trackSegment;
        boost::interprocess::managed_shared_memory _messageSegment;
        boost::interprocess::managed_shared_memory _stateSegment;
    public:
        ServerMemory();
        ~ServerMemory();
        SwitchVector *switches;
        SemaphoreVector *semaphores;
        QuerySet *queries;
        TrainSet *trains;
        TrackSet *tracks;
        MessageDeque *messages;
        ServerState *state;
};

class ClientMemory{
    private:
        boost::interprocess::managed_shared_memory _switchSegment;
        boost::interprocess::managed_shared_memory _semaphoreSegment;
        boost::interprocess::managed_shared_memory _querySegment;
        boost::interprocess::managed_shared_memory _trainSegment;
        boost::interprocess::managed_shared_memory _trackSegment;
        boost::interprocess::managed_shared_memory _messageSegment;
        boost::interprocess::managed_shared_memory _stateSegment;
    public:
        ClientMemory();
        bool check_init();
        SwitchVector *switches;
        SemaphoreVector *semaphores;
        QuerySet *queries;
        TrainSet *trains;
        TrackSet *tracks;
        MessageDeque *messages;
        ServerState *state;
};

template <typename T> class MessageSender{
    private:
        T *_mem;
        Device _dev;
    public:
        MessageSender(T *mem, Device dev) : _mem(mem), _dev(dev) {}
        void send_message(const char *format, ...){
            char message[MESSAGE_SIZE];
            va_list args;
            va_start(args, format);
            std::vsprintf(message, format, args);
            va_end(args);

            Message msg;
            msg.receiver = this->_dev == Device::CLIENT ? Device::SERVER : Device::CLIENT;
            msg.timestamp = 0;
            std::time(&msg.true_time);
            if(!this->_mem->messages->empty()){
                msg.timestamp = this->_mem->messages->back().timestamp + 1;
            }
            strncpy(msg.message, message, MESSAGE_SIZE);

            while(this->_mem->messages->size() > MESSAGE_COUNT){
                this->_mem->messages->pop_front();
            }

            this->_mem->messages->push_back(msg);
        }
        bool receive_messages(std::vector<std::tuple<uint32_t, std::time_t, std::string>> &messages){
            bool received = false;
            if(!this->_mem->messages->empty()){
                for(auto iter = this->_mem->messages->begin(); iter != this->_mem->messages->end();++iter){
                    if(iter->receiver == this->_dev){
                        received = true;
                        messages.push_back(std::tuple<uint32_t, std::time_t, std::string>(iter->timestamp, iter->true_time, std::string(iter->message)));
                    }
                }
            }
            return received;
        }
        bool pick_up_message(std::string &message){
            bool received = false;
            if(!this->_mem->messages->empty()){
                for(auto iter = this->_mem->messages->begin(); iter != this->_mem->messages->end();++iter){
                    if(iter->receiver == this->_dev){
                        received = true;
                        message = std::string(iter->message);
                        break;
                    }
                }
            }
            return received;
        }
};

#endif