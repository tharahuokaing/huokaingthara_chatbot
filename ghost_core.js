// --- CONFIG & MEMORY ---
let brain = JSON.parse(localStorage.getItem('ghost_brain') || '{}');
let learningMode = null;
let isEmperorMode = false;
const MASTER_KEY = "ACTIVATE_EMPEROR_MODE";

// --- INITIALIZE DASHBOARD (HRC Loop) ---
const dashItems = [
    { id: 'mem-count', label: 'MEMORY_UNITS', val: '0' },
    { id: 'strength', label: 'NEURAL_STRENGTH', val: 'BAR' },
    { id: 'threat-status', label: 'THREAT_LEVEL', val: 'SECURED' }
];
const dashPanel = document.getElementById('dashboard');
dashItems.forEach(item => {
    dashPanel.innerHTML += `<div class="stat-box"><span class="label">${item.label}</span>
    ${item.val === 'BAR' ? '<div id="strength-bar"><div id="strength-fill"></div></div>' : `<br><span id="${item.id}" style="font-size:1.2em">${item.val}</span>`}</div>`;
});

// --- CORE FUNCTIONS ---
function speak(text) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'km-KH'; 
    window.speechSynthesis.speak(utter);
}

function updateDashboard() {
    const count = Object.keys(brain).length;
    document.getElementById('mem-count').innerHTML = count;
    document.getElementById('strength-fill').style.width = Math.min(count * 2, 100) + "%";
    checkNetStatus();
}

function checkNetStatus() {
    const status = document.getElementById('status-light');
    status.innerText = navigator.onLine ? "● ONLINE_SYNC" : "● STEALTH_OFFLINE";
    status.style.color = navigator.onLine ? "#00f2ff" : "#ffcc00";
}

// --- SENTIENT LOGIC (Section 4 & 7) ---
function calculateSimilarity(s1, s2) {
    let longer = s1.toLowerCase(), shorter = s2.toLowerCase();
    if (s1.length < s2.length) [longer, shorter] = [shorter, longer];
    if (longer.length === 0) return 1.0;
    return (longer.length - editDistance(longer, shorter)) / parseFloat(longer.length);
}

function editDistance(s1, s2) {
    let costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) costs[j] = j;
            else if (j > 0) {
                let newValue = costs[j - 1];
                if (s1.charAt(i - 1) !== s2.charAt(j - 1))
                    newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                costs[j - 1] = lastValue; lastValue = newValue;
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

// --- MAIN PROCESS ---
function process(q) {
    if (q === MASTER_KEY) { isEmperorMode = true; speak("អំណាចមហាក្សត្រត្រូវបានដោះសោរ"); return; }
    
    let rawQ = q.trim();
    let qLow = rawQ.toLowerCase();
    logMsg(rawQ, "user");

    if (learningMode) {
        brain[learningMode] = rawQ;
        localStorage.setItem('ghost_brain', JSON.stringify(brain));
        speak("ចារិកទុកហើយ");
        learningMode = null;
        updateDashboard();
        return;
    }

    // Fuzzy Search
    let bestMatch = null, topScore = 0;
    for (let key in brain) {
        let score = calculateSimilarity(qLow, key);
        if (score > topScore) { topScore = score; bestMatch = key; }
    }

    if (topScore > 0.8) {
        let resp = brain[bestMatch];
        logMsg("AI: " + resp, "ai");
        speak(resp);
    } else {
        speak("ទូលបង្គំមិនទាន់យល់ទេ តើវាជាអ្វី?");
        learningMode = qLow;
    }
}

function logMsg(msg, type) {
    const out = document.getElementById('out');
    out.innerHTML += `<div class="${type}">${msg}</div>`;
    out.scrollTop = out.scrollHeight;
}

// --- BOOT UP ---
window.onload = () => {
    setTimeout(() => {
        document.getElementById('boot').style.display = 'none';
        updateDashboard();
        speak("វិញ្ញាណអាទិទេព រួចរាល់");
    }, 2000);
};

document.getElementById('in').onkeypress = (e) => {
    if(e.key === 'Enter') { process(e.target.value); e.target.value = ''; }
};

