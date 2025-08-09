async function startBot() {
  const res = await fetch('/start-bot');
  const msg = await res.text();
  alert(msg);
  updateStatus();
}

async function stopBot() {
  const res = await fetch('/stop-bot');
  const msg = await res.text();
  alert(msg);
  updateStatus();
}

function linkWhatsapp() {
  window.location.href = '/link-whatsapp';
}


async function removeWhatsapp() {
  const confirmDelete = confirm("⚠️ מחיקת הקישור תגרום לבוט להפסיק לפעול.\nהאם אתה בטוח שברצונך להמשיך?");
  if (!confirmDelete) return;

  const res = await fetch('/unlink-whatsapp', { method: 'DELETE' });
  const msg = await res.text();
  alert(msg);
  updateStatus();
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
