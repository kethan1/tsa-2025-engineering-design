/*********
  Firebase code taken from https://RandomNerdTutorials.com/esp32-firebase-realtime-database/
*********/

#include<Arduino.h>
#include <FirebaseClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

#include "secrets.h"

// User function
void processData(AsyncResult &aResult);

// Authentication
UserAuth user_auth(Web_API_KEY, USER_EMAIL, USER_PASS);

// Firebase components
FirebaseApp app;
WiFiClientSecure ssl_client;
using AsyncClient = AsyncClientClass;
AsyncClient aClient(ssl_client);
RealtimeDatabase Database;

// DE high = driver enabled, RE low = receiver enabled
#define RS485_DE_PIN 5  // DE
#define RS485_RE_PIN 4  // /RE (active low)
#define RX2_PIN 16      // RO → ESP32
#define TX2_PIN 17      // DI ← ESP32

const uint8_t SLAVE_ID = 0x01;      // sensor address
const uint16_t START_REG = 0x001E;  // first register = Nitrogen (0x001E)
const uint16_t NUM_REGS = 3;        // read N, P, K in one frame
const uint32_t TIMEOUT = 500;       // ms to wait for full reply

struct SensorData {
    // units are mg/kg
    bool valid;
    uint16_t nitrogen;
    uint16_t phosphorus;
    uint16_t potassium;
};

uint16_t calcCRC(const uint8_t *data, size_t len) {
    uint16_t crc = 0xFFFF;
    for (size_t i = 0; i < len; i++) {
        crc ^= data[i];
        for (uint8_t b = 0; b < 8; b++) {
            if (crc & 1) {
                crc = (crc >> 1) ^ 0xA001;
            } else {
                crc = (crc >> 1);
            }
        }
    }
    return crc;
}

void WiFiStationConnected(WiFiEvent_t event, WiFiEventInfo_t info) {
    Serial.println("Connected to AP successfully!");
}

void WiFiGotIP(WiFiEvent_t event, WiFiEventInfo_t info) {
    Serial.println("WiFi connected");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());
}

void WiFiStationDisconnected(WiFiEvent_t event, WiFiEventInfo_t info) {
    Serial.println("Disconnected from WiFi access point");
    Serial.print("WiFi lost connection. Reason: ");
    Serial.println(info.wifi_sta_disconnected.reason);
    Serial.println("Trying to Reconnect");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

void preTransmit() {
    digitalWrite(RS485_RE_PIN, HIGH);  // disable receiver
    digitalWrite(RS485_DE_PIN, HIGH);  // enable driver
    delayMicroseconds(100);
}
void postTransmit() {
    digitalWrite(RS485_DE_PIN, LOW);  // disable driver
    digitalWrite(RS485_RE_PIN, LOW);  // enable receiver
    delayMicroseconds(100);
}

void setup() {
    Serial.begin(115200);

    // Connect to Wi-Fi
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    WiFi.onEvent(WiFiStationConnected, WiFiEvent_t::ARDUINO_EVENT_WIFI_STA_CONNECTED);
    WiFi.onEvent(WiFiGotIP, WiFiEvent_t::ARDUINO_EVENT_WIFI_STA_GOT_IP);
    WiFi.onEvent(WiFiStationDisconnected, WiFiEvent_t::ARDUINO_EVENT_WIFI_STA_DISCONNECTED);

    Serial.print("Connecting to Wi-Fi");
    while (WiFi.status() != WL_CONNECTED) {
        Serial.print(".");
        delay(300);
    }
    Serial.println();

    // Configure SSL client
    ssl_client.setInsecure();
    ssl_client.setHandshakeTimeout(5);  // Handshake timeout in seconds
    ssl_client.setTimeout(1000);        // ✅ Connection timeout in milliseconds

    // Initialize Firebase
    initializeApp(aClient, app, getAuth(user_auth), processData, "🔐 authTask");
    app.getApp<RealtimeDatabase>(Database);
    Database.url(DATABASE_URL);

    pinMode(RS485_DE_PIN, OUTPUT);
    pinMode(RS485_RE_PIN, OUTPUT);

    postTransmit();  // start in receive

    // 9600 baud, 8 data bits, NO parity, 1 stop bit
    Serial2.begin(9600, SERIAL_8N1, RX2_PIN, TX2_PIN);

    Serial.println("Starting Soil Nutrient Modbus Interface…");
}

void writeRequest() {
    // 1) Build request [ID][03][startHi][startLo][nHi][nLo][crcLo][crcHi]
    uint8_t req[8];
    req[0] = SLAVE_ID;
    req[1] = 0x03;
    req[2] = highByte(START_REG);
    req[3] = lowByte(START_REG);
    req[4] = highByte(NUM_REGS);
    req[5] = lowByte(NUM_REGS);
    uint16_t crc = calcCRC(req, 6);
    req[6] = lowByte(crc);
    req[7] = highByte(crc);

    // 2) Send it
    preTransmit();
    Serial2.write(req, 8);
    Serial2.flush();
    postTransmit();
}

SensorData readRequest() {
    // 3) Wait for at least (ID+FC+byteCnt + 2*NUM_REGS + CRC) bytes
    size_t toRead = 3 + 2 * NUM_REGS + 2;
    uint32_t start = millis();
    while (Serial2.available() < toRead && millis() - start < TIMEOUT) {
        ;  // spin
    }

    if (Serial2.available() < toRead) {
        Serial.println("⚠️ Timeout waiting for reply");
        return {false, 0, 0, 0};
    }

    // 4) Read full frame
    uint8_t buf[3 + 2 * NUM_REGS + 2];
    Serial2.readBytes(buf, toRead);

    // 5) Validate header
    if (buf[0] != SLAVE_ID || buf[1] != 0x03) {
        Serial.printf("⚠️ Bad header: %02X %02X\n", buf[0], buf[1]);
        return {false, 0, 0, 0};
    }

    uint8_t byteCount = buf[2];
    if (byteCount != 2 * NUM_REGS) {
        Serial.printf("⚠️ Unexpected byte count %u\n", byteCount);
        return {false, 0, 0, 0};
    }

    // 6) Check CRC
    uint16_t recCrc = (uint16_t)buf[toRead - 1] << 8 | buf[toRead - 2];
    if (calcCRC(buf, toRead - 2) != recCrc) {
        Serial.println("⚠️ CRC mismatch");
        return {false, 0, 0, 0};
    }

    // 7) Extract N, P, K
    uint16_t vals[NUM_REGS];
    for (uint8_t i = 0; i < NUM_REGS; i++) {
        vals[i] = (uint16_t)buf[3 + 2 * i] << 8 | (uint16_t)buf[3 + 2 * i + 1];
    }
    Serial.printf(
        "✅ N=%u mg/kg, P=%u mg/kg, K=%u mg/kg\n",
        vals[0], vals[1], vals[2]);
    return {true, vals[0], vals[1], vals[2]};
}

unsigned long lastReadTime = 0;

void loop() {
    // Maintain authentication and async tasks
    app.loop();

    unsigned long currentTime = millis();
    if (currentTime - lastReadTime > 500) {
        lastReadTime = currentTime;

        writeRequest();
        SensorData data = readRequest();

        if (data.valid) {
            // Check if authentication is ready
            if (app.ready()) {
                // Send sensor data to Firebase
                Database.set<int>(aClient, "/soil/nitrogen", data.nitrogen,
                                  processData, "RTDB_Send_Nitrogen");
                Database.set<int>(aClient, "/soil/phosphorus", data.phosphorus,
                                  processData, "RTDB_Send_Phosphorus");
                Database.set<int>(aClient, "/soil/potassium", data.potassium,
                                  processData, "RTDB_Send_Potassium");
            }
        }
    }
}

void processData(AsyncResult &aResult) {
    if (!aResult.isResult())
        return;

    if (aResult.isEvent())
        Firebase.printf("Event task: %s, msg: %s, code: %d\n", aResult.uid().c_str(), aResult.eventLog().message().c_str(), aResult.eventLog().code());

    if (aResult.isDebug())
        Firebase.printf("Debug task: %s, msg: %s\n", aResult.uid().c_str(), aResult.debug().c_str());

    if (aResult.isError())
        Firebase.printf("Error task: %s, msg: %s, code: %d\n", aResult.uid().c_str(), aResult.error().message().c_str(), aResult.error().code());

    if (aResult.available())
        Firebase.printf("task: %s, payload: %s\n", aResult.uid().c_str(), aResult.c_str());
}

// #include <Arduino.h>
// #include <FirebaseClient.h>
// #include <WiFi.h>
// #include <WiFiClientSecure.h>

// // Network and Firebase credentials
// #define WIFI_SSID "KetZoom2"
// #define WIFI_PASSWORD "VvP19259970528"

// #define Web_API_KEY "REDACTED"
// #define DATABASE_URL "REDACTED"
// #define USER_EMAIL "REDACTED"
// #define USER_PASS "REDACTED"

// // User function
// void processData(AsyncResult &aResult);

// // Authentication
// UserAuth user_auth(Web_API_KEY, USER_EMAIL, USER_PASS);

// // Firebase components
// FirebaseApp app;
// WiFiClientSecure ssl_client;
// using AsyncClient = AsyncClientClass;
// AsyncClient aClient(ssl_client);
// RealtimeDatabase Database;

// // Timer variables for sending data every 10 seconds
// unsigned long lastSendTime = 0;
// const unsigned long sendInterval = 10000;  // 10 seconds in milliseconds

// // Variables to send to the database
// int intValue = 0;
// float floatValue = 0.01;
// String stringValue = "";

// void setup() {
//     Serial.begin(115200);

//     // Connect to Wi-Fi
//     WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
//     Serial.print("Connecting to Wi-Fi");
//     while (WiFi.status() != WL_CONNECTED) {
//         Serial.print(".");
//         delay(300);
//     }
//     Serial.println();

//     // Configure SSL client
//     ssl_client.setInsecure();
//     ssl_client.setHandshakeTimeout(5);  // Handshake timeout in seconds
//     ssl_client.setTimeout(1000);        // ✅ Connection timeout in milliseconds

//     // Initialize Firebase
//     initializeApp(aClient, app, getAuth(user_auth), processData, "🔐 authTask");
//     app.getApp<RealtimeDatabase>(Database);
//     Database.url(DATABASE_URL);
// }

// void loop() {
//     // Maintain authentication and async tasks
//     app.loop();
//     // Check if authentication is ready
//     if (app.ready()) {
//         // Periodic data sending every 10 seconds
//         unsigned long currentTime = millis();
//         if (currentTime - lastSendTime >= sendInterval) {
//             // Update the last send time
//             lastSendTime = currentTime;

//             // send a string
//             stringValue = "value_" + String(currentTime);
//             Database.set<String>(aClient, "/test/string", stringValue, processData, "RTDB_Send_String");
//             // send an int
//             Database.set<int>(aClient, "/test/int", intValue, processData, "RTDB_Send_Int");
//             intValue++;  // increment intValue in every loop

//             // send a string
//             floatValue = 0.01 + random(0, 100);
//             Database.set<float>(aClient, "/test/float", floatValue, processData, "RTDB_Send_Float");
//         }
//     }
// }

// void processData(AsyncResult &aResult) {
//     if (!aResult.isResult())
//         return;

//     if (aResult.isEvent())
//         Firebase.printf("Event task: %s, msg: %s, code: %d\n", aResult.uid().c_str(), aResult.eventLog().message().c_str(), aResult.eventLog().code());

//     if (aResult.isDebug())
//         Firebase.printf("Debug task: %s, msg: %s\n", aResult.uid().c_str(), aResult.debug().c_str());

//     if (aResult.isError())
//         Firebase.printf("Error task: %s, msg: %s, code: %d\n", aResult.uid().c_str(), aResult.error().message().c_str(), aResult.error().code());

//     if (aResult.available())
//         Firebase.printf("task: %s, payload: %s\n", aResult.uid().c_str(), aResult.c_str());
// }
