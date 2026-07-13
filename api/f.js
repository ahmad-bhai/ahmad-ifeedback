const express = require('express');
const axios = require('axios'); // Firebase fetch karne ke liye axios ya standard fetch use karein
const app = express();

const projectID = "reactions-maker-site";
const dbURL = `https://${projectID}-default-rtdb.firebaseio.com/users.json`;

// Yeh function Firebase se link connect karke ID verify karega
async function verifyUserIdentity(req, res) {
    try {
        // URL parameters se id nikali (Jaise: ?id=68052023345055455997 ya seedha string matching)
        let incomingId = req.query.id;
        
        // Agar explicit parameters nahi mila, toh search query pattern fallback check karega
        if (!incomingId) {
            const fullUrl = req.originalUrl;
            const match = fullUrl.match(/[?&]id=([0-9]+)/);
            incomingId = match ? match[1] : null;
        }

        if (!incomingId) {
            return res.status(400).json({ success: false, authorized: false, error: "ID parameter missing" });
        }

        // Firebase real-time database hit kiya
        const response = await axios.get(dbURL);
        const allUsers = response.data;

        let isRegisteredUser = false;

        if (allUsers) {
            // Firebase ke andar unique string keys (Jaise: "Ox6U3GqRFUOQpp_rrhI") ko scan karna
            for (let key in allUsers) {
                if (allUsers[key] && allUsers[key].id === incomingId.trim()) {
                    // Check user status active hai ya nahi
                    if (allUsers[key].status === "active") {
                        isRegisteredUser = true;
                    }
                    break;
                }
            }
        }

        // Response format: Agar database mein mili toh true, warna false
        return res.status(200).json({ 
            authorized: isRegisteredUser 
        });

    } catch (error) {
        console.error("Firebase Auth Bridge Error:", error.message);
        return res.status(500).json({ authorized: false, error: "Internal Auth Verification System Failure" });
    }
}

// ─── ROUTES CONFIGURATION (Dono patterns handle honge) ───
app.get('/f', verifyUserIdentity);
app.get('/api/f.js', verifyUserIdentity);

module.exports = app;
