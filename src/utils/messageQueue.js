const messageQueue = [];
let isProcessingQueue = false;
let processQueueCallback = null;

/**
 * הוספת הודעה לתור
 * @param {string} platform - הפלטפורמה שממנה ההודעה התקבלה ('whatsapp' / 'telegram')
 * @param {string} sender - מזהה השולח (מספר טלפון או chatId)
 * @param {string} text - תוכן ההודעה
 * @param {string|null} image - קישור לתמונה (אם קיים)
 */
async function addMessageToQueue({ platform, sender, text, image = null }) {
    if (!platform || !sender || !text) {
        console.error("❌ Error: Trying to enqueue an invalid message:", { platform, sender, text });
        return;
    }

    messageQueue.push({ platform, sender, text, image });

    if (processQueueCallback && !isProcessingQueue) {
        await processQueueCallback();
    }
}

/**
 * הוצאת הודעה מהתור
 * @returns {object|null} ההודעה הבאה בתור או null אם התור ריק
 */
function removeMessageFromQueue() {
    return messageQueue.length > 0 ? messageQueue.shift() : null;
}

/**
 * הגדרת פונקציה לעיבוד התור
 * @param {function} callback - פונקציה שמטפלת בהודעות בתור
 */
function setProcessQueueCallback(callback) {
    processQueueCallback = callback;
}

module.exports = { addMessageToQueue, removeMessageFromQueue, setProcessQueueCallback };
