#include "railstate.hpp"

bool PROGRAM_RUNNING = true;

const std::map<SwitchState, char> RailState::_switchstate_convertor = {{SwitchState::STRAIGHT, 'S'}, {SwitchState::DIVERTED, 'D'}, {SwitchState::UNKNOWN, 'U'}};

RailState::~RailState(){
    this->clear_memory();
    this->release_pins();
}

void RailState::link_algs(Algs &algs){
    this->_algs = &algs;
}

void RailState::link_mem(ServerMemory &mem){
    this->_mem = &mem;
}

Point &RailState::get_point_by_id(const unsigned id){
    return this->points[id];
}

Connection &RailState::get_connection_by_id(const unsigned id){
    return this->tracks[id];
}

void RailState::set_resolution(const int width, const int height){
    this->_width = width;
    this->_height = height;
}

bool RailState::load_map(const std::string map){
    pugi::xml_document doc;
    pugi::xml_parse_result res = doc.load_file(map.c_str());

    if(res){
        auto root = doc.document_element();
        auto points = root.child("points");
        auto connections = root.child("connections");
        auto switches = root.child("switches");
        auto semaphores = root.child("semaphores");
        auto trains = root.child("trains");
        // Iterate over <points> and store them
        for(auto point : points.children()){
            if(std::string(point.name()) != "point"){
                continue;
            }
            int x = static_cast<int>(point.attribute("x").as_double() * this->_width);
            int y = static_cast<int>(point.attribute("y").as_double() * this->_height + 10);
            PointID id = point.attribute("id").as_int();
            this->points[id] = Point(x, y);
        }
        // Iterate over <connections> and store them
        // create line segments and store them as well
        for(auto connection : connections.children()){
            if(std::string(connection.name()) != "connection"){
                continue;
            }
            RailID id = connection.attribute("id").as_int();
            RailID from = connection.attribute("from").as_int();
            RailID to = connection.attribute("to").as_int();
            
            LineSegment ls(this->get_point_by_id(from), this->get_point_by_id(to));
            this->line_segments.insert({id, ls});

            std::vector<std::pair<unsigned, SwitchState>> require_switch;
            std::vector<unsigned> multi_occupy;
            for(auto switch_or_occupy : connection.children()){
                std::string name = std::string(switch_or_occupy.name());
                if(name == "switch"){
                    SwitchID switch_id = switch_or_occupy.attribute("id").as_int();
                    SwitchState switch_state = SwitchState::UNKNOWN;
                    std::string switch_state_str = std::string(switch_or_occupy.attribute("position").as_string());
                    if(switch_state_str == "S"){
                        switch_state = SwitchState::STRAIGHT;
                    }
                    else if(switch_state_str == "D"){
                        switch_state = SwitchState::DIVERTED;
                    }
                    else{
                        return false;
                    }
                    require_switch.push_back(std::pair<SwitchID, SwitchState>(switch_id, switch_state));
                }
                else if(name == "multioccupy"){
                    RailID connection_id = switch_or_occupy.attribute("id").as_int();
                    multi_occupy.push_back(connection_id);
                }
            }
            this->tracks[id] = Connection(from, to, require_switch, multi_occupy);
        }
        // Iterate over <switches> and store them
        for(auto point : switches.children()){
            if(std::string(point.name()) != "switch"){
                continue;
            }
            SwitchID id = point.attribute("id").as_int();
            Pin pin = point.attribute("pin").as_int();
            this->switches.insert(std::pair<SwitchID, Switch>(id, Switch(pin)));
        }
        // Iterate over <semaphores> and store them
        for(auto semaphore : semaphores.children()){
            if(std::string(semaphore.name()) != "semaphore"){
                continue;
            }
            SemaphoreID sem_id = semaphore.attribute("id").as_int();
            RailID rail_id = semaphore.attribute("connection").as_int();
            Pin mspin = semaphore.attribute("mspin").as_int();
            Pin lspin = semaphore.attribute("lspin").as_int();
            this->semaphores.insert(std::pair<SemaphoreID, Semaphore>(sem_id, Semaphore(rail_id, mspin, lspin)));
        }
        // Iterate over <trains> and store them
        for(auto train : trains.children()){
            if(std::string(train.name()) != "train"){
                continue;
            }
            TrainID id = train.attribute("id").as_int();
            IP_address addr = ip(train.attribute("ip").as_string());
            RailID track = train.attribute("start").as_int();
            //this->trains[id] = Train(addr);
            this->trains.insert(std::pair<TrainID, Train>(id, Train(addr, track)));
            this->tracks.at(track).occupied_by_train.set(id);
        }
        this->_message_sender.send_message(TXT_XML_LOADED);
        return true;
    }

    return false;
}

void RailState::config_pins(){
    HW::config_pins(this->switches, this->semaphores);
}

void RailState::release_pins(){
    HW::release_pins(this->switches, this->semaphores);
}

void RailState::init_switches(){
    for(auto &switchR : this->switches){
        HW::set_switch_state(switchR.second, SwitchState::STRAIGHT);
    }
}

void RailState::init_semaphores(){
    for(auto &semaphore : this->semaphores){
        HW::set_semaphore_state(semaphore.second, SemaphoreState::GREEN);
    }
}

void RailState::turn_off_semaphores(){
    for(auto &semaphore : this->semaphores){
        HW::set_semaphore_state(semaphore.second, SemaphoreState::OFF);
    }
}

void RailState::set_trains_id(){
    for(auto &train : this->trains){
        TrainConfig tcfg = {
            .id = static_cast<uint8_t>(train.first), // LIMITATION for physical loco devices to 256
            .led = ANY,
            .speed = ANY,
            .mask = UDP_PACKET_VALID_ID
        };
        TrainMessenger::send(train.second, tcfg);
    }
}

void RailState::update_memory(){
    this->_mem->switches->clear();
    this->_mem->semaphores->clear();
    this->_mem->trains->clear();
    this->_mem->tracks->clear();
    for(auto &switchR : this->switches){
        this->_mem->switches->push_back(SwitchStore({switchR.first, switchR.second.state}));
    }
    for(auto &semaphore : this->semaphores){
        this->_mem->semaphores->push_back(SemaphoreStore({semaphore.first, semaphore.second.state}));
    }
    for(auto &train : this->trains){
        this->_mem->trains->insert(TrainStore({train.first, train.second.track}));
    }
    for(auto &track : this->tracks){
        this->_mem->tracks->insert(TrackStore({track.first, track.second.color}));
    }
}

void RailState::clear_memory(){
    this->_mem->switches->clear();
    this->_mem->semaphores->clear();
    this->_mem->queries->clear();
    this->_mem->trains->clear();
    this->_mem->tracks->clear();
    this->_mem->messages->clear();
}

void RailState::read_messages(){
    std::string message;
    bool STOP = false;
    while(this->_message_sender.pick_up_message(message)){
        if(message == "EMERGENCY_STOP"){
            this->_message_sender.send_message(TXT_USER_E_STOP);
            STOP = true;
            break;
        }
    }
    if(STOP){
        this->emergency_break();
    }
}

void RailState::trains_new_iteration(){
    this->_possible_trains.clear();
}

void RailState::train_at_track(Point point){
    this->_possible_trains.push_back(point);
}

// find trains on tracks based on points of movements, with additional 2-level correction
void RailState::trains_search(){
    if(this->_possible_trains.size() == 0){
        return;
    }
    // all possible rails | distance from rail center | point order  
    std::map<RailID, std::vector<std::pair<double, Order>>> dataset;
    // point order       |     distance | rail
    std::map<Order, std::multimap<double, RailID>> point_closest_tracks;
    // dijkstra distance | rail id | train id
    //std::map<Distance, std::pair<RailID, TrainID>> rail_assign;
    std::multimap<Distance, std::tuple<RailID, TrainID, Order>> rail_assign;
    std::map<TrainID, Train> moving_trains;

    std::copy_if(this->trains.begin(), this->trains.end(), std::inserter(moving_trains, moving_trains.end()), [](const std::pair<TrainID, Train> &pair){return pair.second.is_moving;});

    unsigned i=0;
    for(auto &point : this->_possible_trains){
        std::multimap<double, RailID> closest_track = this->_algs->nearest_point(point);

        dataset[closest_track.begin()->second].push_back(std::pair(closest_track.begin()->first, i));
        point_closest_tracks.emplace(std::pair(i, closest_track));
        i++;
    }
    for(auto train : moving_trains){
        std::map<unsigned, unsigned> parent_nodes;
        std::vector<unsigned> output_path;
        bool ne = false;
        this->_algs->find_path_prepare(train.second.track, parent_nodes, output_path, ne);
        unsigned min_distance = INF;
        unsigned current_distance;
        unsigned closest_rail;
        Order point_order;
        for(auto rail : dataset){
            Path path;
            this->_algs->find_path_execute(rail.first, parent_nodes, output_path, ne, path);
            current_distance = path.path.size();
            if(current_distance < min_distance){
                min_distance = current_distance;
                closest_rail = rail.first;
                point_order = rail.second.at(0).second;
            }
        }
        rail_assign.emplace(std::pair(min_distance, std::tuple(closest_rail, train.first, point_order)));
    }
    int recognized_trains=0;
    for(int i=0; i<rail_assign.size(); i++){
        auto it = rail_assign.begin();
        std::advance(it, i);

        RailID rail;
        TrainID train; 
        Order movement_point;
        std::tie(rail, train, movement_point) = it->second;
        std::map<RailID, Distance> alternative_switch_tracks;

        // don't update not moving trains
        if(!this->trains.at(train).is_moving){
            continue;
        }
        // don't use falsely detected movements in tracks occupied by another trains
        if(this->tracks.at(rail).occupied_by_train.is_set() && this->tracks.at(rail).occupied_by_train.get() != train){
            continue;
        }
        // limit detected points
        if(recognized_trains >= std::min(moving_trains.size(), this->_possible_trains.size())){
            break;
        }
        recognized_trains++;

        // check for possible mistake & correction
        bool found = false;
        bool corrected=false;
        for(auto &qsgmt : this->query_segments){
            if(train != qsgmt.query.train){
                continue;
            }
            std::vector<RailID> second_direction;
            // is track switch? add another directions to check vector
            for(auto &sw_dir : this->tracks.at(rail).require_switches){
                SwitchID swid = sw_dir.first;
                for(auto &another_dirs : this->tracks){
                    if(another_dirs.first == rail){
                        continue;
                    }
                    for(auto &switchD : another_dirs.second.require_switches){
                        if(switchD.first == swid){
                            second_direction.push_back(another_dirs.first);
                        }
                    }
                    
                }
            }
            // same for multi occupations
            for(auto &moccup : this->tracks.at(rail).multi_occupy){
                second_direction.push_back(moccup);
            }
            for(auto &path_rail : qsgmt.tracks){
                if(path_rail.first.first == rail){
                    // correctly detected
                    found = true;
                }
                // check if there aren't any neighour tracks closer to actual train position
                for(auto &sd : second_direction){
                    if(path_rail.first.first == sd){
                        alternative_switch_tracks.emplace(std::pair<RailID, Distance>(sd, ANY));
                    }
                }
            }
            // calculate distance to alternative tracks
            if(!alternative_switch_tracks.empty()){
                std::map<unsigned, unsigned> parent_nodes;
                std::vector<unsigned> output_path;
                bool ne = false;
                this->_algs->find_path_prepare(this->trains.at(train).track, parent_nodes, output_path, ne);
                
                std::map<Distance, RailID> shortest_distances;
                std::pair<Distance, RailID> shortest_distance;
                if(found){
                    shortest_distances.insert(std::pair<Distance, RailID> (it->first, rail));
                }
                for(auto &alternative : alternative_switch_tracks){
                    Path path;
                    this->_algs->find_path_execute(alternative.first, parent_nodes, output_path, ne, path);
                    if(!ne){
                        alternative.second = path.path.size();
                        shortest_distances.emplace(std::pair<Distance, RailID>(alternative.second, alternative.first));
                    }
                }
                if(!shortest_distances.empty()){
                    shortest_distance = std::pair<Distance, RailID>(shortest_distances.begin()->first, shortest_distances.begin()->second);
                    // update actual rail
                    found = true; // may not be already true
                    this->_message_sender.send_message(TXT_FIRST_CORRECTION, rail, shortest_distance.second);
                    rail = shortest_distance.second;
                }
            }
            if(found){
                break;
            }
            // second level of correction (more general)
            int count=0;
            auto itt = point_closest_tracks.at(movement_point).begin();
            if(itt == point_closest_tracks.at(movement_point).end()){
                break;
            }
            itt++;
            for(; itt != point_closest_tracks.at(movement_point).end() && count < NEIGHBOURHOOD; itt++, count++){
                for(auto &unvisited : qsgmt.tracks){
                    //if(this->tracks.at(itt->second).occupied_by_train.is_set() && this->tracks.at(itt->second).occupied_by_train.get() != train){
                    //    break;
                    //}
                    if(itt->second == unvisited.first.first){
                        // this is correct rail
                        this->_message_sender.send_message(TXT_SECOND_CORRECTION, rail, itt->second);
                        rail = itt->second;
                        corrected = true;
                        break;
                    }
                }
                if(corrected){
                    break;
                }
            }
            break;
        }
        if(!found && !corrected){
            this->_message_sender.send_message(TXT_CORRECTION_FAILED);
            this->emergency_break();
        }
        // end of check

        this->trains.at(train).track = rail;
        for(auto &track : this->tracks){
            if(track.second.occupied_by_train.is_set() && track.second.occupied_by_train.get() == train){
                track.second.occupied_by_train.unset();
            }
        }
        this->tracks.at(rail).occupied_by_train.set(train);
    }
    this->state_update();
}

// update colors of tracks based on its occupation
void RailState::state_update(){
    // set  all tracks to green
    for(auto &track : this->tracks){
        track.second.color = SemaphoreState::GREEN;
    }
    // set immidiately occupied tracks or multi occupied tracks to RED, same for another partsof switches
    for(auto &track : this->tracks){
        if(track.second.occupied_by_train.is_set()){
            track.second.color = SemaphoreState::RED;
            // multi occupied sections
            for(auto &multi_track : track.second.multi_occupy){
                this->tracks.at(multi_track).color = SemaphoreState::RED;
            }
            // if track is one part of switch, then update another parts of the switch
            if(!track.second.require_switches.empty()){
                for(auto &switch_position : track.second.require_switches){
                    for(auto &track2 : this->tracks){
                        for(auto &switch_position2 : track2.second.require_switches){
                            if(switch_position2.first == switch_position.first && switch_position2.second != switch_position.second){
                                track2.second.color = SemaphoreState::RED;
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
    // set previous tracks or previous multi tracks to YELLOW
    for(auto &track : this->tracks){
        for(auto &track2 : this->tracks){
            if(track.second.to == track2.second.from && track2.second.color == SemaphoreState::RED && track.second.color != SemaphoreState::RED){
                track.second.color = SemaphoreState::YELLOW;
                // set also for multi occupied tracks
                for(auto &multi_occ : track.second.multi_occupy){
                    if(this->tracks.at(multi_occ).color != SemaphoreState::RED){
                        this->tracks.at(multi_occ).color = SemaphoreState::YELLOW;
                    }
                }
            }
        }
    }
    // update semaphores
    for(auto &semaphore : this->semaphores){
        SemaphoreState color = this->tracks.at(semaphore.second.binded_to).color;
        HW::set_semaphore_state(semaphore.second, color);
        semaphore.second.state = color;
    }
}

void RailState::handle_queries(){
    // Insert new queries from shared memory
    for(auto &qs : *(this->_mem->queries)){
        if(!qs.processed){
            Query q(qs.to, qs.train, qs.config);
            this->queries.push_back(q);
            this->_message_sender.send_message(TXT_NEW_QUERY, qs.train, qs.to);
            qs.processed=true;
        }
    }
    // Finding path for not active queries and creating query segments
    for(auto &q : this->queries){
        if(q.being_satisfied){
            continue;
        }
        TrainID train = q.train;
        RailID to = q.to;
        RailID from = this->trains.at(train).track;
        Path path;
        Path free_path;
        this->_algs->find_path(from, to, path);
        unsigned free_tracks = 0;
        for(auto it = path.path.begin(); it < path.path.end(); it++){
            if(it->second.occupied_by_train.is_set() && train != it->second.occupied_by_train.get()){
                break;
            }
            else{
                free_tracks++;
                free_path.path.push_back(*it);
            }
        }
        Path checked_path; // path without any both tracks of the same switch -> impossible ride
        std::set<SwitchID> switches_to_change;
        bool path_completed = false;
        for(auto &rail_in_path : free_path.path){
            // check for both parts of one switch in path
            for(auto &required_switch_pos : rail_in_path.second.require_switches){
                if(switches_to_change.contains(required_switch_pos.first)){
                    path_completed = true;
                    break;
                }
                switches_to_change.emplace(required_switch_pos.first);
            }
            //don't include reserved tracks
            if(rail_in_path.second.reserved_by_train.is_set() && rail_in_path.second.reserved_by_train.get() != train){ //second part of condition should never happen
                break;
            }
            if(path_completed){
                break;
            }
            checked_path.path.push_back(rail_in_path);
        }
        // put reservation on tracks in checked path
        for(auto &reservedTrack : checked_path.path){
            reservedTrack.second.reserved_by_train.set(train);
        }
        free_tracks = checked_path.path.size();
                
        if(free_tracks > 1){// && checked_path.path.at(1).second.color == SemaphoreState::GREEN){
            this->_message_sender.send_message(TXT_PATH_FOUND, train, free_tracks, this->trains.at(train).track, checked_path.path.back().first);
            QuerySegment qsgmt = QuerySegment(q, checked_path);
            this->query_segments.push_back(qsgmt);
            
            // change switches
            this->_message_sender.send_message(TXT_SWITCHES, train);
            std::stringstream switches_states;
            switches_states << "\t";
            std::set<SwitchID> changed_switches;
            for(auto &track : checked_path.path){
                for(auto &switchP : track.second.require_switches){
                    HW::set_switch_state(this->switches.at(switchP.first), switchP.second);
                    switches_states << switchP.first << this->_switchstate_convertor.at(switchP.second) << ' ';
                }
            }
            this->_message_sender.send_message(switches_states.str().c_str());

            // start train
            Train &tr_ref = this->trains.at(train);
            if(TrainMessenger::send(tr_ref, q.config)){
                this->_message_sender.send_message(TXT_TRAIN_MOVE, train, q.config.speed);
                this->trains.at(train).is_moving = true;
                q.being_satisfied = true;
            }
            else{
                this->_message_sender.send_message(TXT_TRAIN_MOVE_ERROR, train);
            }
        }
    }
    // Update active query segments based on train movement
    for(auto &train : this->trains){
        // only moving trains
        if(!train.second.is_moving){
            continue;
        }
        ValueContainer<RailID> also_accepted_track;
        for(auto &qsgmt : this->query_segments){
            // only querysegments for desired train
            if(train.first != qsgmt.query.train){
                continue;
            }
            // control - find train in calculated route
            bool found=false;
            for(const auto &track : qsgmt.tracks){
                if(track.first.first == train.second.track){
                    found=true;
                }
            }
            if(!found){
                this->_message_sender.send_message(TXT_WRONG_PLACE, train.first, train.second.track);
                this->emergency_break();
            }
            // update visited tracks in calculated route
            for(auto &track : qsgmt.tracks){
                track.second = true;
                if(track.first.first == train.second.track || (also_accepted_track.is_set() && also_accepted_track.get() == track.first.first)){
                    break;
                }
                if(track.first.second.reserved_by_train.is_set() && track.first.second.reserved_by_train.get() == train.first){
                    track.first.second.reserved_by_train.unset();
                }
            }
            // train is at last track of route (reached its destination)
            if(qsgmt.tracks.back().second){
                // query segment was fulfilled
                // stop train
                TrainConfig tcfg = {
                    .id = ANY,
                    .led = ANY, 
                    .speed = 0,
                    .mask = UDP_PACKET_VALID_SPEED
                };
                if(TrainMessenger::send(train.second, tcfg)){
                    this->_message_sender.send_message(TXT_TRAIN_DESTINATION, train.first);
                }
                else{
                    this->_message_sender.send_message(TXT_TRAIN_DESTINATION_ERROR, train.first);
                }
                qsgmt.query.being_satisfied = false;
                this->trains.at(qsgmt.query.train).is_moving = false;
                if(qsgmt.query.to == this->trains.at(qsgmt.query.train).track){ // train arrived in final destination
                    this->_mem->queries->erase(QueryStore({
                        .to = qsgmt.query.to,
                        .train = qsgmt.query.train,
                        .config = qsgmt.query.config,
                    }));
                    this->queries.remove(qsgmt.query);
                }
                this->query_segments.remove(qsgmt);
                // release all reservations
                for(auto &track : this->tracks){
                    if(track.second.reserved_by_train.is_set() && track.second.reserved_by_train.get() == train.first){
                        track.second.reserved_by_train.unset();
                    }
                }
            }
            break; // only one train segment for one train
        }
    }
}

void RailState::runtime_error(){
    this->_message_sender.send_message(TXT_OTHER_ERROR);
    this->emergency_break();
}

void RailState::emergency_break(){
    for(auto &train : this->trains){
        TrainConfig tcfg = {
            .id = ANY,
            .led = ANY,
            .speed = ANY,
            .mask = UDP_PACKET_EMERGENCY_STOP
        };
        TrainMessenger::send(train.second, tcfg);
        train.second.is_moving = false;
    }
    *(this->_mem->state) = ServerState::EMERGENCY_STOP;
    WAIT_UNTIL(PROGRAM_RUNNING){
        for(auto &semaphore : this->semaphores){
            HW::set_semaphore_state(semaphore.second, SemaphoreState::YELLOW);
            semaphore.second.state = SemaphoreState::YELLOW;
        }
        this->update_memory();
        std::this_thread::sleep_for(std::chrono::milliseconds(500));
        if(!PROGRAM_RUNNING){
            break;
        }
        for(auto &semaphore : this->semaphores){
            HW::set_semaphore_state(semaphore.second, SemaphoreState::OFF);
            semaphore.second.state = SemaphoreState::OFF;
        }
        this->update_memory();
        std::this_thread::sleep_for(std::chrono::milliseconds(500));
    }
}
