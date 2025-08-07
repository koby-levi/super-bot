async function startBot() {
  const res = await fetch('/start-bot');
  const msg = await res.text();
  alert(msg);
  updateStatus(); // נעדכן את הסטטוס אחרי ההפעלה
}

async function stopBot() {
  const res = await fetch('/stop-bot');
  const msg = await res.text();
  alert(msg);
  updateStatus(); // נעדכן את הסטטוס אחרי הכיבוי
}

function linkWhatsapp() {
  window.location.href = '/connect-whatsapp';
}

// פונקציה לעדכון סטטוס במסך
async function updateStatus() {
  try {
    const res = await fetch('/status');
    const status = await res.json();

    let text = `🔌 חיבור WhatsApp: ${status.isWhatsappConnected ? 'מחובר ✅' : 'מנותק ❌'}<br>`;
    text += `🤖 סטטוס בוט: ${status.isBotActive ? 'פעיל 🟢' : 'כבוי 🔴'}`;
    
    document.getElementById('status').innerHTML = text;
  } catch (err) {
    document.getElementById('status').textContent = "שגיאה בטעינת סטטוס";
    console.error("Error updating status:", err);
  }
}


updateStatus();