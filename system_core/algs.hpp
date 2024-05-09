#ifndef ALGS_HPP
#define ALGS_HPP

#include <cmath>
#include <cstdlib>
#include <limits>
#include "railstate.hpp"
#include "common.hpp"

class RailState;

class Algs{
    private:
        RailState &_rs;
        double _distance_to_connection(const Point &point, const LineSegment &segment);
    public:
        Algs(RailState &rs) : _rs(rs) {}
        std::multimap<double, RailID> nearest_point(char *x, char *y);
        std::multimap<double, RailID> nearest_point(Point point);
        std::multimap<double, RailID> nearest_point(int x, int y);
        void find_descendant(const RailID node, std::vector<RailID> &descendants);
        void find_neighbours(const RailID node, std::vector<RailID> &neighbours);
        void find_children(const RailID node, std::vector<RailID> &children);
        void find_path(const RailID from, const RailID to, Path &path);
        void find_path_prepare(const RailID from, std::map<unsigned, unsigned> &parent_nodes, std::vector<unsigned> &output_path, bool &ne);
        void find_path_execute(const RailID to, std::map<unsigned, unsigned> &parent_nodes, std::vector<unsigned> &output_path, bool &ne,  Path &path);

        double inline distance(int x1, int y1, int x2, int y2){
            return sqrt( (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1) );
        }
        unsigned inline squared_distance(int x1, int y1, int x2, int y2){
            return (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1);
        }
        unsigned inline squared_distance(Point &A, Point &B){
            return (B.x-A.x)*(B.x-A.x) + (B.y-A.y)*(B.y-A.y);
        }
};



#endif //ALGS_HPP