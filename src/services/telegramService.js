// Telegram Bot Service
const { Telegraf } = require('telegraf');
const axios = require('axios');

let bot;
let messageHandler = null;
let botReady = false;

const botToken = '7815626782:AAHSoXwNxpJhY4qHwy9cRNR1qldHD7rTeRU';
//7815626782:AAHSoXwNxpJhY4qHwy9cRNR1qldHD7rTeRU

const MAX_RETRIES = 5; // time to connect in case of fail.

//kokokoko
async function isTelegramAPIAvailable() {
    try {
        const response = await axios.get(`https://api.telegram.org/bot7763278536:AAEtDwUHZE08Rc5iOO7NPnYASU3k8Up085k/getMe`);
        return response.status === 200;
    } catch (error) {
        return false;
    }
}

async function startTelegramBot(retries = 0) {
    if (botReady) return; // אם הבוט כבר הופעל, לא ננסה שוב

    return new Promise(async (resolve, reject) => {
        try {
            console.log("⏳ בודק חיבור ל-Telegram API...");
            const isConnected = await isTelegramAPIAvailable();
            if (!isConnected) {
                console.log("❌ ה-API של טלגרם לא זמין כרגע. ננסה שוב מאוחר יותר.");
                setTimeout(() => startTelegramBot(retries + 1).then(resolve).catch(reject), 10000);
                return;
            }

            console.log("⏳ מחכה 5 שניות לפני הפעלת הבוט...");
            await new Promise(resolve => setTimeout(resolve, 5000));

            bot = new Telegraf('7763278536:AAEtDwUHZE08Rc5iOO7NPnYASU3k8Up085k');
            console.log("🔄 מפעיל את הבוט...");

            bot.launch({ dropPendingUpdates: true });

            console.log("🚀 הבוט התחבר בהצלחה!");
            botReady = true;
            console.log("✅ Telegram bot started");

            resolve(); // מסמן שהבוט עלה בהצלחה

        } catch (error) {
            console.error(`❌ Telegram bot failed to start: ${error.message}`);
            reject(error);
        }
    });
}

function setTelegramMessageHandler(handler) {
    if (!botReady) {
        console.error('❌ Error: startTelegramBot must be called before setting the message handler.');
        return;
    }

    bot.on('text', async (ctx) => {
        if (!botReady) {
            console.log(`⏳ מתעלם מהודעה (${ctx.message.text}) מ-${ctx.chat.id}, הבוט עדיין נטען...`);
            return;
        }

        if (handler) {
            await handler(ctx);
        }
    });
}
//kokokokoo
//async function isTelegramAPIAvailable() {
//    try {
//        const response = await axios.get(`https://api.telegram.org/bot7763278536:AAEtDwUHZE08Rc5iOO7NPnYASU3k8Up085k/getMe`);
//        return response.status === 200;
//    } catch (error) {
//        return false;
//    }
//}

//async function startTelegramBot(retries = 0) {
//    if (!bot) {
//        try {
//            console.log("⏳ בודק חיבור ל-Telegram API...");
//            const isConnected = await isTelegramAPIAvailable();
//            if (!isConnected) {
//                console.log("❌ ה-API של טלגרם לא זמין כרגע. ננסה שוב מאוחר יותר.");
//                setTimeout(() => startTelegramBot(retries + 1), 10000);
//                return;
//            }
//
//            console.log("⏳ מחכה 5 שניות לפני הפעלת הבוט...");
//            await new Promise(resolve => setTimeout(resolve, 5000));
//
//            bot = new Telegraf('7763278536:AAEtDwUHZE08Rc5iOO7NPnYASU3k8Up085k');
//            console.log("🔄 מפעיל את הבוט...");
//
//            bot.launch({ dropPendingUpdates: true });
//
//            console.log("🚀 הבוט התחבר בהצלחה!");
//            botReady = true;
//            console.log("✅ Telegram bot started");
//
//        } catch (error) {
//            console.error(`❌ Telegram bot failed to start: ${error.message}`);
//
//            if (error.code === 'ECONNRESET' && retries < MAX_RETRIES) {
//                const delay = (retries + 1) * 10000;
//                console.log(`🔄 ECONNRESET detected. Retrying in ${delay / 1000} seconds...`);
//                setTimeout(() => startTelegramBot(retries + 1), delay);
//            } else {
//                console.error("❌ Maximum retries reached. Exiting...");
//                process.exit(1);
//            }
//        }
//    }
//}


//async function startTelegramBot(botToken , retries = 0) {
//    if (!bot) {
//		try{
//			//await new Promise(resolve => setTimeout(resolve, 5000)); // ממתין 5 שניות לפני שמסמן שהבוט מוכן
//			//bot = new Telegraf('7815626782:AAHSoXwNxpJhY4qHwy9cRNR1qldHD7rTeRU');
//			bot = new Telegraf('7763278536:AAEtDwUHZE08Rc5iOO7NPnYASU3k8Up085k');
//			console.log("🔄 מפעיל את הבוט...");
//			//await bot.launch();
//			
//		await Promise.race([
//			bot.launch({
//				dropPendingUpdates: true,
//				polling: { timeout: 10 },
//			}),
//			new Promise((_, reject) => setTimeout(() => reject(new Error("Telegram bot launch timed out")), 15000))
//		]);
//
//			console.log('✅ Telegram bot started');
//			botReady = true;
//		}
//		catch (error) {
//			console.error(`❌ Telegram bot failed to start: ${error.message}`);
//			if (retries < MAX_RETRIES){
//				const delay = (retries + 1) * 5000; // 5 שניות * מספר הנסיונות
//				console.log(`🔄 Retrying in ${delay / 1000} seconds...`);
//				setTimeout(() => startTelegramBot(retries + 1), delay);	
//			} else {
//				console.error("❌ Maximum retries reached. Exiting...");
//				process.exit(1);
//			}
//			
//		}
//
//    }
//}


//function setTelegramMessageHandler(handler) {
//	
//    if (!bot) {
//        console.error('Error: startTelegramBot must be called before setting the message handler.');
//        return;
//    }
//	
//    messageHandler = handler;
//    
//	bot.on('text', async (ctx) => {
//		if (!botReady) {
//			console.log(`⏳ מתעלם מהודעה (${ctx.message.text}) מ-${ctx.chat.id}, הבוט עדיין נטען...`);
//			return;
//		}
//	
//        if (messageHandler) {
//            await messageHandler(ctx);
//        }
//    });
//}




async function sendTelegramMessage(chatId, text) {
    if (bot) {
        try {
            await bot.telegram.sendMessage(chatId, text);
        } catch (error) {
            console.error(`Failed to send message to ${chatId}: ${error.message}`);
        }
    }
}

module.exports = { startTelegramBot, setTelegramMessageHandler, sendTelegramMessage };


