const express = require('express');
const https = require('https');
const app = express();

app.use(express.json());

// Built-in HTTPS Helper (No extra dependency, zero crash chance)
function sendTelegramRequest(token, method, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${token}/${method}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => responseBody += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(responseBody)); }
                catch (e) { resolve({ ok: false, error: 'Invalid JSON response' }); }
            });
        });

        req.on('error', (err) => resolve({ ok: false, error: err.message }));
        req.write(data);
        req.end();
    });
}

// Simple Web Page Hit Helper for Views
function hitWebPage(url) {
    return new Promise((resolve) => {
        https.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MagicScriptsEngine/1.0' }
        }, (res) => {
            resolve(true);
        }).on('error', () => resolve(false));
    });
}

// -------------------------------------------------------------
// ROUTES
// -------------------------------------------------------------

// Main Installer Endpoint
app.all('/api', async (req, res) => {
    // GET aur POST dono parameters handle karne ke liye merge query
    const query = { ...req.query, ...req.body };
    const token = query.token;
    const status = query.status || "true";
    const adminId = query.admin || ""; 
    const welcomeMsg = query.msg || "Hello dear *{name}*! I am Views & Reaction Bot 🤖";
    const defaultViews = query.views || "20";

    if (!token) {
        return res.status(200).json({ status: "error", message: "Please enter a valid bot token!" });
    }

    if (status === "true") {
        const encodedMsg = encodeURIComponent(welcomeMsg);
        const domain = req.headers['x-forwarded-host'] || req.headers.host;
        const webhookUrl = `https://${domain}/api/webhook?token=${token}&admin=${adminId}&msg=${encodedMsg}&views=${defaultViews}`;

        const data = await sendTelegramRequest(token, 'setWebhook', { 
            url: webhookUrl,
            allowed_updates: ["message", "callback_query", "channel_post"]
        });

        if (data.ok) {
            return res.status(200).json({ status: "success", message: "Bot successfully installed and configured!" });
        } else {
            return res.status(200).json({ status: "error", telegram_error: data.description });
        }
    } else {
        const data = await sendTelegramRequest(token, 'deleteWebhook', {});
        if (data.ok) {
            return res.status(200).json({ status: "success", message: "Bot successfully uninstalled!" });
        } else {
            return res.status(200).json({ status: "error", telegram_error: data.description });
        }
    }
});

// Webhook Handler
app.post('/api/webhook', async (req, res) => {
    const { token, admin: adminId, msg: welcomeMsg, views: currentViewsSetting } = req.query;
    const update = req.body;

    if (!token) return res.sendStatus(200);
    const viewsLimit = parseInt(currentViewsSetting || "20");

    // ⚡ FEATURE A: CHANNEL POST VIEWS & REACTIONS
    if (update.channel_post) {
        const channelPost = update.channel_post;
        const msgId = channelPost.message_id;
        const chatId = channelPost.chat.id;
        const channelUsername = channelPost.chat.username;

        const globalEmojis = ["👍", "❤️", "🔥", "🥰", "🎉", "🤩", "👌", "💯", "⚡", "😎"];
        const randomEmoji = globalEmojis[Math.floor(Math.random() * globalEmojis.length)];
        
        await sendTelegramRequest(token, 'setMessageReaction', {
            chat_id: chatId,
            message_id: msgId,
            reaction: [{ type: "emoji", emoji: randomEmoji }],
            is_big: true
        });

        if (channelUsername) {
            const cleanPostUrl = `https://t.me/${channelUsername}/${msgId}?embed=1`;
            const viewHits = [];
            for (let i = 0; i < viewsLimit; i++) {
                viewHits.push(hitWebPage(cleanPostUrl));
            }
            Promise.all(viewHits).catch(() => null);
        }
        return res.sendStatus(200);
    }

    // ⚡ FEATURE B: PRIVATE MESSAGE HANDLER
    if (update.message) {
        const message = update.message;
        const chatId = message.chat.id;
        const chatType = message.chat.type;
        const msgText = message.text ? message.text.trim() : "";
        const user = message.from;

        if (chatType === 'private' && msgText === '/start') {
            const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
            const username = user.username ? `@${user.username}` : "None";

            if (adminId) {
                const adminText = `🔔 *New User Started Bot* 🔔\n\n*Name:* ${fullName}\n*Username:* ${username}\n*ID:* \`${chatId}\``;
                await sendTelegramRequest(token, 'sendMessage', {
                    chat_id: adminId,
                    text: adminText,
                    parse_mode: "Markdown"
                });
            }

            let finalWelcome = welcomeMsg.replace(/{name}/g, fullName).replace(/{username}/g, username);
            const botDetails = await sendTelegramRequest(token, 'getMe', {});
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

    // ⚡ FEATURE C: INLINE BUTTONS ACTIONS
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

        if (callbackData.startsWith('set_views_')) {
            const newLimit = callbackData.split('_')[2]; 
            const domain = req.headers['x-forwarded-host'] || req.headers.host;
            const encodedMsg = encodeURIComponent(welcomeMsg);
            
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
