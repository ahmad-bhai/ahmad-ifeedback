(function() {
    // 1. CONFIGURATION & ID
    var projectID = "reactions-maker-site";
    var dbURL = "https://" + projectID + "-default-rtdb.firebaseio.com/users.json";
    
    var myUID = localStorage.getItem('ahmad_script_uid');
    if (!myUID) {
        myUID = "";
        for (var i = 0; i < 20; i++) myUID += Math.floor(Math.random() * 10);
        localStorage.setItem('ahmad_script_uid', myUID);
    }

    // 2. LOCK OVERLAY
    var overlay = document.createElement('div');
    overlay.id = "ahmad-lock-screen";
    Object.assign(overlay.style, {
        position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
        background: '#0e121a', zIndex: '2147483647', display: 'flex', 
        justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif'
    });

    overlay.innerHTML = `
        <div id="lock-card-main" style="position: fixed; background: white; width: 320px; padding: 30px; border-radius: 20px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); box-sizing: border-box;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/2048px-Telegram_logo.svg.png" style="width: 70px; margin-bottom: 15px;">
            <div style="color: #222; font-size: 22px; font-weight: bold; margin-bottom: 5px;">ACCESS LOCKED</div>
            <div id="status-msg" style="color: #666; font-size: 12px; margin-bottom: 15px;">Verifying your ID...</div>
            <div style="background: #f1f5f9; color: #334155; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 14px; border: 1px dashed #0088cc; margin-bottom: 20px; word-break: break-all;">${myUID}</div>
            
            <div id="contact-area" style="text-align: left; font-size: 14px; color: #444; line-height: 1.6; border-top: 1px solid #eee; padding-top: 15px; margin-bottom: 15px;">
                <b>Whatsapp:</b> <span style="color: #25d366;">+923120883884</span><br>
                <b>Telegram:</b> <span style="color: #0088cc;">@AhmadTrader3</span><br>
                <div style="margin-top: 10px; text-align: center; font-weight: bold; color: #d9534f;">Contact to unlock</div>
            </div>
            <button onclick="location.reload()" style="width: 100%; background: #0088cc; color: white; border: none; padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer;">RETRY</button>
        </div>
    `;
    document.body.appendChild(overlay);

    // 3. VERIFICATION
    fetch(dbURL).then(r => r.json()).then(data => {
        var isUnlocked = false;
        if (data) { Object.values(data).forEach(u => { if (u.id === myUID) isUnlocked = true; }); }
        if (isUnlocked) { checkEmailFlow(); } 
        else { document.getElementById("status-msg").innerText = "ID Not Registered!"; document.getElementById("status-msg").style.color = "red"; }
    });

    function checkEmailFlow() {
        var savedEmail = localStorage.getItem('ahmad_user_email');
        if (!savedEmail) {
            document.getElementById("lock-card-main").innerHTML = `
                <div style="font-size: 20px; font-weight: bold; margin-bottom: 15px;">Enter Email</div>
                <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
                    <input type="email" id="email-inp-box" placeholder="example@gmail.com" 
                        style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ddd; outline: none; margin-bottom: 15px; text-align: center; box-sizing: border-box;">
                    <button id="save-em-btn" style="width: 100%; background: #05c55e; color: white; border: none; padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer;">ACTIVATE</button>
                </div>
            `;
            document.getElementById('save-em-btn').onclick = function() {
                var val = document.getElementById('email-inp-box').value.toLowerCase().trim();
                if(val.includes("@")) { localStorage.setItem('ahmad_user_email', val); location.reload(); }
                else { alert("Email sahi enter karein!"); }
            };
        } else { overlay.remove(); executeMain(savedEmail); }
    }

    // 4. MAIN SCRIPT
    function executeMain(email) {
        // Logo Switcher (Updated with pqa@gmail.com)
        var lUrl = "https://ahmad-bhai-site.vercel.app/dp.png";
        if (email === "usman@gmail.com") lUrl = "usman.png";
        else if (email === "haseeb@gmail.com") lUrl = "haseeb.png";
        else if (email === "pqa@gmail.com") lUrl = "pqa.png"; // New Email Added
        
        document.querySelector(".logo")?.setAttribute("src", lUrl);

        // Time
        var now = new Date();
        var amPm = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        var barTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false }).replace(/\s?[AP]M/g, "");
        document.querySelectorAll(".mob_time").forEach(el => el.innerText = barTime);

        // Chat Names Pool
        var names = ["MD Zeeshan","Anaya","Bilal","Alyan","Ajay","Fatima","Aliya","Sania","Sahil","Rohit","Deepak","Irfan","Usman","Anaya","Kashif","Zoya","Rahul","Ayesha","Sameer","Mehak"];
        
        // Fixed positions for the first 8 chats as per your original CSS
        var t_pos = [137, 206, 277, 346, 416, 486, 555, 624];
        var online_pos = [180, 251, 321, 390, 459, 529, 599, 669];
        
        var photoIdx = [];
        var pCount = Math.floor(Math.random() * 2) + 3; 
        while(photoIdx.length < pCount) {
            let r = Math.floor(Math.random() * 8);
            if(!photoIdx.includes(r)) photoIdx.push(r);
        }
        var voiceIdx;
        do { voiceIdx = Math.floor(Math.random() * 8); } while (photoIdx.includes(voiceIdx));

        // Generate Chats
        names.slice(0, 8).forEach((name, i) => {
            // DP
            let liDp = document.createElement("li");
            liDp.className = "chat_dp"; liDp.style.top = (t_pos[i]-1) + "px"; liDp.style.left = "9px";
            liDp.innerHTML = `<span class="chat_named_dp" style="background:${["#4794da","#fa7e5b","#f880a2","#8ece5f","#fdb456"][Math.floor(Math.random()*5)]}">${name[0]}</span>`;
            document.querySelector(".ul_chat_dp")?.appendChild(liDp);

            // Name
            let liNm = document.createElement("li");
            liNm.className = "chat_name"; liNm.style.top = t_pos[i] + "px"; liNm.style.left = "73px";
            liNm.innerText = name;
            document.querySelector(".ul_chat_name")?.appendChild(liNm);

            // Time
            let liTm = document.createElement("li");
            liTm.className = "chat_time"; liTm.style.top = (t_pos[i]+3) + "px";
            liTm.innerText = amPm;
            document.querySelector(".ul_chat_time")?.appendChild(liTm);

            // Message Body (RANDOM PHOTO LOGIC)
            let liMg = document.createElement("li");
            liMg.className = "msg_img"; liMg.style.top = (t_pos[i]+21) + "px";
            
            if (photoIdx.includes(i)) {
                let randomImgNum = Math.floor(Math.random() * 30) + 1;
                liMg.innerHTML = `<img src="msgs/${randomImgNum}.png"><span class="msg_span_img">Photo</span>`;
            } else if (i === voiceIdx) {
                liMg.innerHTML = `<span class="voice">Voice message</span>`;
            } else {
                liMg.innerHTML = `<span class="msg_span_text_alone">Win Sure shot</span>`;
            }
            document.querySelector(".ul_msg_img")?.appendChild(liMg);

            // Unread
            let liCnt = document.createElement("li");
            liCnt.className = "count_bullet"; liCnt.style.top = (t_pos[i]+31) + "px"; liCnt.style.left = "334px";
            liCnt.innerText = Math.floor(Math.random()*3)+1;
            document.querySelector(".ul_count_bullet")?.appendChild(liCnt);
        });

        // Online Bullets
        var onl = []; while(onl.length < 4) {
            let r = Math.floor(Math.random() * 8);
            if(!onl.includes(r)) onl.push(r);
        }
        onl.forEach(idx => {
            let li = document.createElement("li");
            li.className = "online_bullet";
            li.style.top = online_pos[idx] + "px";
            li.style.left = "48px";
            document.querySelector(".ul_online_bullet")?.appendChild(li);
        });

        // Battery Sync
        var bInput = document.querySelector("input");
        var bBar = document.querySelector(".battery2");
        if(bInput && bBar) {
            bBar.style.width = (Number(bInput.value) * 25 / 100) + "px";
            bInput.addEventListener("input", () => {
                bBar.style.width = (Number(bInput.value) * 25 / 100) + "px";
            });
        }

        if(document.querySelector("#box")) document.querySelector("#box").style.display = "block";
        document.body.contentEditable = true;
    }
})();
