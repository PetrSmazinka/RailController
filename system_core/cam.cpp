#include "cam.hpp"

using namespace std::placeholders;

bool Cam::init(){
    this->_camera_ptr = std::make_unique<libcamera::CameraManager>();
    if(this->_camera_ptr->start()){
        return false;
    }
    this->_camera_id = this->_camera_ptr->cameras()[0]->id();
    this->_camera = this->_camera_ptr->get(this->_camera_id);
    if(!this->_camera){
        return false;
    }
    if(this->_camera->acquire()){
        return false;
    }
    this->_camera_acquired = true;
    return true;
}

bool Cam::config(int width, int height, libcamera::PixelFormat format, int buffercount){
    libcamera::Size size(width, height);
    this->_config = this->_camera->generateConfiguration({ libcamera::StreamRole::VideoRecording });
    this->_config->at(0).size = size;
    this->_config->at(0).pixelFormat = format;
    this->_config->at(0).bufferCount = buffercount;
    libcamera::CameraConfiguration::Status validation = this->_config->validate();
	if(validation == libcamera::CameraConfiguration::Adjusted){
        return true;
    }
    return false;
}

bool Cam::start(){
    unsigned int buffers_count = UINT_MAX;
    int result;
    result = this->_camera->configure(this->_config.get());
    if(result < 0){
        return false;
    }
    this->_camera->requestCompleted.connect(this, &Cam::requestCompleted);
    this->_framebufferAllocator = std::make_unique<libcamera::FrameBufferAllocator>(this->_camera);
    for(libcamera::StreamConfiguration &cfg : *this->_config){
        result = this->_framebufferAllocator->allocate(cfg.stream());
        if(result < 0){
            return false;
        }
        unsigned int allocated = this->_framebufferAllocator->buffers(cfg.stream()).size();
        buffers_count = std::min(allocated, buffers_count);
    }
    for(unsigned int i = 0; i < buffers_count; i++){
        std::unique_ptr<libcamera::Request> request = this->_camera->createRequest();
        if(!request) {
            return false;
        }
        for(libcamera::StreamConfiguration &cfg : *this->_config){
            libcamera::Stream *stream = cfg.stream();
            const std::vector<std::unique_ptr<libcamera::FrameBuffer>> &buffers = this->_framebufferAllocator->buffers(stream);
            const std::unique_ptr<libcamera::FrameBuffer> &buffer = buffers[i];
            result = request->addBuffer(stream, buffer.get());
            if(result < 0){
                return false;
            }
            for(const libcamera::FrameBuffer::Plane &plane : buffer->planes()){
                int fd = plane.fd.get();
                void *memory = mmap(NULL, plane.length, PROT_READ, MAP_SHARED, fd, 0);
                this->_bufferMap[fd] = std::make_pair(memory, plane.length);
            }
        }
        this->_requestVector.push_back(std::move(request));
    }
    result = this->_camera->start(&this->_controlList);
    if(result){
        return false;
    }
    this->_controlList.clear();
    this->_camera_started = true;
    for(std::unique_ptr<libcamera::Request> &request : this->_requestVector){
        result = queueRequest(request.get());
        if(result < 0){
            this->_camera->stop();
            return false;
        }
    }
    this->_viewfinder_stream = this->_config->at(0).stream();
    return true;
}

 void Cam::VideoStream(uint32_t *width, uint32_t *height, uint32_t *stride) const {
    libcamera::StreamConfiguration const &cfg = this->_viewfinder_stream->configuration();
	*width = cfg.size.width;
	*height = cfg.size.height;
	*stride = cfg.stride;
}

int Cam::queueRequest(libcamera::Request *request){
    std::lock_guard<std::mutex> stop_lock(this->_camera_stop_mutex);
    if(!this->_camera_started){
        return -1;
    }
    {
        std::lock_guard<std::mutex> lock(this->_control_mutex);
        request->controls() = std::move(this->_controlList);
    }
    return this->_camera->queueRequest(request);
}

void Cam::requestCompleted(libcamera::Request *request){
    if(request->status() == libcamera::Request::RequestCancelled){
        return;
    }
    this->_requestQueue.push(request);
}

void Cam::returnFrameBuffer(FrameData frameData) {
    uint64_t request = frameData.request;
    libcamera::Request * req = (libcamera::Request *)request;
    req->reuse(libcamera::Request::ReuseBuffers);
    this->queueRequest(req);
}

bool Cam::readFrame(FrameData *frameData){
    std::lock_guard<std::mutex> lock(this->_free_requests_mutex);
    if(!this->_requestQueue.empty()){
        libcamera::Request *request = this->_requestQueue.front();
        const libcamera::Request::BufferMap &buffers = request->buffers();
        for(auto it = buffers.begin(); it != buffers.end(); ++it) {
            libcamera::FrameBuffer *buffer = it->second;
            const libcamera::FrameBuffer::Plane &plane = buffer->planes()[0];
            const libcamera::FrameMetadata::Plane &meta = buffer->metadata().planes()[0];
            void *data = this->_bufferMap[plane.fd.get()].first;
            int length = std::min(meta.bytesused, plane.length);
            frameData->size = length;
            frameData->imageData = (uint8_t *)data;
        }
        this->_requestQueue.pop();
        frameData->request = (uint64_t)request;
        return true;
    }
    else{
        libcamera::Request *request = nullptr;
        frameData->request = (uint64_t)request;
        return false;
    }
}

void Cam::set(libcamera::ControlList controls){
    std::lock_guard<std::mutex> lock(this->_control_mutex);
	this->_controlList = std::move(controls);
}

void Cam::stopCamera(){
    if (this->_camera){
        {
            std::lock_guard<std::mutex> lock(this->_camera_stop_mutex);
            if(this->_camera_started){
                if(this->_camera->stop()){
                    return;
                }
                this->_camera_started = false;
            }
        }
        this->_camera->requestCompleted.disconnect(this, &Cam::requestCompleted);
    }
    while(!this->_requestQueue.empty()){
        this->_requestQueue.pop();
    }
    for(auto &iter : this->_bufferMap){
        std::pair<void *, unsigned int> pair = iter.second;
		munmap(std::get<0>(pair), std::get<1>(pair));
	}
    this->_bufferMap.clear();
    this->_requestVector.clear();
    this->_framebufferAllocator.reset();
    this->_controlList.clear();
}

void Cam::closeCamera(){
    if(this->_camera_acquired){
        this->_camera->release();
    }
    this->_camera_acquired = false;
    this->_camera.reset();
    this->_camera_ptr.reset();
}
