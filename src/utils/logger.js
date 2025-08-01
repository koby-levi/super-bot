const fs = require('fs');
const path = require('path');

class Logger {
    constructor(logFilePath) {
        this.logFilePath = logFilePath || path.join(__dirname, 'application.log');
    }

    getCurrentTimestamp() {
        const now = new Date();
        const date = now.toLocaleDateString('en-GB');
        const time = now.toLocaleTimeString('en-GB', { hour12: false });
        return `${date} ${time}`;
    }

    log(message) {
        const timestamp = this.getCurrentTimestamp();
        const logMessage = `[${timestamp}] INFO: ${message}\n`;
        Logger.originalConsoleLog(logMessage.trim());
        this.writeToFile(logMessage);
    }

    error(message) {
        const timestamp = this.getCurrentTimestamp();
        const errorMessage = `[${timestamp}] ERROR: ${message}\n`;
        Logger.originalConsoleError(errorMessage.trim());
        this.writeToFile(errorMessage);
    }

    writeToFile(logMessage) {
        fs.appendFile(this.logFilePath, logMessage, (err) => {
            if (err) {
                Logger.originalConsoleError('Failed to write log to file:', err);
            }
        });
    }
}

// שמירת הפונקציות המקוריות של console
Logger.originalConsoleLog = console.log;
Logger.originalConsoleError = console.error;

// עיטוף הפונקציות של console
Logger.overrideConsole = (loggerInstance) => {
    console.log = (message, ...optionalParams) => {
        const fullMessage = [message, ...optionalParams].join(' ');
        loggerInstance.log(fullMessage);
    };

    console.error = (message, ...optionalParams) => {
        const fullMessage = [message, ...optionalParams].join(' ');
        loggerInstance.error(fullMessage);
    };
};

module.exports = Logger;
