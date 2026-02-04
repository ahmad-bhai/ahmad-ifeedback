import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = { databaseURL: "https://system-d7401-default-rtdb.firebaseio.com" };
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

window.adminAuth = function() {
    let pass = document.getElementById('admin-pass').value;
    if(pass === "6677") {
        document.getElementById('login-box').style.display = "none";
        document.getElementById('admin-controls').style.display = "block";
    } else { alert("Galat Password!"); }
}

document.getElementById('reset-btn').onclick = function() {
    if(confirm("Bhai kya aap waqai sabka data reset karna chahte hain?")) {
        set(ref(db, 'system/resetFlag'), Date.now()).then(() => {
            alert("Sytem Reset Ho Gaya!");
        });
    }
}
