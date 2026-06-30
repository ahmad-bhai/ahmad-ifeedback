const https = require('https');
const urlModule = require('url');

// ⏱️ SPEED MATRIX CONFIGURATION (Ahmad Bhai's Requirement)
const SPEED_DELAY_MAP = {
    "slow": 600000,       // 10 Minutes delay
    "normal": 300000,     // 5 Minutes delay
    "fast": 60000,        // 1 Minute delay
    "very_fast": 30000,   // 30 Seconds delay
    "ultra": 0            // Instant (Foran)
};

// ⚡ Heavy-Duty Telegram API Request Engine
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

// 🌐 Advanced Telegram View Controller (Emulates Real User View Injection)
function fireSingleViewHit(targetUrl) {
    return new Promise((resolve) => {
        const options = {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Referer': 'https://t.me/', // Telegram require counters mapping link
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        const req = https.get(targetUrl, options, (res) => {
            res.resume(); // Free memory buffer memory instantly
            resolve(true);
        });
        req.on('error', () => resolve(false));
    });
}

// 🚀 Core Vercel Serverless Function Handler
module.exports = async (req, res) => {
    // Enable CORS requests across handlers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const parsedUrl = urlModule.parse(req.url, true);
    const queryParams = parsedUrl.query;

    // -------------------------------------------------------------------------
    // 🎛️ SECTION 1: WEBHOOK DISPATCHER SYSTEM (?route=webhook)
    // -------------------------------------------------------------------------
    if (queryParams.route === 'webhook') {
        const { token, admin: adminId, msg: welcomeMsg, views: currentViewsSetting, speed: activeSpeed = 'ultra' } = queryParams;
        const update = req.body;

        if (!token || !update) return res.status(200).send('OK');
        const totalViewsToInject = parseInt(currentViewsSetting || "20");

        // 🔥 FEATURE A: MULTI-SPEED CHANNEL POST VIEWS BOOSTER (PUBLIC + PRIVATE)
        if (update.channel_post) {
            const channelPost = update.channel_post;
            const msgId = channelPost.message_id;
            const chatId = channelPost.chat.id;
            const channelUsername = channelPost.chat.username || null;

            // Step 1: Format target URL safe parameters
            let targetViewUrl = '';
            if (channelUsername) {
                targetViewUrl = `https://t.me/${channelUsername}/${msgId}?embed=1`;
            } else {
                const cleanId = Math.abs(parseInt(chatId)).toString().replace(/^100/, '');
                targetViewUrl = `https://t.me/c/${cleanId}/${msgId}?embed=1`;
            }

            // Step 2: Fetch assigned processing latency from Speed Matrix
            const processDelay = SPEED_DELAY_MAP[activeSpeed.toLowerCase()] || 0;

            if (processDelay > 0) {
                // Delayed processing mapping (Slow, Normal, Fast, Very Fast)
                setTimeout(async () => {
                    const viewsBatch = [];
                    for (let i = 0; i < totalViewsToInject; i++) {
                        viewsBatch.push(fireSingleViewHit(targetViewUrl));
                    }
                    await Promise.all(viewsBatch);
                }, processDelay);
            } else {
                // Ultra Fast System (Foran Execution)
                const viewsBatch = [];
                for (let i = 0; i < totalViewsToInject; i++) {
                    viewsBatch.push(fireSingleViewHit(targetViewUrl));
                }
                await Promise.all(viewsBatch);
            }

            return res.status(200).send('OK');
        }

        // 🔥 FEATURE B: STABLE PRIVATE CHAT /START CONTROLLER (INLINE KEYBOARD BUILT-IN)
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
                    const adminAlertText = `🔔 New User Hooked\n\nName: ${fullName}\nUsername: ${username}\nID: ${chatId}`;
                    await sendTelegramRequest(token, 'sendMessage', { chat_id: adminId, text: adminAlertText });
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

                // Direct UI engine messaging without formatting parameters to eliminate inline break bugs
                await sendTelegramRequest(token, 'sendMessage', {
                    chat_id: chatId,
                    text: finalWelcome,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "➕ Add to Channel", url: `https://t.me/${botName}?startchannel=true` }],
                            [{ text: "⚙️ Settings Menu", callback_data: "open_settings_menu" }]
                        ]
                    }
                });
            }
            return res.status(200).send('OK');
        }

        // 🔥 FEATURE C: INTERACTIVE CONFIGURATION CONTROLS (VIEWS & SPEED SWITCHER)
        if (update.callback_query) {
            const callbackQuery = update.callback_query;
            const callbackData = callbackQuery.data;
            const messageId = callbackQuery.message.message_id;
            const chatId = callbackQuery.message.chat.id;

            const refreshScreen = async (text, keyboard) => {
                await sendTelegramRequest(token, 'editMessageText', {
                    chat_id: chatId,
                    message_id: messageId,
                    text: text,
                    reply_markup: { inline_keyboard: keyboard }
                });
            };

            const domain = req.headers['x-forwarded-host'] || req.headers.host;

            // Menu Screen router
            if (callbackData === 'open_settings_menu') {
                const configText = `⚙️ Configuration Panel\n\nCurrent Setup:\n- Views/Post: ${totalViewsToInject}\n- Delivery Speed: ${activeSpeed.toUpperCase()}\n\nSelect a feature parameter to change:`;
                const mainKeyboard = [
                    [{ text: "🔢 Adjust Views Count", callback_data: "view_submenu" }],
                    [{ text: "⚡ Adjust Injector Speed", callback_data: "speed_submenu" }]
                ];
                await refreshScreen(configText, mainKeyboard);
            }

            // Views Setup Router
            if (callbackData === 'view_submenu') {
                const text = `🔢 Modify Total Views Counter Target:`;
                const keyboard = [
                    [
                        { text: totalViewsToInject === 5 ? "✅ 5 Views" : "5 Views", callback_data: "save_v_5" },
                        { text: totalViewsToInject === 10 ? "✅ 10 Views" : "10 Views", callback_data: "save_v_10" },
                        { text: totalViewsToInject === 20 ? "✅ 20 Views" : "20 Views", callback_data: "save_v_20" }
                    ],
                    [{ text: "🔙 Back to Dashboard", callback_data: "open_settings_menu" }]
                ];
                await refreshScreen(text, keyboard);
            }

            if (callbackData.startsWith('save_v_')) {
                const targetViews = callbackData.split('_')[2];
                const newWebhookUrl = `https://${domain}/api?route=webhook&token=${token}&admin=${adminId}&msg=${welcomeMsg}&views=${targetViews}&speed=${activeSpeed}`;
                await sendTelegramRequest(token, 'setWebhook', { url: newWebhookUrl });

                const text = `ℹ️ Success!\nViews updated to: ${targetViews} per post.`;
                const keyboard = [[{ text: "🔙 Main Menu", callback_data: "open_settings_menu" }]];
                await refreshScreen(text, keyboard);
            }

            // Speed Setup Router (Ahmad Bhai's 5 Speed Protocol Layout)
            if (callbackData === 'speed_submenu') {
                const text = `⚡ Select View Generation Speed Engine:\n\n🐢 Slow = 10 Min\n🚶 Normal = 5 Min\n⚡ Fast = 1 Min\n🚀 Very Fast = 30 Sec\n🔥 Ultra Fast = Instant`;
                const keyboard = [
                    [
                        { text: activeSpeed === 'slow' ? "✅ Slow" : "Slow", callback_data: "save_s_slow" },
                        { text: activeSpeed === 'normal' ? "✅ Normal" : "Normal", callback_data: "save_s_normal" }
                    ],
                    [
                        { text: activeSpeed === 'fast' ? "✅ Fast" : "Fast", callback_data: "save_s_fast" },
                        { text: activeSpeed === 'very_fast' ? "✅ V.Fast" : "V.Fast", callback_data: "save_s_very_fast" }
                    ],
                    [{ text: activeSpeed === 'ultra' ? "✅ Ultra Fast" : "Ultra Fast", callback_data: "save_s_ultra" }],
                    [{ text: "🔙 Back to Dashboard", callback_data: "open_settings_menu" }]
                ];
                await refreshScreen(text, keyboard);
            }

            if (callbackData.startsWith('save_s_')) {
                const chosenSpeed = callbackData.replace('save_s_', '');
                const newWebhookUrl = `https://${domain}/api?route=webhook&token=${token}&admin=${adminId}&msg=${welcomeMsg}&views=${totalViewsToInject}&speed=${chosenSpeed}`;
                await sendTelegramRequest(token, 'setWebhook', { url: newWebhookUrl });

                const text = `ℹ️ Success!\nDelivery Engine Speed profile updated to: ${chosenSpeed.toUpperCase()}`;
                const keyboard = [[{ text: "🔙 Main Menu", callback_data: "open_settings_menu" }]];
                await refreshScreen(text, keyboard);
            }

            await sendTelegramRequest(token, 'answerCallbackQuery', { callback_query_id: callbackQuery.id });
            return res.status(200).send('OK');
        }
    }

    // -------------------------------------------------------------------------
    // 🌐 SECTION 2: INITIAL SYSTEM GATEWAY / MOUNT URL (Default Path)
    // -------------------------------------------------------------------------
    const baseInput = { ...queryParams, ...req.body };
    const systemToken = baseInput.token;
    const systemStatus = baseInput.status || "true";
    const adminId = baseInput.admin || ""; 
    const welcomeMsg = baseInput.msg || "Hello dear {name}! I am Views Bot 🤖";
    const initialViews = baseInput.views || "20";
    const initialSpeed = baseInput.speed || "ultra";

    if (!systemToken) {
        return res.status(200).json({ status: "error", message: "Missing bot authentication token!" });
    }

    if (systemStatus === "true") {
        const encodedWelcome = encodeURIComponent(welcomeMsg);
        const domain = req.headers['x-forwarded-host'] || req.headers.host;
        const systemWebhookUrl = `https://${domain}/api?route=webhook&token=${systemToken}&admin=${adminId}&msg=${encodedWelcome}&views=${initialViews}&speed=${initialSpeed}`;

        const callbackCheck = await sendTelegramRequest(systemToken, 'setWebhook', { 
            url: systemWebhookUrl,
            allowed_updates: ["message", "callback_query", "channel_post"]
        });

        if (callbackCheck.ok) {
            return res.status(200).json({ status: "success", message: "System activated on serverless web router!" });
        } else {
            return res.status(200).json({ status: "error", telegram_error: callbackCheck.description });
        }
    } else {
        const callbackCheck = await sendTelegramRequest(systemToken, 'deleteWebhook', {});
        if (callbackCheck.ok) {
            return res.status(200).json({ status: "success", message: "System uninstalled securely." });
        } else {
            return res.status(200).json({ status: "error", telegram_error: callbackCheck.description });
        }
    }
};
