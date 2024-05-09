#include "hw.hpp"

void HW::config_pins(const std::map<SwitchID, Switch> &switches, const std::map<SemaphoreID, Semaphore> &semaphores){
    if (wiringPiSetupGpio() == -1) {
        std::cerr << "Failed to initialize WiringPi library" << std::endl;
    }
    for(auto switchR : switches){
        pinMode(switchR.second.pin, OUTPUT);
    }
    for(auto semaphore : semaphores){
        pinMode(semaphore.second.lspin, OUTPUT);
        pinMode(semaphore.second.mspin, OUTPUT);
    }
}

void HW::set_switch_state(Switch &switchR, const SwitchState state){
    bool gpio_state = !static_cast<bool>(state); //GND = D, VCC = S
    digitalWrite(switchR.pin, gpio_state);
    switchR.state = state;
}

void HW::set_semaphore_state(Semaphore &semaphore, const SemaphoreState state){
    uint8_t gpio_state = static_cast<uint8_t>(state);
    digitalWrite(semaphore.lspin, gpio_state & LSPIN_MASK);
    digitalWrite(semaphore.mspin, gpio_state & MSPIN_MASK);
    semaphore.state = state;
}

void HW::release_pins(const std::map<SwitchID, Switch> &switches, const std::map<SemaphoreID, Semaphore> &semaphores){
    for(auto switchR : switches){
        digitalWrite(switchR.second.pin, LOW);
        pinMode(switchR.second.pin, INPUT);
    }
    for(auto semaphore : semaphores){
        digitalWrite(semaphore.second.lspin, LOW);
        digitalWrite(semaphore.second.mspin, LOW);
        pinMode(semaphore.second.lspin, INPUT);
        pinMode(semaphore.second.mspin, INPUT);
    }
}
