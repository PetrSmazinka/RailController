#include <thread>
#include <functional>

#include "main.hpp"
#include "cam.hpp"

//#define SHOW_VISUAL_OUTPUT // for prinitng window with detected movement
//#define TEST_VISUAL_OUTPUT // for debugging movement detection

extern bool PROGRAM_RUNNING;

void sighandler(int s){
    PROGRAM_RUNNING = false;
}
bool file_exists(const std::string &file){
    struct stat buff;
    return (stat(file.c_str(), &buff) == 0);
}
int main(int argc, char *argv[]){
    signal(SIGINT, sighandler);

    ProgramMode mode = ProgramMode::NORMAL;
    if(argc >= 2 && std::string(argv[1]) == "--take-picture"){
        mode = ProgramMode::CAPTURE;
    }
    // Init camera
    Cam cam;
    libcamera::ControlList controls;
    #ifdef SHOW_VISUAL_OUTPUT
        time_t start_time = time(0);
        uint16_t true_fps = 0;
        int keyPressed;
    #endif
    uint16_t desired_fps = 120;
    uint32_t width = 1280;
    uint32_t height = 720;
    uint32_t stride;
    int64_t frame_duration = FPS2TIME(desired_fps);
    FrameData frameData;

    #ifdef SHOW_VISUAL_OUTPUT
        cv::namedWindow("CAM preview", cv::WINDOW_FULLSCREEN);
    #endif

    REQUIRE(cam.init(), 2);
    REQUIRE(cam.config(width, height, libcamera::formats::RGB888, 1), 3);
    controls.set(libcamera::controls::FrameDurationLimits, libcamera::Span<const int64_t, 2>({ frame_duration, frame_duration }));
    controls.set(libcamera::controls::Brightness, 0.1);
    controls.set(libcamera::controls::Contrast, 1);
    controls.set(libcamera::controls::ExposureTime, 599998);
    controls.set(libcamera::controls::AfMode, libcamera::controls::AfModeAuto);
    cam.set(controls);

    cam.start();
    cam.VideoStream(&width, &height, &stride);

    // if run in capture mode, only take a picture and close program
    if(mode == ProgramMode::CAPTURE){
        int frames = 0;
        while(true){
            if(!cam.readFrame(&frameData)){
                continue;
            }
            cv::Mat img(height, width, CV_8UC3, frameData.imageData, stride);
            // wait 30 frames for autofocus
            if(frames == 30){
                bool saved;
                if(argc >= 3){ // if filename is provided, use it
                    saved = cv::imwrite(argv[2], img);
                }
                else{
                    saved = cv::imwrite(JPG_FILE, img);
                }
                cam.returnFrameBuffer(frameData);
                cv::destroyAllWindows();
                cam.stopCamera();
                cam.closeCamera();
                return !saved;
            }
            cam.returnFrameBuffer(frameData);
            frames++;
        }
    }
    REQUIRE(file_exists(XML_FILE), 1);
    // Init data structures
    ServerMemory memory;
    auto rs = RailState(&memory);
    rs.set_resolution(1280, 720);
    rs.load_map(XML_FILE);
    rs.config_pins();
    rs.init_switches();
    rs.init_semaphores();
    rs.set_trains_id();
    rs.state_update();
    #ifdef TEST_VISUAL_OUTPUT
        for(auto &train : rs.trains){
            train.second.is_moving = true;
        }
    #endif
    rs.update_memory();
    // Init computing algorithms
    Algs algs(rs);
    rs.link_algs(algs);

    // if run in normal mode, init structures for movement detection
    auto backsub = cv::createBackgroundSubtractorMOG2(100, 16.0, true);
    auto fgMaskData = new uint8_t[width*height*3];
    cv::Mat fg_mask(height, width, CV_8UC3, fgMaskData, stride);

    // Main loop, should run until C-c
    while(true){
        if(!cam.readFrame(&frameData)){
            continue;
        }
        // detect movement and identify points of movement
        cv::Mat img_captured(height, width, CV_8UC3, frameData.imageData, stride);
        backsub->apply(img_captured, fg_mask);

        cv::threshold(fg_mask, fg_mask, 180, 255, cv::THRESH_BINARY);

        auto kernel = cv::getStructuringElement(cv::MORPH_ELLIPSE, cv::Size(3, 3));
        cv::morphologyEx(fg_mask, fg_mask, cv::MORPH_OPEN, kernel);
        
        std::vector<std::vector<cv::Point>> contours;
        std::vector<cv::Vec4i> hierarchy;
        cv::findContours(fg_mask, contours, hierarchy, cv::RETR_EXTERNAL, cv::CHAIN_APPROX_SIMPLE);

        double minContourArea = 250;
        std::vector<std::vector<cv::Point>> largeContours;
        for (const auto& cnt : contours) {
            double area = cv::contourArea(cnt);
            if (area > minContourArea) {
                largeContours.push_back(cnt);
            }
        }
        #ifdef SHOW_VISUAL_OUTPUT
            cv::Mat frameOut = img_captured.clone();
        #endif

        // read messages from client
        rs.read_messages();
        // when exception occurs, catch it and perform EMERGENCY_STOP
        try{
            // based on points of movement, identify trains
            rs.trains_new_iteration();
            for (const auto& cnt : largeContours) {
                cv::Rect rect = cv::boundingRect(cnt);
                #ifdef SHOW_VISUAL_OUTPUT
                    cv::rectangle(frameOut, rect, cv::Scalar(0, 255, 0));
                #endif
                int centerX = rect.x + rect.width / 2;
                int centerY = rect.y + rect.height / 2;
                rs.train_at_track(Point(centerX, centerY));
            }
            rs.trains_search();

            // update data structures in shared memory, so web interface may display actual data
            rs.update_memory();
            // serve train movement requests
            rs.handle_queries();
        }
        catch(...){
            rs.runtime_error();
        }

        #ifdef SHOW_VISUAL_OUTPUT
            // print visual output with occupied tracks, with detected points of movement
            cv::Scalar color_red = cv::Scalar(0, 0, 200);
            cv::Scalar color_blue = cv::Scalar(255, 0, 0);
            for(auto track : rs.tracks){
                cv::line(frameOut, rs.line_segments.at(track.first).start, rs.line_segments.at(track.first).end, track.second.occupied_by_train.is_set() ? color_red : color_blue, 3);
            }

            cv::imshow("CAM preview", frameOut);
            keyPressed = cv::waitKey(1);
            if(keyPressed == 'q'){
                break;
            }        

            true_fps++;
            if((time(0) - start_time) >=1){
                std::cout << "fps: " << true_fps << std::endl;
                true_fps = 0;
                start_time = time(0);
            }
        #endif
        cam.returnFrameBuffer(frameData);
        if(!PROGRAM_RUNNING){
            break;
        }
    }
    delete fgMaskData;
    cv::destroyAllWindows();
    cam.stopCamera();
    cam.closeCamera();

    WAIT_UNTIL(PROGRAM_RUNNING);
    
}