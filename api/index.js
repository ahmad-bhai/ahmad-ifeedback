const express = require('express');
const { TelegramClient, Api } = require('gramjs');
const { StringSession } = require('gramjs/sessions');
const fetch = require('node-fetch');
const app = express();

app.use(express.json());

// -------------------------------------------------------------
// CONFIGURATION: Ahmad Bhai Ke Custom App Credentials (Fixed)
// -------------------------------------------------------------
const API_ID = 35997007; 
const API_HASH = "66285b6209f58fc4350cc7de46016887"; 

// Helper function: Ek single account session se view hit karna
async function triggerSingleAccountView(stringSession, channelUsername, messageId) {
    const session = new StringSession(stringSession);
    
    // connectionRetries: 1 taake agar network slow ho toh serverless function hang na ho
    const client = new TelegramClient(session, API_ID, API_HASH, { 
        connectionRetries: 1,
        deviceModel: "Achatgram App",
        systemVersion: "Production Engine"
    });

    try {
        await client.connect();
        
        // Telegram Core (MTProto) Method jo counter increment karta hai
        await client.invoke(
            new Api.messages.GetMessagesViews({
                peer: channelUsername,
                id: [parseInt(messageId)],
                increment: true 
            })
        );
        console.log(`[Magic Views] Success: 1 View from session ${stringSession.substring(0, 8)}...`);
    } catch (err) {
        console.error(`[Magic Views] Error in session:`, err.message);
    } finally {
        await client.disconnect(); // Connection close karna zaroori hai memory leak bachane keliye
    }
}

// -------------------------------------------------------------
// 1. SET-UP ENDPOINT: Panel se auto-views system link karne keliye
// -------------------------------------------------------------
app.get('/api/setup-views', async (req, res) => {
    let token = req.query.token;
    const sessions = req.query.sessions; // Comma-separated string sessions (sess1,sess2,sess3...)

    if (!token || !sessions) {
        return res.status(400).json({ 
            status: "error", 
            message: "Ahmad Bhai, Bot token aur accounts ke string sessions dono bhejna zaroori hai!" 
        });
    }

    const domain = req.headers['x-forwarded-host'] || req.headers.host;
    // Saare 20 sessions ko URL ke andar encode karke webhook URL mein hamesha keliye lock kar diya
    const webhookUrl = `https://${domain}/api/views-webhook?sessions=${encodeURIComponent(sessions)}`;

    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${webhookUrl}&allowed_updates=["channel_post"]`);
        const data = await response.json();

        if (data.ok) {
            return res.json({ 
                status: "success", 
                message: "Magic Auto-Views System successfully activated on Achatgram Engine! 🚀",
                total_sessions: sessions.split(',').length
            });
        } else {
            return res.status(400).json({ status: "error", telegram_error: data.description });
        }
    } catch (e) {
        return res.status(500).json({ status: "error", message: e.message });
    }
});

// -------------------------------------------------------------
// 2. WEBHOOK ENDPOINT: Nayi post aate hi automatic saare accounts active honge
// -------------------------------------------------------------
app.post('/api/views-webhook', async (req, res) => {
    const { sessions } = req.query;
    const update = req.body;

    // Agar updates mein channel post nahi hai ya sessions khali hain toh instant response do
    if (!sessions || !update.channel_post) {
        return res.sendStatus(200);
    }

    const channelPost = update.channel_post;
    const messageId = channelPost.message_id;
    const channelUsername = channelPost.chat.username; 

    // Note: Channel Public hona chahiye (username ke sath) taake userbots usko globally access kar sakein
    if (!channelUsername) {
        console.log("[Magic Views] Ignored: Channel is private or doesn't have a username.");
        return res.sendStatus(200);
    }

    // Comma-separated sessions ko array mein convert kiya
    const sessionArray = sessions.split(',');

    // Saare accounts ko parallel execution (Promise.all) par lagaya taake sab ek sath hit karein
    const viewTasks = sessionArray.map(sessionStr => 
        triggerSingleAccountView(sessionStr.trim(), channelUsername, messageId)
    );

    // Background mein process chalne do aur Telegram ko 200 OK bhej do taake webhook retry na mare
    Promise.all(viewTasks)
        .then(() => console.log(`[Magic Views] Engine finished processing ${sessionArray.length} views.`))
        .catch(e => console.error("[Magic Views] Error in parallel processing queue:", e));

    res.sendStatus(200); 
});

module.exports = app;
              
