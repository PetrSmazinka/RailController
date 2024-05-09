#ifndef HW_HPP
#define HW_HPP

#include <fstream>
#include <wiringPi.h>
#include "common.hpp"

class HW{
    public:
        static void config_pins(const std::map<SwitchID, Switch> &switches, const std::map<SemaphoreID, Semaphore> &semaphores);
        static void set_switch_state(Switch &swicthR, const SwitchState state);
        static void set_semaphore_state(Semaphore &semaphore, const SemaphoreState state);
        static void release_pins(const std::map<SwitchID, Switch> &switches, const std::map<SemaphoreID, Semaphore> &semaphores);
};

#endif
