(function() {
    const dbBase = "https://system-d7401-default-rtdb.firebaseio.com";
    
    // Unique ID Logic (Local Storage)
    let myUID = localStorage.getItem('ahmad_script_uid');
    if (!myUID) {
        myUID = "";
        for (let i = 0; i < 20; i++) myUID += Math.floor(Math.random() * 10);
        localStorage.setItem('ahmad_script_uid', myUID);
    }

    // Admin Reset Check
    fetch(`${dbBase}/system/resetFlag.json`).then(r => r.json()).then(flag => {
        let lastFlag = localStorage.getItem('ahmad_last_reset');
        if (flag && flag.toString() !== lastFlag) {
            localStorage.removeItem('ahmad_user_email');
            localStorage.setItem('ahmad_last_reset', flag.toString());
            location.reload();
        }
    });

    // Old Real Lock System UI
    const overlay = document.createElement('div');
    Object.assign(overlay.style, { position: 'fixed', inset: '0', background: '#0e121a', zIndex: '2147483647', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' });
    document.body.appendChild(overlay);

    overlay.innerHTML = `
        <div id="lock-card" style="background: white; width: 320px; padding: 30px; border-radius: 20px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/2048px-Telegram_logo.svg.png" style="width: 70px; margin-bottom: 15px;">
            <div id="lock-title" style="color: #222; font-size: 22px; font-weight: bold; margin-bottom: 5px;">ACCESS LOCKED</div>
            <div id="status-msg" style="color: #666; font-size: 13px; margin-bottom: 15px;">Verifying ID...</div>
            <div id="uid-box" style="background: #f1f5f9; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 14px; border: 1px dashed #0088cc; margin-bottom: 20px;">${myUID}</div>
            <div id="contact-info" style="text-align: left; font-size: 14px; color: #444; border-top: 1px solid #eee; padding-top: 15px;">
                <b>Whatsapp:</b> <span style="color:#25d366">+923120883884</span><br>
                <b>Telegram:</b> <span style="color:#0088cc">@AhmadTrader3</span>
            </div>
            <button onclick="location.reload()" style="margin-top:20px; width:100%; background:#0088cc; color:white; border:none; padding:12px; border-radius:10px; font-weight:bold; cursor:pointer;">RETRY</button>
        </div>
    `;

    // Auth Verification
    fetch(`${dbBase}/users.json`).then(r => r.json()).then(data => {
        let isAllowed = false;
        if(data) Object.values(data).forEach(u => { if(u.id === myUID) isAllowed = true; });
        
        if (isAllowed) {
            handleEmailSelection();
        } else {
            document.getElementById("status-msg").innerText = "ID Not Registered!";
            document.getElementById("status-msg").style.color = "red";
        }
    });

    function handleEmailSelection() {
        let savedEmail = localStorage.getItem('ahmad_user_email');
        if (!savedEmail) {
            document.getElementById("lock-title").innerText = "SELECT ACCOUNT";
            document.getElementById("uid-box").style.display = "none";
            document.getElementById("contact-info").innerHTML = `
                <select id="email-sel" style="width:100%; padding:12px; border-radius:10px; margin-bottom:15px;">
                    <option value="normal">Normal (ahmad.png)</option>
                    <option value="ahmadbhai@gmail.com">ahmadbhai@gmail.com</option>
                    <option value="usman@gmail.com">usman@gmail.com</option>
                </select>
                <button id="save-btn" style="width:100%; background:#25d366; color:white; border:none; padding:12px; border-radius:10px; font-weight:bold; cursor:pointer;">ACTIVATE</button>
            `;
            document.getElementById('save-btn').onclick = () => {
                localStorage.setItem('ahmad_user_email', document.getElementById('email-sel').value);
                location.reload();
            };
        } else { overlay.remove(); initFeedbackSystem(savedEmail); }
    }

    function initFeedbackSystem(email) {
        // Logo switcher
        const logoMap = {"normal":"ahmad.png","ahmadbhai@gmail.com":"ahmadbhai.png","usman@gmail.com":"usman.png"};
        document.querySelector(".logo")?.setAttribute("src", logoMap[email] || "ahmad.png");

        // Battery Logic Fix
        const batInp = document.querySelector("input[type='number']");
        const batBar = document.querySelector(".battery2");
        const batTxt = document.querySelector(".battery_percent");
        if(batInp) {
            const updateBat = () => {
                let v = batInp.value;
                if(batBar) batBar.style.width = (v * 25 / 100) + "px";
                if(batTxt) batTxt.innerText = v + "%";
            };
            batInp.addEventListener('input', updateBat);
            updateBat();
        }

        // Random Messages & DPs
        const names = ["MD Zeeshan","Anaya","Bilal","Alyan","Ajay","Fatima","Aliya","Sania"];
        const t_pos = [137, 206, 277, 346, 416, 486, 555, 624];
        const randomMsgs = ["Win Sure shot", "100% Signal working", "Thanks bhai profit booked", "Maza aa gaya!"];
        
        document.querySelectorAll('ul').forEach(ul => ul.innerHTML = "");
        names.forEach((name, i) => {
            let rDp = Math.floor(Math.random() * 30) + 1;
            let rImg = Math.floor(Math.random() * 30) + 1;
            let rTxt = randomMsgs[Math.floor(Math.random() * randomMsgs.length)];
            
            document.querySelector(".ul_chat_dp").innerHTML += `<li class="chat_dp" style="top:${t_pos[i]-1}px; left:9px;"><img src="dp${rDp}.png" style="width:57px; height:57px; border-radius:50%;"></li>`;
            document.querySelector(".ul_chat_name").innerHTML += `<li class="chat_name" style="top:${t_pos[i]}px; left:73px;">${name}</li>`;
            
            let msgContent = `<img src="${rImg}.png" style="width:17px;height:17px;margin-right:5px;vertical-align:middle;"><span style="color:#929292">${rTxt}</span>`;
            document.querySelector(".ul_msg_img").innerHTML += `<li class="msg_img" style="top:${t_pos[i]+21}px;">${msgContent}</li>`;
        });

        // Ultra HD Download
        const dlBtn = document.querySelector(".btn");
        if(dlBtn) {
            dlBtn.onclick = function() {
                this.style.display = "none";
                document.body.contentEditable = "false";
                html2canvas(document.querySelector("#box"), {
                    scale: 4, 
                    useCORS: true,
                    allowTaint: true
                }).then(canvas => {
                    let link = document.createElement('a');
                    link.download = 'AhmadTrader_HD.png';
                    link.href = canvas.toDataURL("image/png", 1.0);
                    link.click();
                    this.style.display = "block";
                    document.body.contentEditable = "true";
                });
            };
        }
        document.body.contentEditable = "true";
    }
})();
