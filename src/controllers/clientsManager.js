const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const CLIENTS_FILE = path.join(DATA_DIR, 'clients.json');

function ensureClientsFileExists() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(CLIENTS_FILE)) {
        fs.writeFileSync(CLIENTS_FILE, '{}', 'utf8');
    }
}

ensureClientsFileExists();

let clients = JSON.parse(fs.readFileSync(CLIENTS_FILE, 'utf8'));

function saveClients() {
    fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2), 'utf8');
}

function getClient(phone) {
    return clients[phone];
}

function setClient(phone, data) {
    clients[phone] = { ...data, lastUpdated: Date.now() };
    saveClients();
}

function removeClient(phone) {
    delete clients[phone];
    saveClients();
}

function clearExpiredClients() {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 דקות

    for (const phone in clients) {
        if (now - clients[phone].lastUpdated > timeout) {
            console.log(`⏳ עברו חמש דקות מאז התחיל הלקוח ${phone} את השיחה`);
            delete clients[phone];
        }
    }

    saveClients();
}

module.exports = {
    getClient,
    setClient,
    removeClient,
    clearExpiredClients
};
