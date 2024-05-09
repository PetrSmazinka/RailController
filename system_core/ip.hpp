/**
 * @file ip.hpp
 * 
 * @brief Header file of function and classes working with IP addresses
 * @author Petr Smažinka (xsmazi00)
 */
#ifndef IP_H
#define IP_H

#include <string>
#include <cstdint>
#include <regex>
#include <set>

using IP_address = uint32_t;
using IP_devices = uint64_t;


/**
 * This inline function takes four integers representing the octets of an IP address and returns the
 * corresponding IP address as a single integer.
 * 
 * @param a The parameter "a" represents the first octet of the IP address.
 * @param b The parameter "b" represents the second octet of an IP address.
 * @param c The parameter "c" represents the third octet of an IP address.
 * @param d The parameter "d" represents the fourth octet of the IP address.
 * 
 * @return an IP address of type IP_address
 */
inline IP_address ip(int a, int b, int c, int d){
    return (((a & ~(~0 << 8)) << 24)|((b & ~(~0 << 8)) << 16)|((c & ~(~0 << 8)) << 8)|(d & ~(~0 << 8)));
}

/**
 * This inline function returns the input IP address.
 * 
 * @param addr The parameter "addr" is of type IP_address, which represents an IP address.
 * 
 * @return The IP address that is passed as an argument to the function.
 */
inline IP_address ip(IP_address addr){
    return addr;
}

inline IP_address ip(const char *addr){
    int a, b, c, d;
    sscanf(addr, "%d.%d.%d.%d", &a, &b, &c, &d);
    return ip(a, b, c, d);
}

/**
 * This inline function takes two IP addresses as input and assigns the value of the second address to the
 * first address.
 * 
 * @param addr1 IP address to be changed
 * @param addr2 IP address which will be asigned to the first IP address
 * 
 * @return newly assigned IP address
 */
inline IP_address ip(IP_address &addr1, IP_address addr2){
    return addr1 = addr2;
}

/**
 * This inline function extracts the first octet of an IP address.
 * 
 * @param addr IP address
 * 
 * @return the first octet of the IP address.
 */
inline IP_address ip_get_a(IP_address addr){
    return ((addr >> 24) & ~(~0 << 8)) ;
}

/**
 * This inline function extracts the second octet of an IP address.
 * 
 * @param addr IP address
 * 
 * @return the second octet of the IP address.
 */
inline IP_address ip_get_b(IP_address addr){
    return ((addr >> 16) & ~(~0 << 8)) ;
}

/**
 * This inline function extracts the third octet of an IP address.
 * 
 * @param addr IP address
 * 
 * @return the third octet of the IP address.
 */
inline IP_address ip_get_c(IP_address addr){
    return ((addr >> 8) & ~(~0 << 8)) ;
}

/**
 * This inline function extracts the fourth octet of an IP address.
 * 
 * @param addr IP address
 * 
 * @return the fourth octet of the IP address.
 */
inline IP_address ip_get_d(IP_address addr){
    return (addr & ~(~0 << 8)) ;
}

/**
 * This inline function takes an IP address and returns it as a string in the format "a.b.c.d".
 * 
 * @param addr IP address
 * 
 * @return string representation of input IP address
 */
inline std::string ip_get_string(IP_address addr){
    return std::to_string(ip_get_a(addr)) + "." + std::to_string(ip_get_b(addr)) + "." + std::to_string(ip_get_c(addr)) + "." + std::to_string(ip_get_d(addr));
}

/**
 * This inline function returns an IP network mask based on the given prefix length.
 * 
 * @param prefix number of bits in the network mask (0-32)
 * 
 * @return IP network mask
 */
inline IP_address ip_mask(int prefix){
    return (prefix == 0 ? 0 : (~0) << (32-prefix));
}

/**
 * This inline function returns a prexis based on the given IP network mask length.
 * 
 * @param ip IP network mask
 * 
 * @return number of bits in the network mask (0-32)
 */
inline int ip_prefix(IP_address ip){
    int one_bits=0;
    while(ip){
        one_bits += ip & 1;
        ip >>= 1;
    }
    return one_bits;
}

/**
 * This function takes an IP address and a prefix length and returns the network address.
 * 
 * @param addr IP address
 * @param prefix IP prefix
 * 
 * @return the network address of the given IP address and prefix length.
 */
inline IP_address ip_netaddr(IP_address addr, int prefix){
    return (prefix == 0 ? 0 : (addr & (~0 << (32-prefix))));
}

/**
 * This function takes an IP address and a prefix length and returns the broadcast address.
 * 
 * @param addr IP address
 * @param prefix IP prefix
 * 
 * @return the broadcast address of the given IP address and prefix length.
 */
inline IP_address ip_broadaddr(IP_address addr, int prefix){
    return (prefix == 0 ? ~0 : (addr & (~0 << (32-prefix))) | ~(~0 << (32-prefix)));   
}

/**
 * This inline function calculates the number of IP addresses between two given IP addresses.
 * 
 * @param addr1 IP address
 * @param addr2 IP address
 * 
 * @return the number of IP addresses between the two given IP addresses, including the addresses
 * themselves.
 */
inline IP_devices ip_count_addr(IP_address addr1, IP_address addr2){
    return (std::max(addr1, addr2) - std::min(addr1, addr2) + 1UL );
}

/**
 * This inline function calculates the number of devices between two IP addresses.
 * 
 * @param addr1 IP address
 * @param addr2 IP address
 * 
 * @return the count of IP devices between two given IP addresses.
 */
inline IP_devices ip_count_devs(IP_address addr1, IP_address addr2){
    return ((std::max(addr1, addr2) - std::min(addr1, addr2)) > 0 ? (std::max(addr1, addr2) - std::min(addr1, addr2) -1UL) : 0 );
}

/**
 * This function calculates the difference between two IP addresses.
 * 
 * @param addr1 IP address
 * @param addr2 IP address
 * 
 * @return difference between two given IP addresses
 */
inline IP_devices ip_diff(IP_address addr1, IP_address addr2){
    return (std::max(addr1, addr2) - std::min(addr1, addr2));
}

/**
 * This inline function takes four integers representing the octets of an IP address and returns the
 * corresponding IP address as a single integer. This IP address is also assigned to parameter addr
 * 
 * @param addr variable of type IP_address to be assigned in
 * @param a The parameter "a" represents the first octet of the IP address.
 * @param b The parameter "b" represents the second octet of an IP address.
 * @param c The parameter "c" represents the third octet of an IP address.
 * @param d The parameter "d" represents the fourth octet of the IP address.
 * 
 * @return an IP address of type IP_address
 */
inline IP_address ip_set(IP_address &addr, int a, int b, int c, int d){
    return addr = ip(a, b, c, d);
}

/**
 * This inline function sets the first octet of an IP address to a specified value.
 * 
 * @param addr variable of type IP_address to be assigned in
 * @param a The parameter "a" is an integer representing the first octet of an IP address.
 * 
 * @return The IP address `addr` after setting the first octet to the value `a`.
 */
inline IP_address ip_set_a(IP_address &addr, int a){
    return addr = ip(a, ip_get_b(addr), ip_get_c(addr), ip_get_d(addr));
}

/**
 * This inline function sets the second octet of an IP address to a specified value.
 * 
 * @param addr variable of type IP_address to be assigned in
 * @param b The parameter "b" is an integer representing the second octet of an IP address.
 * 
 * @return The IP address `addr` after setting the second octet to the value `b`.
 */
inline IP_address ip_set_b(IP_address &addr, int b){
    return addr = ip(ip_get_a(addr), b, ip_get_c(addr), ip_get_d(addr));
}

/**
 * This inline function sets the third octet of an IP address to a specified value.
 * 
 * @param addr variable of type IP_address to be assigned in
 * @param c The parameter "c" is an integer representing the third octet of an IP address.
 * 
 * @return The IP address `addr` after setting the third octet to the value `c`.
 */
inline IP_address ip_set_c(IP_address &addr, int c){
    return addr = ip(ip_get_a(addr), ip_get_b(addr), c, ip_get_d(addr));
}

/**
 * This inline function sets the fourth octet of an IP address to a specified value.
 * 
 * @param addr variable of type IP_address to be assigned in
 * @param d The parameter "d" is an integer representing the fourth octet of an IP address.
 * 
 * @return The IP address `addr` after setting the fourth octet to the value `d`.
 */
inline IP_address ip_set_d(IP_address &addr, int d){
    return addr = ip(ip_get_a(addr), ip_get_b(addr), ip_get_c(addr), d);
}

/**
 * This inline function sets the value of a string variable to the string representation of an
 * IP address.
 * 
 * @param str a reference to a string that will be updated
 * @param addr IP address
 * 
 * @return the updated value of the string
 */
inline std::string ip_set_string(std::string &str, IP_address addr){
    return str = ip_get_string(addr);
}

/**
 * This inline function sets the subnet mask of an IP address based on a given prefix length.
 * 
 * @param addr IP address
 * @param prefix IP prefix
 * 
 * @return IP subnet mask
 */
inline IP_address ip_set_mask(IP_address &addr, int prefix){
    return addr = ip_mask(prefix);
}

/**
 * This inline function sets the IP network address based on a given IP address and prefix length.
 * 
 * @param naddr reference to a variable with the result
 * @param addr IP address
 * @param prefix IP prefix
 * 
 * @return IP network address
 */
inline IP_address ip_set_netaddr(IP_address &naddr, IP_address addr, int prefix){
    return naddr = ip_netaddr(addr, prefix);
}

/**
 * This inline function sets the IP broadcast address based on a given IP address and prefix length.
 * 
 * @param baddr reference to a variable with the result
 * @param addr IP address
 * @param prefix IP prefix
 * 
 * @return IP network address
 */
inline IP_address ip_set_broadaddr(IP_address &baddr, IP_address addr, int prefix){
    return baddr = ip_broadaddr(addr, prefix);
}

/**
 * This inline function sets the value of the "counter" variable
 * to the number of IP addresses between two given IP addresses.
 * 
 * @param counter reference to a variable with the result
 * @param addr1 IP address
 * @param addr2 IP address
 * 
 * @return the number of IP addresses between the two given IP addresses, including the addresses
 * themselves.
 */
inline IP_devices ip_set_count_addr(IP_devices &counter, IP_address addr1, IP_address addr2){
    return counter = ip_count_addr(addr1, addr2);
}

/**
 * This inline function sets the value of the "counter" variable
 * to the number of devices between two given IP addresses.
 * 
 * @param counter reference to a variable with the result
 * @param addr1 IP address
 * @param addr2 IP address
 * 
 * @return the count of IP devices between two given IP addresses.
 */
inline IP_devices ip_set_count_devs(IP_devices &counter, IP_address addr1, IP_address addr2){
    return counter = ip_count_devs(addr1, addr2);
}

/**
 * This inline function sets the value of the "counter" variable
 * to the difference of two given IP addresses
 * 
 * @param counter reference to a variable with the result
 * @param addr1 IP address
 * @param addr2 IP address
 * 
 * @return difference between two given IP addresses.
 */
inline IP_devices ip_set_diff(IP_devices &counter, IP_address addr1, IP_address addr2){
    return counter = ip_diff(addr1, addr2);
}


#endif // IP_H