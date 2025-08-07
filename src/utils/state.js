let state = {
    isBotActive: false,
    isWhatsappConnected: false
};

function activateBot() {
    state.isBotActive = true;
}

function deactivateBot() {
    state.isBotActive = false;
}

function connectWhatsapp() {
    state.isWhatsappConnected = true;
}

function resetWhatsapp() {
    state.isWhatsappConnected = false;
}

function getState() {
    return state;
}

function isConnected() {
    return state.isWhatsappConnected;
}

module.exports = {
    activateBot,
    deactivateBot,
    connectWhatsapp,
    resetWhatsapp,
    getState,
    isConnected,
    get isBotActive() {
        return state.isBotActive;
    },
    get isWhatsappConnected() {
        return state.isWhatsappConnected;
    }
};
