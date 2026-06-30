const https = require('https');
const urlModule = require('url');

// Strict HTTPS Request Helper
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
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => responseBody += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(responseBody)); }
                catch (e) { resolve({ ok: false }); }
            });
        });

        req.on('error', () => resolve({ ok: false }));
        req.write(data);
        req.end();
    });
}

// Fixed Serverless View Hit Generator (Forces Vercel to wait)
function hitWebPage(url) {
    return new Promise((resolve) => {
        const req = https.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MagicScripts/3.0' }
        }, (res) => {
            res.resume(); // Consume response to free memory
            resolve(true);
        });
        req.on('error', () => resolve(false));
    });
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const parsedUrl = urlModule.parse(req.url, true);
    const queryParams = parsedUrl.query;

    // -------------------------------------------------------------
    // WEBHOOK HANDLER ENGINE (?route=webhook)
    // -------------------------------------------------------------
    if (queryParams.route === 'webhook') {
        const { token, admin: adminId, msg: welcomeMsg, views: currentViewsSetting } = queryParams;
        const update = req.body;

        if (!token || !update) return res.status(200).send('OK');
        const viewsLimit = parseInt(currentViewsSetting || "20");

        // ⚡ FEATURE A: AUTO VIEWS & REACTIONS (PUBLIC & PRIVATE)
        if (update.channel_post) {
            const channelPost = update.channel_post;
            const msgId = channelPost.message_id;
            const chatId = channelPost.chat.id;
            const channelUsername = channelPost.chat.username || null;

            // 1. Fire Reaction
            const globalEmojis = ["👍", "❤️", "🔥", "🥰", "🎉", "🤩", "👌", "💯", "⚡", "😎"];
            const randomEmoji = globalEmojis[Math.floor(Math.random() * globalEmojis.length)];
            await sendTelegramRequest(token, 'setMessageReaction', {
                chat_id: chatId,
                message_id: msgId,
                reaction: [{ type: "emoji", emoji: randomEmoji }]
            });

            // 2. Generate Target URL for Views
            let targetUrl = '';
            if (channelUsername) {
                targetUrl = `https://t.me/${channelUsername}/${msgId}?embed=1`;
            } else {
                const cleanId = Math.abs(parseInt(chatId)).toString().replace(/^100/, '');
                targetUrl = `https://t.me/c/${cleanId}/${msgId}?embed=1`;
            }

            // 3. Strict Serverless Wait Loop (Vercel stops until this finishes)
            const viewHits = [];
            for (let i = 0; i < viewsLimit; i++) {
                viewHits.push(hitWebPage(targetUrl));
            }
            await Promise.all(viewHits); 

            return res.status(200).send('OK');
        }

        // ⚡ FEATURE B: PRIVATE CHAT /START WITH INLINE BUTTONS
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
                    const adminText = `🔔 New User Started Bot\n\nName: ${fullName}\nUsername: ${username}\nID: ${chatId}`;
                    await sendTelegramRequest(token, 'sendMessage', { chat_id: adminId, text: adminText });
                }

                let finalWelcome = "";
                if (welcomeMsg) {
                    try { finalWelcome = decodeURIComponent(welcomeMsg).replace(/{name}/g, fullName).replace(/{username}/g, username); }
                    catch(e) { finalWelcome = welcomeMsg.replace(/{name}/g, fullName).replace(/{username}/g, username); }
                }
                if (!finalWelcome || finalWelcome.trim() === "") {
                    finalWelcome = `Hello ${fullName}! I am views bot add to channel`;
                }
                
                const botDetails = await sendTelegramRequest(token, 'getMe', {});
                const botName = botDetails.ok ? botDetails.result.username : "bot";

                // Sent normal raw text text without formatting bugs to guarantee buttons display
                await sendTelegramRequest(token, 'sendMessage', {
                    chat_id: chatId,
                    text: finalWelcome,
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

        // ⚡ FEATURE C: INLINE BUTTONS CONFIGURATION MENU
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
                    reply_markup: { inline_keyboard: keyboard }
                });
            };

            if (callbackData === 'open_settings') {
                const text = `🛠️ Bot Configuration Panel\n\nCurrent Plan: ${viewsLimit} Views/Post\n\nChoose an option below:`;
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

                const text = `ℹ️ Success! Views limit updated to ${newLimit}.\n\nYour bot will now trigger ${newLimit} views per post.`;
                const keyboard = [[{ text: "🔙 Back to Settings", callback_data: "open_settings" }]];
                await editMessage(text, keyboard);
            }

            if (callbackData === 'back_main') {
                const text = `Bot Dashboard Active 🤖\n\nManage settings above or add me to a channel.`;
                const keyboard = [[{ text: "⚙️ Bot Settings Menu", callback_data: "open_settings" }]];
                await editMessage(text, keyboard);
            }

            await sendTelegramRequest(token, 'answerCallbackQuery', { callback_query_id: callbackQuery.id });
            return res.status(200).send('OK');
        }
    }

    // -------------------------------------------------------------
    // INSTALLATION GATEWAY (Default Route)
    // -------------------------------------------------------------
    const query = { ...queryParams, ...req.body };
    const token = query.token;
    const status = query.status || "true";
    const adminId = query.admin || ""; 
    const welcomeMsg = query.msg || "Hello dear {name}! I am Views Bot 🤖";
    const defaultViews = query.views || "20";

    if (!token) {
        return res.status(200).json({ status: "error", message: "Missing bot token!" });
    }

    if (status === "true") {
        const encodedMsg = encodeURIComponent(welcomeMsg);
        const domain = req.headers['x-forwarded-host'] || req.headers.host;
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
};
