cmake_minimum_required(VERSION 3.6)
project(train_controller)

# Compiler
set(CMAKE_CXX_COMPILER g++)
set(CMAKE_CXX_STANDARD 20)

set(CMAKE_CXX_FLAGS "-Wno-psabi")


# Find & link libraries
set(CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}" ${CMAKE_MODULE_PATH})
find_package(PkgConfig REQUIRED)
pkg_check_modules(CAMERA REQUIRED libcamera)

find_library(LIBCAMERA_LIBRARY libcamera.so REQUIRED)
find_library(LIBCAMERA_BASE_LIBRARY libcamera-base.so REQUIRED)
find_package(OpenCV REQUIRED)

include_directories(. "${CAMERA_INCLUDE_DIRS}")
set(LIBCAMERA_LIBRARIES "${LIBCAMERA_LIBRARY}" "${LIBCAMERA_BASE_LIBRARY}")

find_package(nlohmann_json REQUIRED)
include_directories(${nlohmann_json_INCLUDE_DIRS})

# Source files
set(SOURCES
    algs.cpp 
    autoscan.cpp
    common.cpp 
    hw.cpp 
    ip.cpp
    main.cpp 
    memory.cpp
    network.cpp 
    pathfinding.cpp
    railstate.cpp 
    remote.cpp 
    cam.cpp
    connection_tester.cpp
)

# Executables
add_executable(RailController main.cpp algs.cpp ip.cpp common.cpp memory.cpp network.cpp hw.cpp railstate.cpp cam.cpp)
add_executable(Remote remote.cpp algs.cpp ip.cpp memory.cpp railstate.cpp network.cpp hw.cpp common.cpp)
add_executable(Autoscan autoscan.cpp ip.cpp)
add_executable(ConnectionTester connection_tester.cpp network.cpp common.cpp ip.cpp)

# Link libraries
target_link_libraries(RailController -lwiringPi -lpugixml -lrt -pthread "${LIBCAMERA_LIBRARIES}" ${OpenCV_LIBS})
target_link_libraries(Remote -lwiringPi -lpugixml -lrt -pthread ${OpenCV_LIBS} nlohmann_json::nlohmann_json)
target_link_libraries(ConnectionTester -lpugixml -lrt -pthread ${OpenCV_LIBS})