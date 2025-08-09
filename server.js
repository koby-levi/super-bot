const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

const { getLastQRCode, startWhatsAppClient,stopWhatsAppClient, setWhatsAppMessageHandler } = require('./src/services/whatsappService');
const QRCode = require('qrcode'); // חייב להתקין עם npm install qrcode

const { sendWhatsAppMessage, getWhatsAppClient } = require('./src/services/whatsappService');
const { startTelegramBot, setTelegramMessageHandler, sendTelegramMessage } = require('./src/services/telegramService');
const { handleMessage } = require('./src/controllers/messageController');

/////////// LOGGER ///////////
const Logger = require('./src/utils/logger');
const logger = new Logger('super-bot.log.log');
Logger.overrideConsole(logger);


const state = require('./src/utils/state');
// ==================== START SERVICES ====================

async function startServices() {
    await startWhatsAppClient();
    console.log('✅ WhatsApp client fully started!');
	
	state.connectWhatsapp();
	


    setWhatsAppMessageHandler(async (message) => {
		
		console.log('state.isBotActive:: ', state.isBotActive);
		
        if (!state.isBotActive) {
            console.log("🚫 Bot is not active, ignoring message.");
            return;
        }

        if (!message.from.includes("@s.whatsapp.net") && !message.from.includes("@c.us")) {
            console.log(`🚫 Ignoring [WhatsApp] message from non-private source: ${message.from}`);
            return;
        }

        const messageTimestamp = message.timestamp * 1000;
        const currentTime = Date.now();
        const timeDifference = currentTime - messageTimestamp;
        const maxTimeDifference = 72 * 60 * 60 * 1000;

        if (timeDifference > maxTimeDifference) {
            console.log(`⏳ Ignoring old message from ${message.from}, sent more than 72 hours ago.`);
            return;
        }

        const contact = await message.getContact();
        if (!contact) {
            console.log("❌ Error: Unable to get sender information.");
            return;
        }

        const savedName = contact.name || contact.pushname || "Unknown";
        const isMyContact = contact.isMyContact || false;

        if (isMyContact) {
            console.log(`✅ ${savedName} is in your contacts.`);
            if (savedName.includes("לקוח")) {
                console.log(`🔍 The saved name contains the word "לקוח".`);
                await handleMessage('whatsapp', message.from, message.body);
            } else {
                console.log(`private conversation with: ${savedName}`);
            }
        } else {
            console.log(`Unknown -> send to bot.`);
            await handleMessage('whatsapp', message.from, message.body);
        }
    });
}



const PORT = process.env.PORT || 3000;



// כדי לשרת את הקבצים הסטטיים (HTML + JS)
app.use(express.static(path.join(__dirname, 'public')));

// ==================== ROUTES ====================

// דשבורד ראשי
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// החזרת סטטוס (לבדוק אם מחובר והאם הבוט פעיל)
app.get('/status', (req, res) => {
    res.json({
        isBotActive: state.isBotActive,
        isWhatsappConnected: state.isWhatsappConnected,
    });
});

// הפעלת הבוט
app.get('/start-bot', (req, res) => {
    if (!state.isWhatsappConnected) {
        return res.send("❌ לא ניתן להפעיל את הבוט לפני חיבור WhatsApp");
    }
    state.activateBot();
    return res.send("✅ הבוט הופעל בהצלחה");
});

// כיבוי הבוט
app.get('/stop-bot', (req, res) => {
	if (!state.isWhatsappConnected) {
		return res.send("לא ניתן לכבות את הבוט לפני חיבור WhatsApp ❌");
    }
    state.deactivateBot();
    return res.send("🛑 הבוט כובה");
});

////
app.get('/api/whatsapp/status', (req, res) => {
  res.json({ connected: state.isConnected() }); // נניח שאתה מנהל סטייט פנימי עם state
});
///

app.get('/api/whatsapp/qr', async (req, res) => {
  const qr = getLastQRCode(); // QR נמשך מהזיכרון או אובייקט אחר
  if (!qr) return res.status(404).json({ error: "QR not available yet" });

  const qrImage = await QRCode.toDataURL(qr);
  res.json({ qrImage });
});

/////////////////

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});


///////////////////////

app.get('/link-whatsapp', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/services', 'qrService.html'));
});


app.delete('/unlink-whatsapp', async (req, res) => {
	
	if (!state.isWhatsappConnected) {
		return res.send("לא ניתן להסיר קישור WhatsApp לפני שמקשרים אותו ❌");
    }
	
	console.log(' unlink-whatsapp !');
	
	try {
		await stopWhatsAppClient();
		
		const authPath = path.join(__dirname, '.wwebjs_auth');
		const cachePath = path.join(__dirname, '.wwebjs_cache');
	
		let removedSomething = false;
	
		if (fs.existsSync(authPath)) {
		fs.rmSync(authPath, { recursive: true, force: true });
		removedSomething = true;
		}
	
		if (fs.existsSync(cachePath)) {
		fs.rmSync(cachePath, { recursive: true, force: true });
		removedSomething = true;
		}
	
		if (removedSomething) {
		state.resetWhatsapp();
		state.deactivateBot();
		return res.send("✅ הקישור ל־WhatsApp נמחק בהצלחה");
		} else {
		return res.send("⚠️ לא נמצאו נתוני חיבור למחיקה");
		}
	} catch (err) {
		console.error("❌ שגיאה במחיקת החיבור:", err);
		res.status(500).send("❌ שגיאה במחיקת החיבור");
	}
});





// ==================== START SERVER ====================
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});


// ==================== START SERVER IMMEDIATELY ====================

//// מריץ את ה-whatsapp ברקע בלי לעכב את השרת
//startServices().catch((err) => {
//    console.error("❌ Failed to start services:", err);
//});

startServices()
    .then(() => {
        state.isWhatsappConnected = true; // ✅ מעדכנים שהוואטסאפ מחובר
    })
    .catch((err) => {
        console.error("❌ Failed to start services:", err);
    });