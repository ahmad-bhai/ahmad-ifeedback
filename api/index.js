const https = require('https');
const urlModule = require('url');

// Lightweight HTTPS Client Helper
function sendTelegramRequest(token, method, body) {
    return new Promise((resolve) => {
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
                catch (e) { resolve({ ok: false, error: 'Invalid JSON' }); }
            });
        });

        req.on('error', (err) => resolve({ ok: false, error: err.message }));
        req.write(data);
        req.end();
    });
}

function hitWebPage(url) {
    return new Promise((resolve) => {
        https.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MagicScriptsEngine/2.0' }
        }, () => resolve(true)).on('error', () => resolve(false));
    });
}

// Main Serverless Handler (Vercel Standard Format)
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const parsedUrl = urlModule.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // -------------------------------------------------------------
    // PATH 1: BOT SETUP / INSTALLATION (Endpoint: /api)
    // -------------------------------------------------------------
    if (pathname === '/api' || pathname === '/api/') {
        const query = { ...parsedUrl.query, ...req.body };
        const token = query.token;
        const status = query.status || "true";
        const adminId = query.admin || ""; 
        const welcomeMsg = query.msg || "Hello dear *{name}*! I am Views Bot 🤖";
        const defaultViews = query.views || "20";

        if (!token) {
            return res.status(200).json({ status: "error", message: "Missing bot token!" });
        }

        if (status === "true") {
            const encodedMsg = encodeURIComponent(welcomeMsg);
            const domain = req.headers['x-forwarded-host'] || req.headers.host;
            // Webhook setup mapping explicitly to our conditional router below
            const webhookUrl = `https://${domain}/api?route=webhook&token=${token}&admin=${adminId}&msg=${encodedMsg}&views=${defaultViews}`;

            const data = await sendTelegramRequest(token, 'setWebhook', { 
                url: webhookUrl,
                allowed_updates: ["message", "callback_query", "channel_post"]
            });

            if (data.ok) {
                return res.status(200).json({ status: "success", message: "Bot successfully installed!" });
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
    }

    // -------------------------------------------------------------
    // PATH 2: WEBHOOK EVENTS UPDATES (Triggered via ?route=webhook query parameter)
    // -------------------------------------------------------------
    const queryParams = parsedUrl.query;
    if (queryParams.route === 'webhook') {
        const { token, admin: adminId, msg: welcomeMsg, views: currentViewsSetting } = queryParams;
        const update = req.body;

        if (!token || !update) return res.status(200).send('OK');
        const viewsLimit = parseInt(currentViewsSetting || "20");

        // FEATURE A: CHANNEL POST AUTO VIEWS & REACTIONS
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
                await Promise.all(viewHits).catch(() => null);
            }
            return res.status(200).send('OK');
        }

        // FEATURE B: PRIVATE START MESSAGE WITH ADMIN ALERT
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
                    await sendTelegramRequest(token, 'sendMessage', { chat_id: adminId, text: adminText, parse_mode: "Markdown" });
                }

                let finalWelcome = decodeURIComponent(welcomeMsg || "").replace(/{name}/g, fullName).replace(/{username}/g, username);
                if(!finalWelcome) finalWelcome = `Hello ${fullName}! I am views bot add to channel`;
                
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
            return res.status(200).send('OK');
        }

        // FEATURE C: INLINE BUTTONS CONFIGURATION
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
                
                const newWebhookUrl = `https://${domain}/api?route=webhook&token=${token}&admin=${adminId}&msg=${welcomeMsg}&views=${newLimit}`;
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
            return res.status(200).send('OK');
        }
    }

    // Default Fallback Response
    return res.status(404).send('Not Found');
};
