const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use(express.json());

const DEVELOPER = "@Magic\\_Scripts"; 
const DEVELOPER_PLAIN = "@Magic_Scripts"; 

// Helper: Telegram Bot API Request Handler
async function sendTelegramRequest(token, method, body) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return await response.json();
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

// -------------------------------------------------------------
// 1. DYNAMIC INSTALL / UNINSTALL ENDPOINT
// -------------------------------------------------------------
app.get('/api', async (req, res) => {
    let token = req.query.token;
    if (!token && req.url.includes('token=')) {
        const match = req.url.match(/token=([^&]+)/);
        if (match) token = match[1];
    }

    const status = req.query.status || "true";
    const adminId = req.query.admin || ""; 
    const welcomeMsg = req.query.msg || "Hello dear *{name}*! I am Views & Reaction Bot 🤖";
    const defaultViews = req.query.views || "20"; // 5, 10, 20 (Default 20)

    if (!token) {
        return res.status(400).json({ status: "error", message: "Please enter a valid bot token!" });
    }

    if (status === "true") {
        const encodedMsg = encodeURIComponent(welcomeMsg);
        const domain = req.headers['x-forwarded-host'] || req.headers.host;
        
        // Saari settings (admin, msg, current views configuration) Webhook URL mein save ho rahi hain
        const webhookUrl = `https://${domain}/api/webhook?token=${token}&admin=${adminId}&msg=${encodedMsg}&views=${defaultViews}`;

        const data = await sendTelegramRequest(token, 'setWebhook', { 
            url: webhookUrl,
            allowed_updates: ["message", "callback_query", "channel_post"]
        });

        if (data.ok) {
            return res.json({ 
                status: "success", 
                message: "Bot successfully installed and configured!",
                developer: DEVELOPER_PLAIN 
            });
        } else {
            return res.status(400).json({ status: "error", telegram_error: data.description });
        }
    } else {
        const data = await sendTelegramRequest(token, 'deleteWebhook', {});
        if (data.ok) {
            return res.json({ status: "success", message: "Bot successfully uninstalled!" });
        } else {
            return res.status(400).json({ status: "error", telegram_error: data.description });
        }
    }
});

// -------------------------------------------------------------
// 2. MAIN WEBHOOK HANDLER (Dono bots ka system ek mein handle)
// -------------------------------------------------------------
app.post('/api/webhook', async (req, res) => {
    const { token, admin: adminId, msg: welcomeMsg, views: currentViewsSetting } = req.query;
    const update = req.body;

    if (!token) return res.sendStatus(200);
    const viewsLimit = parseInt(currentViewsSetting || "20");

    // ⚡ FEATURE A: CHANNEL POST VIEWS & REACTIONS LOOP
    if (update.channel_post) {
        const channelPost = update.channel_post;
        const msgId = channelPost.message_id;
        const chatId = channelPost.chat.id;
        const channelUsername = channelPost.chat.username;

        // 1. Auto Reaction Logic (Lightweight Array)
        const globalEmojis = ["👍", "❤️", "🔥", "🥰", "🎉", "🤩", "👌", "💯", "⚡", "😎"];
        const randomEmoji = globalEmojis[Math.floor(Math.random() * globalEmojis.length)];
        
        await sendTelegramRequest(token, 'setMessageReaction', {
            chat_id: chatId,
            message_id: msgId,
            reaction: [{ type: "emoji", emoji: randomEmoji }],
            is_big: true
        });

        // 2. Pure Web-Hit Views Booster Protocol (Safe & Free Loop)
        if (channelUsername) {
            const cleanPostUrl = `https://t.me/${channelUsername}/${msgId}`;
            const viewHits = [];
            
            // Jitni user ki settings hai (5, 10, ya 20), utni baar dynamic lightweight page hits generate honge
            for (let i = 0; i < viewsLimit; i++) {
                viewHits.push(
                    fetch(`${cleanPostUrl}?embed=1`, {
                        headers: { 'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 MagicScriptsEngine/${i}` }
                    }).catch(() => null)
                );
            }
            // Background mein parallel processing taake server timeout na kare
            Promise.all(viewHits).then(() => console.log(`[Magic] Sent ${viewsLimit} Web-Views.`));
        }
        return res.sendStatus(200);
    }

    // ⚡ FEATURE B: PRIVATE MESSAGE HANDLER (/start & Admin Alerts)
    if (update.message) {
        const message = update.message;
        const chatId = message.chat.id;
        const msgId = message.message_id;
        const chatType = message.chat.type;
        const msgText = message.text ? message.text.trim() : "";
        const user = message.from;

        if (chatType === 'private' && msgText === '/start') {
            const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
            const username = user.username ? `@${user.username}` : "None";

            // 1. Admin Start Alert (Agar Admin URL se set hai)
            if (adminId) {
                const adminText = `🔔 *New User Started Bot* 🔔\n\n*Name:* ${fullName}\n*Username:* ${username}\n*ID:* \`${chatId}\``;
                await sendTelegramRequest(token, 'sendMessage', {
                    chat_id: adminId,
                    text: adminText,
                    parse_mode: "Markdown"
                });
            }

            // 2. Customized Welcome Message
            let finalWelcome = welcomeMsg.replace(/{name}/g, fullName).replace(/{username}/g, username);
            
            let botDetails = await sendTelegramRequest(token, 'getMe', {});
            const botName = botDetails.ok ? botDetails.result.username : "bot";

            await sendTelegramRequest(token, 'sendMessage', {
                chat_id: chatId,
                text: `*${finalWelcome}*`,
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "➕ Add to Channel", url: `https://t.me/${botName}?startchannel=true` }],
                        [{ text: "⚙️ Bot Settings Menu", callback_data: "open_settings" }]
                    ]
                }
            });
        }
        return res.sendStatus(200);
    }

    // ⚡ FEATURE C: INLINE BUTTONS ACTIONS (Settings Configuration: 5, 10, 20 Views)
    if (update.callback_query) {
        const callbackQuery = update.callback_query;
        const callbackData = callbackQuery.data;
        const messageId = callbackQuery.message.message_id;
        const chatId = callbackQuery.message.chat.id;

        const editMessage = async (text, keyboard) => {
            await sendTelegramRequest(token, 'editMessageText', {
                chat_id: chatId,
                message_id: messageId,
                text: text,
                parse_mode: "Markdown",
                reply_markup: { inline_keyboard: keyboard }
            });
        };

        if (callbackData === 'open_settings') {
            const text = `🛠️ *Bot Configuration Panel*\n\nCurrent Views Plan: *${viewsLimit} Views/Post*\n\nNiche diye gaye options se views limit change karein:`;
            const keyboard = [
                [
                    { text: viewsLimit === 5 ? "✅ 5 Views" : "5 Views", callback_data: "set_views_5" },
                    { text: viewsLimit === 10 ? "✅ 10 Views" : "10 Views", callback_data: "set_views_10" },
                    { text: viewsLimit === 20 ? "✅ 20 Views" : "20 Views", callback_data: "set_views_20" }
                ],
                [{ text: "🔙 Back", callback_data: "back_main" }]
            ];
            await editMessage(text, keyboard);
        }

        // Jab user limit par click karega, hum backend par webhook ka dynamic variable redirect kar denge!
        if (callbackData.startsWith('set_views_')) {
            const newLimit = callbackData.split('_')[2]; 
            const domain = req.headers['x-forwarded-host'] || req.headers.host;
            const encodedMsg = encodeURIComponent(welcomeMsg);
            
            // Webhook update automatic on the fly!
            const newWebhookUrl = `https://${domain}/api/webhook?token=${token}&admin=${adminId}&msg=${encodedMsg}&views=${newLimit}`;
            await sendTelegramRequest(token, 'setWebhook', { url: newWebhookUrl });

            const text = `ℹ️ *Success!* Views limit state updated to *${newLimit}*.\n\nAb aapka bot har post par ${newLimit} views trigger karega.`;
            const keyboard = [[{ text: "🔙 Back to Settings", callback_data: "open_settings" }]];
            await editMessage(text, keyboard);
        }

        if (callbackData === 'back_main') {
            const text = `*Bot Dashboard Active* 🤖\n\nSettings tab upar se manage karein ya channel me add karein.`;
            const keyboard = [[{ text: "⚙️ Bot Settings Menu", callback_data: "open_settings" }]];
            await editMessage(text, keyboard);
        }

        await sendTelegramRequest(token, 'answerCallbackQuery', { callback_query_id: callbackQuery.id });
    }

    res.sendStatus(200);
});

module.exports = app;
