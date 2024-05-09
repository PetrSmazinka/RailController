#ifndef CAM_HPP
#define CAM_HPP

#include <atomic>
#include <iomanip>
#include <iostream>
#include <signal.h>
#include <limits.h>
#include <memory>
#include <stdint.h>
#include <string>
#include <vector>
#include <unordered_map>
#include <queue>
#include <sstream>
#include <sys/mman.h>
#include <unistd.h>
#include <time.h>
#include <mutex>

#include <libcamera/controls.h>
#include <libcamera/control_ids.h>
#include <libcamera/property_ids.h>
#include <libcamera/libcamera.h>
#include <libcamera/camera.h>
#include <libcamera/camera_manager.h>
#include <libcamera/framebuffer_allocator.h>
#include <libcamera/request.h>
#include <libcamera/stream.h>
#include <libcamera/formats.h>
#include <libcamera/transform.h>

//using namespace libcamera;

typedef struct {
    uint8_t *imageData;
    uint32_t size;
    uint64_t request;
} FrameData;

class Cam {
    public:
        Cam(){};
        ~Cam(){};
        
        bool init();
        bool config(int width, int height, libcamera::PixelFormat format, int buffercount);
        bool start();
        bool readFrame(FrameData *frameData);
        void returnFrameBuffer(FrameData frameData);

        void set(libcamera::ControlList controls);
        void stopCamera();
        void closeCamera();

        void VideoStream(uint32_t *width, uint32_t *height, uint32_t *stride) const;

    private:
        int queueRequest(libcamera::Request *request);
        void requestCompleted(libcamera::Request *request);

        std::unique_ptr<libcamera::CameraManager> _camera_ptr;
        std::string _camera_id;
        std::shared_ptr<libcamera::Camera> _camera;
        bool _camera_acquired = false;
        std::unique_ptr<libcamera::CameraConfiguration> _config;
        std::unique_ptr<libcamera::FrameBufferAllocator> _framebufferAllocator;
        std::map<int, std::pair<void *, unsigned int>> _bufferMap;
        std::vector<std::unique_ptr<libcamera::Request>> _requestVector;
        libcamera::ControlList _controlList;
        bool _camera_started = false;
        libcamera::Stream *_viewfinder_stream = nullptr;
        std::queue<libcamera::Request *> _requestQueue;

        std::mutex _control_mutex;
        std::mutex _camera_stop_mutex;
        std::mutex _free_requests_mutex;
};


#endif