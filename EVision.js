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
const MODE_STATIC = 0x06; 
const BRIGHTNESS = 0x04; 

let lastR = -1, lastG = -1, lastB = -1;
let lastUpdateTime = 0;

export function Initialize() {
    updateStaticColor(0, 0, 0);
}

export function Render() {

    const now = Date.now();
    if (now - lastUpdateTime < 33) {
        return;
    }


    const color = device.color(11, 2);
    const r = color[0];
    const g = color[1];
    const b = color[2];


    if (r !== lastR || g !== lastG || b !== lastB) {
        updateStaticColor(r, g, b);
        
        lastR = r;
        lastG = g;
        lastB = b;
        lastUpdateTime = now;
    }
}

export function Shutdown() {
}

function updateStaticColor(r, g, b) {

    const packet = new Array(64).fill(0);
    packet[0] = REPORT_ID;

    packet[3] = CMD_SET_PARAM; // 0x06
    packet[4] = 0x08;          // Length
    packet[5] = 0x00;          // Param ID
    // 6, 7 Padding
    
    // Data Payload
    packet[8] = MODE_STATIC;   // 0x06
    packet[9] = BRIGHTNESS;    // 0x04
    packet[10] = 0x00;         // Speed
    packet[11] = 0x00;         // Direction
    packet[12] = 0x00;         // Random
    
  
    packet[13] = r; // Green
    packet[14] = b; // Red
    packet[15] = g; // Blue

    addChecksum(packet);
    device.write(packet, 64);
}

function addChecksum(packet) {
    let checksum = 0;
    for (let i = 3; i < 64; i++) {
        checksum += packet[i];
    }
    packet[1] = checksum & 0xFF;
    packet[2] = (checksum >> 8) & 0xFF;
}

export function Validate(endpoint) {
    return endpoint.interface === 1 && endpoint.usage_page === 0xff1c;
}