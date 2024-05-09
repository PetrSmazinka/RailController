#include "src/OV2640.h"
#include <WiFi.h>
#include <WebServer.h>
#include <WiFiClient.h>
#include <AsyncUDP.h>
#include "camera_pins.h"
#include "wifi_credentials.h"

#define DEBUG
#define BRIGHT_LED_PIN 4
#define LED_DIODE 12
#define IR_DIODE 13
#define DC_MOTOR_GND 14
#define DC_MOTOR_VCC 15
#define TC_RC_VERSION "TrainController remote v0.0.6"

#define IR_TRANSMISSION_SPEED_MS 40

#define UDP_PACKET_VALID_ID        0b00000001
#define UDP_PACKET_VALID_LED       0b00000010
#define UDP_PACKET_VALID_SPEED     0b00000100
#define UDP_PACKET_EMERGENCY_STOP  0b00000000
#define UDP_PACKET_ACK             0b01010101
#define UDP_PACKET_DISCOVERY_REPLY 0b10101010
#define UDP_PACKET_DISCOVERY_QUERY 0b11111111

uint8_t VEHICLE_ID = 0;
uint8_t VEHICLE_LED = 0;
int16_t VEHICLE_SPEED = 0;

OV2640 cam;

WebServer server(80);
AsyncUDP udp;
TaskHandle_t ir_transmit;

const char HEADER[]   = "HTTP/1.1 200 OK\r\n" \
                        "Access-Control-Allow-Origin: *\r\n" \
                        "Content-Type: multipart/x-mixed-replace; boundary=123456789000000000000987654321\r\n";
const char BOUNDARY[] = "\r\n--123456789000000000000987654321\r\n";
const char CTNTTYPE[] = "Content-Type: image/jpeg\r\nContent-Length: ";
const int hdrLen = strlen(HEADER);
const int bdrLen = strlen(BOUNDARY);
const int cntLen = strlen(CTNTTYPE);

struct TrainConfig{
    uint8_t id;
    uint8_t led;
    int16_t speed;
    uint8_t mask;
};

void transmit_digit(bool digit){
    digitalWrite(IR_DIODE, digit);
    delay(IR_TRANSMISSION_SPEED_MS);
}
void transmit_byte(uint8_t byte){
    bool parity=0;
    for(;byte;byte>>=1){
        transmit_digit(byte & 1);
        parity ^= (byte & 1);
    }
    transmit_digit(parity);
    transmit_digit(0);
}
void transmission_begin(){
    for(int i=0;i<9;i++){
        transmit_digit(1);
    }
    transmit_digit(0);
}
void transmit_code(){
    transmission_begin();
    transmit_byte(VEHICLE_ID);
}

void handle_jpg_stream(void){
    char buf[32];
    int s;

    WiFiClient client = server.client();

    client.write(HEADER, hdrLen);
    client.write(BOUNDARY, bdrLen);

    while (true){
        if (!client.connected()) break;
        cam.run();
        s = cam.getSize();
        client.write(CTNTTYPE, cntLen);
        sprintf( buf, "%d\r\n\r\n", s );
        client.write(buf, strlen(buf));
        client.write((char *)cam.getfb(), s);
        client.write(BOUNDARY, bdrLen);
    }
}

const char JHEADER[] =  "HTTP/1.1 200 OK\r\n" \
                        "Content-disposition: inline; filename=capture.jpg\r\n" \
                        "Content-type: image/jpeg\r\n\r\n";
const int jhdLen = strlen(JHEADER);

void handle_jpg(void){
    WiFiClient client = server.client();

    if (!client.connected()) return;
    cam.run();
    client.write(JHEADER, jhdLen);
    client.write((char *)cam.getfb(), cam.getSize());
}

const char VHEADER[] =  "HTTP/1.1 200 OK\r\n" \
                        "Access-Control-Allow-Origin: *\r\n" \
                        "Content-type: text/plain\r\n\r\n";
const int vhdLen = strlen(VHEADER);

void handle_version(void){
    WiFiClient client = server.client();

    if(!client.connected()) return;
    client.write(VHEADER, vhdLen);
    client.write(TC_RC_VERSION, strlen(TC_RC_VERSION));
}

void handleNotFound(){
    String message = "Server is running!\n\n";
    message += "URI: ";
    message += server.uri();
    message += "\nMethod: ";
    message += (server.method() == HTTP_GET) ? "GET" : "POST";
    message += "\nArguments: ";
    message += server.args();
    message += "\n";
    server.send(200, "text / plain", message);
}


void handle_udp_packet(AsyncUDPPacket packet){
    // Read received packet
    struct TrainConfig *config = (struct TrainConfig*)packet.data();
    #ifdef DEBUG
    Serial.println("Received packet. Id: " + String((int)config->id) + ", led: " + String((int)config->led) + ", speed: " + String((int)config->speed) + ", mask: " + String((int)config->mask));
    #endif
    // Check for special cases
    if((int)config->mask == UDP_PACKET_EMERGENCY_STOP){
        // Confirm packet
        struct TrainConfig reply = {
            .id = (VEHICLE_ID != (int)config->id) && ((int)config->mask & UDP_PACKET_VALID_ID),
            .led = (VEHICLE_LED != (int)config->led) && ((int)config->mask & UDP_PACKET_VALID_LED),
            .speed = (VEHICLE_SPEED != (int)config->speed) && ((int)config->mask & UDP_PACKET_VALID_SPEED),
            .mask = UDP_PACKET_ACK
        };
        udp.writeTo((uint8_t*)&reply, sizeof(reply), packet.remoteIP(), packet.remotePort());
        analogWrite(DC_MOTOR_VCC, 0);
        analogWrite(DC_MOTOR_GND, 0);
        digitalWrite(LED_DIODE, HIGH);
    }
    else if((int)config->mask == UDP_PACKET_DISCOVERY_QUERY){
        struct TrainConfig reply = {
            .id = VEHICLE_ID,
            .led = VEHICLE_LED,
            .speed = VEHICLE_SPEED,
            .mask = UDP_PACKET_DISCOVERY_REPLY
        };
        udp.writeTo((uint8_t*)&reply, sizeof(reply), packet.remoteIP(), packet.remotePort());
    }
    else{
        // Confirm packet
        struct TrainConfig reply = {
            .id = (VEHICLE_ID != (int)config->id) && ((int)config->mask & UDP_PACKET_VALID_ID),
            .led = (VEHICLE_LED != (int)config->led) && ((int)config->mask & UDP_PACKET_VALID_LED),
            .speed = (VEHICLE_SPEED != (int)config->speed) && ((int)config->mask & UDP_PACKET_VALID_SPEED),
            .mask = UDP_PACKET_ACK
        };
        udp.writeTo((uint8_t*)&reply, sizeof(reply), packet.remoteIP(), packet.remotePort());
        // Adjust camera to the settings
        if((int)config->mask & UDP_PACKET_VALID_ID){
            VEHICLE_ID = (int)config->id;
        }
        if((int)config->mask & UDP_PACKET_VALID_LED){
            int bright_led = std::max(0, std::min(255, (int)config->led));
            VEHICLE_LED = bright_led;
            analogWrite(BRIGHT_LED_PIN, bright_led);
        }
        if((int)config->mask & UDP_PACKET_VALID_SPEED){
            int speed = std::max(-255, std::min(255, (int)config->speed));
            VEHICLE_SPEED = speed;
            if(speed == 0){
                analogWrite(DC_MOTOR_VCC, 0);
                analogWrite(DC_MOTOR_GND, 0);
            }
            else if(speed > 0){
                analogWrite(DC_MOTOR_VCC, speed);
                analogWrite(DC_MOTOR_GND, 0);
            }
            else{
                analogWrite(DC_MOTOR_VCC, 0);
                analogWrite(DC_MOTOR_GND, -speed);
            }
        }      
    }
}

void Task_ir_transmission( void *pvParameters ){
  for(;;){
    transmit_code();
  } 
}
void setup(){

    Serial.begin(115200);
    //while (!Serial);            //wait for serial connection.
    Serial.println(TC_RC_VERSION " started");

    camera_config_t config;
    config.ledc_channel = LEDC_CHANNEL_0;
    config.ledc_timer = LEDC_TIMER_0;
    config.pin_d0 = Y2_GPIO_NUM;
    config.pin_d1 = Y3_GPIO_NUM;
    config.pin_d2 = Y4_GPIO_NUM;
    config.pin_d3 = Y5_GPIO_NUM;
    config.pin_d4 = Y6_GPIO_NUM;
    config.pin_d5 = Y7_GPIO_NUM;
    config.pin_d6 = Y8_GPIO_NUM;
    config.pin_d7 = Y9_GPIO_NUM;
    config.pin_xclk = XCLK_GPIO_NUM;
    config.pin_pclk = PCLK_GPIO_NUM;
    config.pin_vsync = VSYNC_GPIO_NUM;
    config.pin_href = HREF_GPIO_NUM;
    config.pin_sccb_sda = SIOD_GPIO_NUM;
    config.pin_sccb_scl = SIOC_GPIO_NUM;
    config.pin_pwdn = PWDN_GPIO_NUM;
    config.pin_reset = RESET_GPIO_NUM;
    config.xclk_freq_hz = 20000000;
    config.pixel_format = PIXFORMAT_JPEG;

    // Frame parameters
    //  config.frame_size = FRAMESIZE_UXGA;
    config.frame_size = FRAMESIZE_VGA;
    config.jpeg_quality = 12;
    config.fb_count = 2;

    pinMode(BRIGHT_LED_PIN, OUTPUT);
    pinMode(LED_DIODE, OUTPUT);
    pinMode(IR_DIODE, OUTPUT);
    pinMode(DC_MOTOR_VCC, OUTPUT);
    pinMode(DC_MOTOR_GND, OUTPUT);

    cam.init(config);

    IPAddress ip;

    WiFi.mode(WIFI_STA);
    WiFi.begin(SSID1, PWD1);
    while (WiFi.status() != WL_CONNECTED){
        delay(500);
        Serial.print(F("."));
    }
    ip = WiFi.localIP();
    Serial.println(F("WiFi connected"));
    Serial.println(ip);

    if(udp.listen(1111)){
        udp.onPacket(handle_udp_packet);
    }
    server.on("/stream", HTTP_GET, handle_jpg_stream);
    server.on("/jpg", HTTP_GET, handle_jpg);
    server.on("/_TC_VERSION", HTTP_GET, handle_version);
    server.onNotFound(handleNotFound);
    server.begin();

    xTaskCreatePinnedToCore(Task_ir_transmission, "IR_transmit", 10000, NULL, 1, &ir_transmit, 0);

}
void loop(){
    server.handleClient();
}