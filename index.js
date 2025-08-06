const { startWhatsAppClient, setWhatsAppMessageHandler, sendWhatsAppMessage, getWhatsAppClient  } = require('./src/services/whatsappService');
const { startTelegramBot, setTelegramMessageHandler, sendTelegramMessage } = require('./src/services/telegramService');
const { handleMessage } = require('./src/controllers/messageController');

///////////LOGGER////////////
const Logger = require('./src/utils/logger');
const logger = new Logger('super-bot.log.log');
Logger.overrideConsole(logger);


const TELEGRAM_BOT_TOKEN = '7763278536:AAEtDwUHZE08Rc5iOO7NPnYASU3k8Up085k';


async function startServices() {
	
	// WhatsApp
    await startWhatsAppClient();
	console.log('✅ WhatsApp client fully started!');

	
	////////////////////////Handlers////////////////////////
	////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////
	//                                                    //
	//                  WhatsAppMessageHandler            //
	//                                                    //
	////////////////////////////////////////////////////////
	//setWhatsAppMessageHandler
    setWhatsAppMessageHandler(async (message) => {
		
	///////////////////////////////////////////////////////////////
	// Desenses !!                                               //
	///////////////////////////////////////////////////////////////
	// Check if message is from a private user (not a group or bot)
	if (!message.from.includes("@s.whatsapp.net") && !message.from.includes("@c.us")) {
        console.log(`🚫 Ignoring [WhatsApp] message from non-private source: ${message.from}`);
        return;
    }
	////////////////////////////////////////////////////////////////
	// Limmiters !!						  						  //
	////////////////////////////////////////////////////////////////
		//in case we want to ignore old messages... last 72 hours../////
		////////////////////////////////////////////////////////////////
		///// Convert timestamp to milliseconds.
		const messageTimestamp = message.timestamp * 1000; 
		const currentTime = Date.now();
		const timeDifference = currentTime - messageTimestamp;
		
		// 72 hours in milliseconds
		const maxTimeDifference = 72 * 60 * 60 * 1000; 
		
		// Ignore messages older than 72 hours
		if (timeDifference > maxTimeDifference) {
			console.log(`⏳ Ignoring old message from ${message.from}, sent more than 72 hours ago.`);
			return;
		}
	//////////////////////////////////////////////////////////////
	// Messages Handler	                                        //
	//////////////////////////////////////////////////////////////
		//console.log(`📩 New message from [WhatsApp] ${message.from}: ${message.body}`);
		
		const contact = await message.getContact();
		if (!contact) 
		{
			console.log("❌ Error: Unable to get sender information.");
			return;
		}
		
		// Get the saved contact name or use pushname if not available
		const savedName = contact.name ? contact.name : (contact.pushname ? contact.pushname : "Unknown");
		const isMyContact = contact.isMyContact || false; // Default to false if not available
		
		//console.log(`📩 New message from [WhatsApp]: ${savedName}`);
	
		// Check if the sender is in the saved contacts
		if (isMyContact) {
			console.log(`✅ ${savedName} is in your contacts.`);
		
			// Check if the saved name contains the word "לקוח"
			if (savedName.includes("לקוח")) {
				console.log(`🔍 The saved name contains the word "לקוח".`);
				// Send to Bot....
				await handleMessage('whatsapp', message.from, message.body);
			} else {
				console.log(`private conversation with: ${savedName}`);
			}
		} else {
			console.log(`Unknown -> send to bot.`);
			// Send to Bot....
			await handleMessage('whatsapp', message.from, message.body);
		}
		
    });
	
	
    //setTelegramMessageHandler
	////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////
	//                                                    //
	//               setTelegramMessageHandler            //
	//                                                    //
	////////////////////////////////////////////////////////
	 // Telegram
	await startTelegramBot();
	console.log("📩 Setting Telegram message handler...");
    setTelegramMessageHandler(async (ctx) => {
    const chatId = ctx.chat.id;
    const message = ctx.message.text;

    // בדוק אם ההודעה היא פרטית (1-על-1 עם הבוט)
    if (ctx.chat.type === 'private') {
        //console.log(`📢 New Telegram DM from user: ${chatId}`);
        await handleMessage('telegram', chatId, message);
        return;
    }

    // בדוק אם ההודעה כוללת אזכור של הבוט (בקבוצה)
    if (message.includes(`@${ctx.botInfo.username}`)) {
        console.log(`📢 Mentioned in group: ${chatId}`);
        await handleMessage('telegram', chatId, message);
        return;
    }

    console.log(`🚫 Ignoring message from group: ${chatId}`);
	});
	////////////////////////////////////////////////////////


}




startServices();
