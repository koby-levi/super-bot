const fs = require('fs');
const path = require('path');
const { sendWhatsAppMessage } = require('../services/whatsappService');
const { getClient, setClient, clearExpiredClients } = require('./clientsManager');
//
const { addBlocked, isBlocked, clearExpiredBlocked } = require('./blockedManager');
//
const scenario = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../data/scenario.json'), 'utf-8')
);

const EXPIRATION_TIME = 5 * 60 * 1000; // 5 דקות
const MAX_ERRORS = 3;
async function handleMessage(platform, phone, text, isNewClient) {
	
	
  // מסירים חסימות שפגו (24 שעות = 86400000 מ"ש)
  //clearExpiredBlocked(24 * 60 * 60 * 1000);
  
  // ClearExpiredBlocked
  // 5 Min , 60 seconds in Min, 1000ms in second
  clearExpiredBlocked(5 * 60 * 1000);

  if (isBlocked(phone)) {
      console.log(`🚫 ${phone} חסום — מתעלמים מהודעה`);
      return;
  }

  await clearExpiredClients();

  const now = Date.now();
  let client = getClient(phone);

  // אם לקוח חדש או התגובה ישנה מדי - לאתחל
  if (!client || now - client.lastUpdated > EXPIRATION_TIME) {
    //client = { step: 'start', sentReply: false, lastUpdated: now };
	client = { step: 'start', sentReply: false, lastUpdated: now, errorCount: 0 };
    setClient(phone, client);
  }

  const input = text.trim();
  const step = client.step || 'start';
  const currentNode = scenario[step];

  if (!currentNode) {
    await sendWhatsAppMessage(phone, 'שגיאה במערכת. מתחילים מחדש...');
    //client = { step: 'start', sentReply: false, lastUpdated: now };
    client = { step: 'start', sentReply: false, lastUpdated: now, errorCount: 0 };
	setClient(phone, client);
    return;
  }

  switch (currentNode.type) {

    case 'choice': {
      if (!client.sentReply) {
        await sendWhatsAppMessage(phone, currentNode.reply);
        client.sentReply = true;
        client.lastUpdated = now;
        setClient(phone, client);
        break;
      }

      const nextStep = currentNode.options?.[input];
      if (nextStep && scenario[nextStep]) {
        const nextNode = scenario[nextStep];
		
		if(nextNode.type !== 'end')
			await sendWhatsAppMessage(phone, nextNode.reply);

        client.step = nextStep;
        client.sentReply = true;
        client.lastUpdated = now;
		client.errorCount = 0;
        setClient(phone, client);
      } else {
		//
		// העלאת מונה טעויות
        client.errorCount = (client.errorCount || 0) + 1;
        console.log(`⚠️ ${phone} טעה ${client.errorCount} פעמים`);

        if (client.errorCount >= MAX_ERRORS) {
          addBlocked(phone);
          await sendWhatsAppMessage(phone, "קיבלתי את הבקשה שלך, אחזור אליך בהקדם.");
          return;
        }
		
		//		
        await sendWhatsAppMessage(phone, currentNode.fallback || currentNode.reply);
        client.lastUpdated = now;
        setClient(phone, client);
      }
      break;
    }

    case 'freeText': {
      if (!client.sentReply) {
        await sendWhatsAppMessage(phone, currentNode.reply);
        client.sentReply = true;
        client.lastUpdated = now;
        setClient(phone, client);
      } else {
        const nextStep = currentNode.next;
        if (nextStep && scenario[nextStep]) {
          const nextNode = scenario[nextStep];
		  if(nextNode.type !== 'end')
			await sendWhatsAppMessage(phone, nextNode.reply);

          client.step = nextStep;
          client.sentReply = nextNode.type === 'message' ? true : false;
          client.lastUpdated = now;
		  client.errorCount = 0;
          setClient(phone, client);
        } else {
          //client = { step: 'start', sentReply: false, lastUpdated: now };
          client = { step: 'start', sentReply: false, lastUpdated: now, errorCount: 0 };
		  setClient(phone, client);
        }
      }
      break;
    }

    case 'wait': {
      const timeout = currentNode.timeout || EXPIRATION_TIME;
      const waitUntil = client.waitUntil || (now + timeout);

      if (now >= waitUntil) {
        if (!client.timeoutSent) {
          await sendWhatsAppMessage(phone, currentNode.timeoutMessage || 'לא קיבלנו תגובה. נשתמע בהמשך.');
          client.timeoutSent = true;
          client.step = currentNode.next || 'start';
          client.sentReply = false;
          client.waitUntil = undefined;
          client.lastUpdated = now;
          setClient(phone, client);
        }
      } else {
        client.waitUntil = waitUntil;
        client.lastUpdated = now;
        setClient(phone, client);
      }
      break;
    }

    case 'message': {
      if (!client.sentReply) {
        await sendWhatsAppMessage(phone, currentNode.reply);
        client.sentReply = true;
        client.lastUpdated = now;

        if (currentNode.next && scenario[currentNode.next]) {
          client.step = currentNode.next;
        }
        setClient(phone, client);
      }
	  //
	  const nextStep = currentNode.next;
      if (nextStep && scenario[nextStep]) {
        const nextNode = scenario[nextStep];
		if(nextNode.type !== 'end')
			await sendWhatsAppMessage(phone, nextNode.reply);
        
		client.step = nextStep;
        client.sentReply = true;
        client.lastUpdated = now;
		client.errorCount = 0;
        setClient(phone, client);
      }
	  //
      break;
    }

    case 'redirect': {
      const target = currentNode.next;
      if (target && scenario[target]) {
        client.step = target;
        client.sentReply = false;
        client.lastUpdated = now;
        setClient(phone, client);

        const nextNode = scenario[target];
        if (nextNode.type !== 'redirect') {
          await sendWhatsAppMessage(phone, nextNode.reply || '');
        }
      } else {
        await sendWhatsAppMessage(phone, 'שגיאה בהפניה.');
      }
      break;
    }

    case 'end': {
      // טיפוס מיוחד שנקרא בתוך ה-switch, לא נגיע אליו בפועל כי נבדוק מחוץ ל-switch
      break;
    }

    default: {
      await sendWhatsAppMessage(phone, 'שגיאה. מתחילים מחדש...');
      client = { step: 'start', sentReply: false, lastUpdated: now };
      setClient(phone, client);
      break;
    }
  }

  // בדיקה מרכזית אחרי ה-switch האם הלקוח הגיע לנוד סיום
  if (client.step === 'end') {
    const endNode = scenario['end'];
    if (endNode) {
      await sendWhatsAppMessage(phone, endNode.reply || 'להתראות!');

      // כאן אפשר לסכם ולשלוח מידע לקבוצה אישית או לבצע פעולות נוספות
      // דוגמה: שליחת הודעה לקבוצת ניהול עם פרטי הלקוח
      // await sendGroupNotification(`לקוח חדש סיים את התהליך: ${phone}`);

      // אתחול הלקוח לשלב ההתחלתי
      client = { step: 'start', sentReply: false, lastUpdated: now };
      setClient(phone, client);
    }
  }
}

module.exports = { handleMessage };
