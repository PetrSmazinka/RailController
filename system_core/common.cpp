#include "common.hpp"

std::pair<bool, double> Line::contains(Point P){
    double t = (P.x-this->A.x)/this->u.at(0);
    if(P.y == this->A.y + t*this->u.at(1)){
        return std::pair<bool, double>({true, t});
    }
    return std::pair<bool, double>({false, 0});
}


