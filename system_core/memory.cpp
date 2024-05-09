#include "memory.hpp"

ServerMemory::ServerMemory(){
    using namespace boost::interprocess;
    // SWITCHES
    shared_memory_object::remove("SwitchRailStateMemory");
    this->_switchSegment = managed_shared_memory(create_only, "SwitchRailStateMemory", 65536);
    const SwitchShmemAllocator alloc_inst_sw (this->_switchSegment.get_segment_manager());
    SwitchVector *swv = this->_switchSegment.construct<SwitchVector>("SwitchVector")(alloc_inst_sw);
    this->switches = swv;
    // SEMAPHORES
    shared_memory_object::remove("SemaphoreRailStateMemory");
    this->_semaphoreSegment = managed_shared_memory(create_only, "SemaphoreRailStateMemory", 65536);
    const SemaphoreShmemAllocator alloc_inst_sem (this->_semaphoreSegment.get_segment_manager());
    SemaphoreVector *sev = this->_semaphoreSegment.construct<SemaphoreVector>("SemaphoreVector")(alloc_inst_sem);
    this->semaphores = sev;
    // QUERIES
    shared_memory_object::remove("QueryRailStateMemory");
    this->_querySegment = managed_shared_memory(create_only, "QueryRailStateMemory", 65536);
    const QueryShmemAllocator alloc_inst_qry (this->_querySegment.get_segment_manager());
    QuerySet *qry = this->_querySegment.construct<QuerySet>("QuerySet")(alloc_inst_qry);
    this->queries = qry;
    // TRAINS
    shared_memory_object::remove("TrainRailStateMemory");
    this->_trainSegment = managed_shared_memory(create_only, "TrainRailStateMemory", 65536);
    const TrainShmemAllocator alloc_inst_trn (this->_trainSegment.get_segment_manager());
    TrainSet *trn = this->_trainSegment.construct<TrainSet>("TrainSet")(alloc_inst_trn);
    this->trains = trn;
    // TRACKS
    shared_memory_object::remove("TrackRailStateMemory");
    this->_trackSegment = managed_shared_memory(create_only, "TrackRailStateMemory", 65536);
    const TrackShmemAllocator alloc_inst_trk (this->_trackSegment.get_segment_manager());
    TrackSet *trk = this->_trackSegment.construct<TrackSet>("TrackSet")(alloc_inst_trk);
    this->tracks = trk;
    // MESSAGES
    shared_memory_object::remove("MessageRailStateMemory");
    this->_messageSegment = managed_shared_memory(create_only, "MessageRailStateMemory", 65536);
    const MessageShmemAllocator alloc_inst_msg (this->_messageSegment.get_segment_manager());
    MessageDeque *msg = this->_messageSegment.construct<MessageDeque>("MessageDeque")(alloc_inst_msg);
    this->messages = msg;
    // STATE
    shared_memory_object::remove("StateRailStateMemory");
    this->_stateSegment = managed_shared_memory(create_only, "StateRailStateMemory", 65536);
    this->state = this->_stateSegment.construct<ServerState>("ServerState")(ServerState::RUNNING);
}

ServerMemory::~ServerMemory(){
    this->_switchSegment.destroy<SwitchVector>("SwitchVector");
    this->_semaphoreSegment.destroy<SemaphoreVector>("SemaphoreVector");
    this->_querySegment.destroy<QuerySet>("QuerySet");
    this->_trainSegment.destroy<TrainSet>("TrainSet");
    this->_trackSegment.destroy<TrackSet>("TrackSet");
    this->_messageSegment.destroy<MessageDeque>("MessageDeque");
    this->_stateSegment.destroy<ServerState>("ServerState");
}

ClientMemory::ClientMemory(){
    using namespace boost::interprocess;

    this->_switchSegment = managed_shared_memory(open_only, "SwitchRailStateMemory");
    this->_semaphoreSegment = managed_shared_memory(open_only, "SemaphoreRailStateMemory");
    this->_querySegment = managed_shared_memory(open_only, "QueryRailStateMemory");
    this->_trainSegment = managed_shared_memory(open_only, "TrainRailStateMemory");
    this->_trackSegment = managed_shared_memory(open_only, "TrackRailStateMemory");
    this->_messageSegment = managed_shared_memory(open_only, "MessageRailStateMemory");
    this->_stateSegment = managed_shared_memory(open_only, "StateRailStateMemory");

    this->switches = this->_switchSegment.find<SwitchVector>("SwitchVector").first;
    this->semaphores = this->_semaphoreSegment.find<SemaphoreVector>("SemaphoreVector").first;
    this->queries = this->_querySegment.find<QuerySet>("QuerySet").first;
    this->trains = this->_trainSegment.find<TrainSet>("TrainSet").first;
    this->tracks = this->_trackSegment.find<TrackSet>("TrackSet").first;
    this->messages = this->_messageSegment.find<MessageDeque>("MessageDeque").first;
    this->state = this->_stateSegment.find<ServerState>("ServerState").first;
}

bool ClientMemory::check_init(){
    if(this->switches == nullptr || this->semaphores == nullptr || this->queries == nullptr || this->trains == nullptr || this->tracks == nullptr || this->messages == nullptr || this->state == nullptr){
        return false;
    }
    return true;
}