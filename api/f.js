export default async function handler(req, res) {
    // CORS headers taake aap kisi bhi site se fetch kar sakein
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    try {
        // URL parameters se ID nikalna (?id=...)
        const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
        let incomingId = searchParams.get('id');

        if (!incomingId) {
            return res.status(200).json({ authorized: false, error: "ID parameters clear nahi hain" });
        }

        const projectID = "reactions-maker-site";
        const dbURL = `https://${projectID}-default-rtdb.firebaseio.com/users.json`;

        // Bina kisi package ke direct native fetch use kiya
        const response = await fetch(dbURL);
        
        if (!response.ok) {
            return res.status(200).json({ authorized: false, error: "Firebase connection issue" });
        }

        const allUsers = await response.json();
        let isRegisteredUser = false;

        if (allUsers) {
            // Poore object ko depth mein loop kiya jo aapne format diya tha
            for (let key in allUsers) {
                if (allUsers[key] && String(allUsers[key].id) === String(incomingId).trim()) {
                    if (allUsers[key].status === "active") {
                        isRegisteredUser = true;
                    }
                    break;
                }
            }
        }

        // Exact true / false response jaisa aapne manga tha
        return res.status(200).json({ 
            authorized: isRegisteredUser 
        });

    } catch (error) {
        return res.status(200).json({ authorized: false, error: error.message });
    }
}
