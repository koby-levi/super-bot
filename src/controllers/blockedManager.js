const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const BLOCKED_FILE = path.join(DATA_DIR, 'blocked.json');

function ensureBlockedFileExists() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(BLOCKED_FILE)) {
        fs.writeFileSync(BLOCKED_FILE, '{}', 'utf8'); // אובייקט במקום מערך
    }
}

ensureBlockedFileExists();

let blocked = JSON.parse(fs.readFileSync(BLOCKED_FILE, 'utf8'));

function saveBlocked() {
    fs.writeFileSync(BLOCKED_FILE, JSON.stringify(blocked, null, 2), 'utf8');
}

function addBlocked(phone) {
    if (!blocked[phone]) {
        blocked[phone] = { blockedAt: Date.now() };
        saveBlocked();
        console.log(`🚫 ${phone} נוסף לרשימת החסומים`);
    }
}

function removeBlocked(phone) {
    if (blocked[phone]) {
        delete blocked[phone];
        saveBlocked();
        console.log(`✅ ${phone} הוסר מרשימת החסומים`);
    }
}

function isBlocked(phone) {
    return !!blocked[phone];
}

function getAllBlocked() {
    return Object.keys(blocked);
}

/**
 * מסיר חסומים שפג תוקפם
 * @param {number} expirationMs משך זמן החסימה במיליסקנדות
 */
function clearExpiredBlocked(expirationMs) {
    const now = Date.now();
    let changed = false;

    for (const phone in blocked) {
        if (now - blocked[phone].blockedAt > expirationMs) {
            console.log(`⏳ החסימה של ${phone} פגה — הוסר מהרשימה`);
            delete blocked[phone];
            changed = true;
        }
    }

    if (changed) saveBlocked();
}

module.exports = {
    addBlocked,
    removeBlocked,
    isBlocked,
    getAllBlocked,
    clearExpiredBlocked
};
