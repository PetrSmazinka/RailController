#include "algs.hpp"

double Algs::_distance_to_connection(const Point &point, const LineSegment &segment){
    Vector2D SE(segment.end.x-segment.start.x, segment.end.y-segment.start.y);
    Vector2D EP(point.x-segment.end.x, point.y-segment.end.y);
    Vector2D SP(point.x-segment.start.x, point.y-segment.start.y);

    double SE_EP = Vector2D::dot(SE, EP);
    double SE_SP = Vector2D::dot(SE, SP);

    // Case 1
    //             (P)
    //             /
    //            /
    // (S)------(E)   
    if(SE_EP > 0){
        return this->distance(segment.end.x, segment.end.y, point.x, point.y);
    }
    // Case 2
    // (P)
    //   \ 
    //    \ 
    //    (S)------(E)   
    else if(SE_SP < 0){
        return this->distance(segment.start.x, segment.start.y, point.x, point.y);
    }
    // Case 3
    //       (P)
    //        |
    //        |
    // (S)------(E)
    else{
        return (abs(Vector2D::cross(SE, SP))) / (SE.length());
    }
}

std::multimap<double, RailID> Algs::nearest_point(Point point){
    std::multimap<double, RailID> distances;
    // find nearest point
    for(auto &segment : this->_rs.line_segments){
        double distance = this->_distance_to_connection(point, segment.second);
        distances.emplace(std::pair<double, RailID>(distance, segment.first));
    }
    return distances;
}

std::multimap<double, RailID> Algs::nearest_point(int x, int y){
    return Algs::nearest_point(Point(x, y));
}

std::multimap<double, RailID> Algs::nearest_point(char *x, char *y){
    return Algs::nearest_point(atoi(x), atoi(y));
}

void Algs::find_descendant(const RailID node, std::vector<RailID> &descendants){
    for(auto p : this->_rs.tracks){
        if(p.first == node){
            for(auto pp : this->_rs.tracks){
                if(pp.second.to == p.second.from){
                    descendants.push_back(pp.first);
                }
            }
        }
    }
}
void Algs::find_neighbours(const RailID node, std::vector<RailID> &neighbours){
    for(auto p : this->_rs.tracks){
        if(p.first == node){
            for(auto pp : this->_rs.tracks){ 
                if(pp.second.from == p.second.to || pp.second.to == p.second.from){
                    neighbours.push_back(pp.first);
                }
            }
        }
    }
}

void Algs::find_children(const unsigned node, std::vector<unsigned> &children){
    for(auto p : this->_rs.tracks){
        if(p.first == node){
            for(auto pp : this->_rs.tracks){
                if(pp.second.from == p.second.to){
                    children.push_back(pp.first);
                }
            }
        }
    }
}

void Algs::find_path(const unsigned from, const unsigned to, Path &path){
    std::map<unsigned, unsigned> parent_nodes;
    std::vector<unsigned> output_path;
    bool ne = false;

    this->find_path_prepare(from, parent_nodes, output_path, ne);
    this->find_path_execute(to, parent_nodes, output_path, ne, path);
}

void Algs::find_path_prepare(const unsigned from, std::map<unsigned, unsigned> &parent_nodes, std::vector<unsigned> &output_path, bool &ne){
    std::map<unsigned, unsigned> distances;
    std::map<unsigned, unsigned> unvisited;

    unsigned current_node;
    int old_price;

    for(auto track : this->_rs.tracks){
        unsigned i = track.first;
        distances[i] = INF;
        unvisited[i] = i;
        parent_nodes[i] = -1;
    }

    distances[from] = 0;
    current_node = from;
    while(!unvisited.empty()){
        if(current_node == -1){
            ne = true;
            break;
        }
        std::vector<unsigned> children;
        this->find_children(current_node, children);

        for(auto child : children){
            old_price = distances[child];
            distances[child] = std::min(distances[child], distances[current_node] + 1);
            if(old_price != distances[child]){
                parent_nodes[child] = current_node;
            }
        }
        unvisited.erase(current_node);
        int minimum = INF;
        int minimum_index = -1;
        for(auto next_node : unvisited){
            if(distances[next_node.second] < minimum){
                minimum = distances[next_node.second];
                minimum_index = next_node.second;
            }
        }
        current_node = minimum_index;
    }
}

void Algs::find_path_execute(const unsigned to, std::map<unsigned, unsigned> &parent_nodes, std::vector<unsigned> &output_path, bool &ne, Path &path){
    unsigned current_node;
    if(!ne){
        current_node = to;
        while(current_node != -1){
            output_path.push_back(current_node);
            current_node = parent_nodes[current_node];
        }
        while(!output_path.empty()){
            unsigned id = output_path.back();
            path.path.push_back(std::pair<unsigned, Connection&>(id, this->_rs.tracks[id]));
            output_path.pop_back();
        }
    }
}
