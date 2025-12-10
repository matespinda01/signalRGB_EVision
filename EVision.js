export function Name() { return "EVision/Sonix Keyboard"; }
export function VendorId() { return 0x0c45; }
export function ProductId() { return 0x5004; }
export function Publisher() { return "SignalRGB"; }
export function Size() { return [23, 6]; }
export const Type = "Hid";

const vKeyNames = [
    "Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "PrtSc", "ScrLk", "Pause",
    "Tik", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Bksp", "Ins", "Home", "PgUp", "NumLk", "/", "*", "-",
    "Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\", "Del", "End", "PgDn", "Num7", "Num8", "Num9", "+",
    "Caps", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter", "Num4", "Num5", "Num6",
    "LShift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "RShift", "Up", "Num1", "Num2", "Num3", "NumEnter",
    "LCtrl", "LWin", "LAlt", "Space", "RAlt", "Fn", "RCtrl", "Left", "Down", "Right", "Num0", "Num."
];

// Matrix Map (126 LEDs)
const matrixMap = [
    [0, 255, 1, 2, 3, 4, 255, 5, 6, 7, 8, 255, 9, 10, 11, 12, 14, 15, 16, 255, 255, 255, 255],
    [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 255, 32, 33, 34, 255, 35, 36, 37, 38, 39, 40, 41],
    [42, 255, 43, 44, 45, 46, 255, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62],
    [63, 255, 64, 65, 66, 67, 255, 68, 69, 70, 71, 72, 73, 74, 76, 255, 255, 255, 255, 80, 81, 82, 255],
    [84, 255, 86, 87, 88, 89, 255, 90, 255, 91, 92, 93, 94, 95, 97, 255, 255, 99, 255, 101, 102, 103, 104],
    [105, 106, 107, 255, 255, 255, 255, 108, 255, 255, 255, 255, 109, 110, 111, 113, 119, 120, 121, 123, 255, 124, 255]
];

const ledInfos = [];
for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 23; c++) {
        const ledIndex = matrixMap[r][c];
        if (ledIndex !== 255) {
            const keyName = (ledIndex < vKeyNames.length) ? vKeyNames[ledIndex] : `LED ${ledIndex}`;
            ledInfos.push({
                name: keyName,
                id: ledIndex,
                position: [c, r],
            });
        }
    }
}

export function LedInfos() {
    return ledInfos;
}

const REPORT_ID = 0x04;
const CMD_SET_PARAM = 0x06;
const CMD_COLOR_DATA = 0x11;


const CAPTURED_MODE = 0x01;
const CAPTURED_BRIGHTNESS = 0x04;

export function Initialize() {
    const modeData = [
        CAPTURED_MODE,      
        CAPTURED_BRIGHTNESS,
        0x00,               
        0x00,               
        0, 0, 0, 0
    ];
    
    sendParameter(0x00, modeData);
}

export function Render() {
    const totalLeds = 126;
    const colorData = new Uint8Array(totalLeds * 3).fill(0);

    for (const led of ledInfos) {
        const color = device.color(led.position[0], led.position[1]);
        const idx = led.id * 3;
        
        if (idx + 2 < colorData.length) {
            colorData[idx] = color[0];     
            colorData[idx + 1] = color[1]; 
            colorData[idx + 2] = color[2]; 
        }
    }

    const chunkSize = 54;
    let offset = 0;

    while (offset < colorData.length) {
        let size = colorData.length - offset;
        if (size > chunkSize) size = chunkSize;

        const chunk = colorData.slice(offset, offset + size);
        sendColorData(chunk, size, offset);
        device.pause(1);
        offset += size;
    }
}

export function Shutdown() {
}

function sendParameter(parameterId, dataBytes) {

    const packet = new Array(64).fill(0);
    
    packet[0] = REPORT_ID; // 0x04
    packet[3] = CMD_SET_PARAM; // 0x06
    packet[4] = dataBytes.length; // 0x08
    packet[5] = parameterId;      // 0x00

    for(let i = 0; i < dataBytes.length; i++) {
        packet[8 + i] = dataBytes[i];
    }

    addChecksum(packet);
    device.write(packet, 64);
}

function sendColorData(data, size, offset) {
    const packet = new Array(64).fill(0);
    
    packet[0] = REPORT_ID; // 0x04
    // packet[1], packet[2] Checksum
    packet[3] = CMD_COLOR_DATA; // 0x11
    packet[4] = size;
    packet[5] = offset & 0xFF;
    packet[6] = (offset >> 8) & 0xFF;
    

    for(let i = 0; i < size; i++) {
        packet[8 + i] = data[i];
    }

    addChecksum(packet);
    device.write(packet, 64);
}

function addChecksum(packet) {
    let checksum = 0;
    // Sum bytes 3 to 63
    // Note: Packet length is 64, indices 0-63.
    for (let i = 3; i < 64; i++) {
        checksum += packet[i];
    }
    
    packet[1] = checksum & 0xFF;
    packet[2] = (checksum >> 8) & 0xFF;
}

export function Validate(endpoint) {
    return endpoint.interface === 1 && endpoint.usage_page === 0xff1c;
}