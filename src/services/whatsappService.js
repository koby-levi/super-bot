const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
//const qrcode = require('qrcode-terminal');
//const { addMessageToQueue } = require('../utils/messageQueue');

let lastQRCode = null;
let whatsappClient;


function getLastQRCode() {
    return lastQRCode;
}


async function startWhatsAppClient() {
	return new Promise((resolve, reject) => {
    whatsappClient = new Client({ authStrategy: new LocalAuth({ clientId: "whatsapp-bot" }) });
    
	
    //whatsappClient.on('qr', (qr) => {
    //    console.log('QR Code:');
    //    qrcode.generate(qr, { small: true });
    //});
	
    whatsappClient.on('qr', (qr) => {
        console.log("📷 New QR code received");
        lastQRCode = qr;
    });
    
	
    whatsappClient.on('ready', () => {
		console.log('✅ WhatsApp is ready!')
		resolve();
	});
    
    whatsappClient.on('message', async (message) => {
		if (whatsappMessageHandler) {
            whatsappMessageHandler(message);
        }
    });

    whatsappClient.initialize();
	console.log('✅ Initializing WhatsApp client...');
	});
}


let whatsappMessageHandler = null;
function setWhatsAppMessageHandler(handler) {
    whatsappMessageHandler = handler;
}


//async function sendWhatsAppMessage(number, text, ogData = null) {
//    try {
//        const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
//        console.log(`📤 Sending WhatsApp message to ${chatId}`);
//
//        if (ogData && ogData.image) {
//            const media = await MessageMedia.fromUrl(ogData.image);
//			const caption = `${text}`;
//            await whatsappClient.sendMessage(chatId, media, { caption, linkPreview: true });
//        } else {
//            await whatsappClient.sendMessage(chatId, text, { linkPreview: true });
//        }
//        return true;
//    } catch (error) {
//        console.error(`❌ Failed to send WhatsApp message to ${number}:`, error);
//        return false;
//    }
//}

const sendWhatsAppMessage = async (number, message, ogData = null) => {
    //log(`Sending message: ${message}`);
    try {
        const chatId = number;
        const chat = await whatsappClient.getChatById(chatId);

        if (!chat) {
            log(`Chat with ${number} not found. Creating a new one.`);
        }

        if (ogData && ogData.image) {
            const media = await MessageMedia.fromUrl(ogData.image);
            const caption = `${message}`;
            const response = await whatsappClient.sendMessage(chatId, media, { caption, linkPreview: true });
            //log(`OG Data message sent successfully: ${response}`);
            //log('OG Data message sent successfully.');
        } else {
            const response = await whatsappClient.sendMessage(chatId, message, { linkPreview: true });
            //log(`Message sent successfully: ${response}`);
            //log('Message sent successfully.');
        }
        return true; 
    } catch (error) {
        console.error('Failed to send messag44444e:', error);
        return false; 
    }
};


function getWhatsAppClient() {
    return whatsappClient;
}

module.exports = { startWhatsAppClient, setWhatsAppMessageHandler, sendWhatsAppMessage, getWhatsAppClient, getLastQRCode  };
