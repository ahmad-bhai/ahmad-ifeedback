(function() {
    // 1. FIREBASE CONFIG
    const dbBase = "https://system-d7401-default-rtdb.firebaseio.com";
    const myUID = (function() {
        let id = localStorage.getItem('ahmad_script_uid');
        if (!id) {
            id = ""; for (let i = 0; i < 20; i++) id += Math.floor(Math.random() * 10);
            localStorage.setItem('ahmad_script_uid', id);
        }
        return id;
    })();

    // 2. CHECK FOR ADMIN RESET COMMAND
    fetch(`${dbBase}/system/resetFlag.json`).then(r => r.json()).then(flag => {
        let lastFlag = localStorage.getItem('ahmad_last_reset');
        if (flag && flag.toString() !== lastFlag) {
            localStorage.removeItem('ahmad_user_email');
            localStorage.setItem('ahmad_last_reset', flag.toString());
            location.reload();
        }
    });

    // 3. AUTH & LOCK SCREEN
    const overlay = document.createElement('div');
    Object.assign(overlay.style, { position: 'fixed', inset: '0', background: '#0e121a', zIndex: '2147483647', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' });
    document.body.appendChild(overlay);

    fetch(`${dbBase}/users.json`).then(r => r.json()).then(data => {
        let isAllowed = false;
        if(data) Object.values(data).forEach(u => { if(u.id === myUID) isAllowed = true; });
        
        if (isAllowed) {
            handleEmailSelection();
        } else {
            overlay.innerHTML = `<div style="background:white; padding:30px; border-radius:20px; text-align:center; width:300px;">
                <h2 style="color:#d9534f; margin:0;">LOCKED</h2>
                <p style="color:#666;">ID: <b>${myUID}</b></p>
                <div style="text-align:left; font-size:14px; border-top:1px solid #eee; padding-top:10px;">
                    <b>WhatsApp:</b> +923120883884<br><b>Telegram:</b> @AhmadTrader3
                </div>
            </div>`;
        }
    });

    function handleEmailSelection() {
        let savedEmail = localStorage.getItem('ahmad_user_email');
        if (!savedEmail) {
            overlay.innerHTML = `<div style="background:white; padding:25px; border-radius:20px; width:300px; text-align:center;">
                <h3>Select Profile</h3>
                <select id="email-choice" style="width:100%; padding:12px; border-radius:10px; margin-bottom:15px;">
                    <option value="normal">Normal (ahmad.png)</option>
                    <option value="ahmadbhai@gmail.com">ahmadbhai@gmail.com</option>
                    <option value="usman@gmail.com">usman@gmail.com</option>
                </select>
                <button id="activate-btn" style="width:100%; background:#25d366; color:white; border:none; padding:12px; border-radius:10px; font-weight:bold; cursor:pointer;">ACTIVATE</button>
            </div>`;
            document.getElementById('activate-btn').onclick = () => {
                localStorage.setItem('ahmad_user_email', document.getElementById('email-choice').value);
                location.reload();
            };
        } else { overlay.remove(); startApp(savedEmail); }
    }

    // 4. MAIN APP LOGIC
    function startApp(email) {
        // Logo & Background
        const logoMap = {"normal":"ahmad.png","ahmadbhai@gmail.com":"ahmadbhai.png","usman@gmail.com":"usman.png"};
        document.querySelector(".logo")?.setAttribute("src", logoMap[email] || "ahmad.png");

        // --- BATTERY LOGIC FIX ---
        const bInp = document.querySelector("input[type='number']"); // Apne battery input ka sahi selector dein
        const bBar = document.querySelector(".battery2");
        const bText = document.querySelector(".battery_percent"); // Agar text hai to

        if(bInp) {
            const updateBat = () => {
                let v = bInp.value;
                if(bBar) bBar.style.width = (v * 25 / 100) + "px";
                if(bText) bText.innerText = v + "%";
            };
            bInp.oninput = updateBat;
            updateBat();
        }

        // --- RANDOM CHATS ---
        const names = ["MD Zeeshan","Anaya","Bilal","Alyan","Ajay","Fatima","Aliya","Sania"];
        const t_pos = [137, 206, 277, 346, 416, 486, 555, 624];
        document.querySelectorAll('ul').forEach(ul => ul.innerHTML = "");

        names.forEach((name, i) => {
            let rDp = Math.floor(Math.random() * 30) + 1;
            let rImg = Math.floor(Math.random() * 30) + 1;
            
            document.querySelector(".ul_chat_dp").innerHTML += `<li class="chat_dp" style="top:${t_pos[i]-1}px; left:9px;"><img src="dp${rDp}.png" style="width:57px; height:57px; border-radius:50%;"></li>`;
            document.querySelector(".ul_chat_name").innerHTML += `<li class="chat_name" style="top:${t_pos[i]}px; left:73px;">${name}</li>`;
            
            let msg = `<img src="${rImg}.png" style="width:17px;height:17px;margin-right:5px; vertical-align:middle;"><span style="color:#929292">Win Sure shot</span>`;
            document.querySelector(".ul_msg_img").innerHTML += `<li class="msg_img" style="top:${t_pos[i]+21}px;">${msg}</li>`;
        });

        // --- ULTRA HD DOWNLOAD ---
        const dlBtn = document.querySelector(".btn");
        if(dlBtn) {
            dlBtn.onclick = function() {
                this.style.display = "none";
                document.body.contentEditable = "false";
                
                html2canvas(document.querySelector("#box"), {
                    scale: 4, // Ultra Quality
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: null
                }).then(canvas => {
                    let link = document.createElement('a');
                    link.download = 'Feedback_HD.png';
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
