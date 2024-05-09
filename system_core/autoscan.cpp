#include "autoscan.hpp"

#define TC_RC_VERSION "TrainController remote v([0-9]+\\.[0-9]+\\.[0-9]+)"

#define IS_TRAIN "curl --connect-time 500 -m 5 %s/_TC_VERSION 2>/dev/null"
#define IP_addr_and_mask "ifconfig | grep \"inet \" | awk '{if($2!=\"127.0.0.1\"){print}}' | awk '{printf($2); printf(\" \"); printf($4)}'"

std::mutex mtx;

std::string exec(const char* cmd) {
    FILE* pipe = popen(cmd, "r");
    std::string result = "";
    char buffer[128];
    if (!pipe) {
        return "ERROR";
    }
    while (!feof(pipe)) {
        if (fgets(buffer, 128, pipe) != NULL) {
            result += buffer;
        }
    }
    pclose(pipe);
    return result;
}

void discover_ip_range(IP_address from, IP_address to, std::set<IP_address> &trains){
    std::regex rex(TC_RC_VERSION);
    for(IP_address tmp = from; tmp<to; tmp++){
        char command[52];
        sprintf(command, IS_TRAIN, ip_get_string(tmp).c_str());
        std::string response = exec(command);

        if(std::regex_match(response, rex)){
            {
                std::lock_guard<std::mutex> lock(mtx);
                trains.insert(tmp);
            }
        }
    }
}

int main(int argc , char *argv[]) {
    // Analyze network
    std::string ip_adresses = exec(IP_addr_and_mask);
    std::stringstream ip_string(ip_adresses);

    std::string token; 
    std::vector<std::string> tokens; 
    char delimiter = ' '; 
  
    while (getline(ip_string, token, delimiter)) { 
        tokens.push_back(token); 
    }
    IP_address dev_addr = ip(tokens.at(0).c_str());
    IP_address net_mask = ip(tokens.at(1).c_str());

    int prefix = ip_prefix(net_mask);
    IP_address net_addr = ip_netaddr(dev_addr, prefix);
    IP_address broad_addr = ip_broadaddr(dev_addr, prefix);
    IP_devices ip_devices = ip_count_devs(net_addr, broad_addr);

    net_addr++; //skip network address
    std::set<IP_address> trains;

    IP_address A = net_addr + ip_devices/4;
    IP_address B = net_addr + ip_devices/2;
    IP_address C = net_addr + ip_devices*3/4;

    auto t1 = std::thread(discover_ip_range, net_addr, A, std::ref(trains));
    auto t2 = std::thread(discover_ip_range, A, B, std::ref(trains));
    auto t3 = std::thread(discover_ip_range, B, C, std::ref(trains));
    discover_ip_range(C, broad_addr, trains);

    t1.join();
    t2.join();
    t3.join();

    FILE* output = fopen("train_list.txt", "w");
    if(output == NULL){
        printf("ERROR");
        fflush(stdin);
        return 1;
    }
    std::time_t now = std::time(nullptr);
    char time_buffer[80];
    std::strftime(time_buffer, sizeof(time_buffer), "%Y-%m-%d %H:%M:%S", std::localtime(&now));
    fprintf(output, "%s\n", time_buffer);
    for(auto train : trains){
        fprintf(output, "%s ", ip_get_string(train).c_str());
    }
    fprintf(output, "\n");
    fclose(output);
    printf("OK");
    fflush(stdin);
    return 0;
}