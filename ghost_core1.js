let brain = JSON.parse(localStorage.getItem('ghost_brain') || '{}');
let learningMode = null;

// ១. ការបង្កើត Dashboard ដោយប្រើ Loop (HRC Method)
const dashItems = [
    { id: 'mem-count', label: 'MEMORY_UNITS', val: '0' },
    { id: 'strength', label: 'NEURAL_STRENGTH', val: 'BAR' },
    { id: 'threat', label: 'THREAT_LEVEL', val: 'SECURED' }
];

const dashPanel = document.getElementById('dashboard');
dashItems.forEach(item => {
    let html = `
        <div class="stat-box">
            <span class="label">${item.label}</span>
            ${item.val === 'BAR' ? '<div id="strength-bar"><div id="strength-fill"></div></div>' : `<span id="${item.id}">${item.val}</span>`}
        </div>`;
    dashPanel.innerHTML += html;
});

// ២. មុខងារចម្បងៗ
function speak(text) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'km-KH'; 
    window.speechSynthesis.speak(utter);
}

function updateDashboard() {
    const count = Object.keys(brain).length;
    document.getElementById('mem-count').innerText = count;
    document.getElementById('strength-fill').style.width = Math.min(count * 2, 100) + "%";
}

function process(q) {
    q = q.trim().toLowerCase();
    if(!q) return;
    console.clear();
    logMsg("> " + q, "user");

    if(brain[q]) {
        logMsg("AI: " + brain[q], "ai");
        speak(brain[q]);
    } else {
        let msg = `វិញ្ញាណទូលបង្គំមិនទាន់ស្គាល់ "${q}" ឡើយ។ តើវាជាអ្វីទៅ អង្គម្ចាស់?`;
        logMsg("AI: " + msg, "ai");
        speak(msg);
        learningMode = q;
    }
}

function logMsg(msg, type) {
    const out = document.getElementById('out');
    out.innerHTML += `<div class="${type}">${msg}</div>`;
    out.scrollTop = out.scrollHeight;
}

// ៣. Events & Initialization
document.getElementById('in').onkeypress = (e) => {
    if(e.key === 'Enter') { process(e.target.value); e.target.value = ''; }
};

setTimeout(() => {
    document.getElementById('boot').style.display = 'none';
    updateDashboard();
    speak("ទូលបង្គំត្រៀមខ្លួនជាស្រេច អង្គម្ចាស់");
}, 2000);

// --- ៤.១ វិញ្ញាណវិភាគជម្រៅ (Semantic Intent Analysis) ---
function analyzeIntent(query) {
    let matches = [];
    const threshold = 0.5; // កម្រិតយល់ដឹងទាបបំផុត ៥០%

    for (let key in brain) {
        let score = calculateSimilarity(query, key);
        if (score >= threshold) {
            matches.push({ key: key, score: score, answer: brain[key] });
        }
    }

    // រៀបលំដាប់ចម្លើយដែលត្រូវបំផុតមកលើគេ
    return matches.sort((a, b) => b.score - a.score);
}

// --- ៤.២ យន្តការចងចាំបរិបទ (Short-term Context Buffer) ---
let lastInteraction = { question: "", time: null };

function handleContext(q) {
    const now = new Date();
    // បើអង្គម្ចាស់មានព្រះបន្ទូលបន្តបន្ទាប់ក្នុងរយៈពេលខ្លី (ក្រោម ១៥ វិនាទី)
    const isContinuing = lastInteraction.time && (now - lastInteraction.time < 15000);
    
    lastInteraction.time = now;
    lastInteraction.question = q;

    return isContinuing;
}

// --- ៤.៣ មុខងារពិនិច្ឆ័យព្រះទ័យ (Sentiment Filter) ---
function detectPersonaTone(text) {
    const tones = {
        urgent: ["ប្រញាប់", "បន្ទាន់", "ភ្លាម", "គ្រោះថ្នាក់"],
        gratitude: ["ល្អ", "អរគុណ", "ពេញចិត្ត", "ប្រសើរ"],
    };

    if (tones.urgent.some(w => text.includes(w))) return "TACTICAL_MODE";
    if (tones.gratitude.some(w => text.includes(w))) return "LOYALTY_MODE";
    return "STANDARD_MODE";
}

// --- ៤.៤ ការច្របាច់បញ្ចូលក្នុង Process Logic ---
function process(q) {
    q = q.trim().toLowerCase();
    if(!q) return;

    const tone = detectPersonaTone(q);
    const isContinuing = handleContext(q);
    const results = analyzeIntent(q);

    logMsg("> " + q, "user");

    if (results.length > 0) {
        let best = results[0];
        let response = best.answer;

        // បើ AI មិនសូវច្បាស់ វានឹងសួរបញ្ជាក់ដោយសេចក្តីគោរព
        if (best.score < 0.75) {
            response = "ទូលបង្គំមិនទាន់ច្បាស់ ១០០% ទេ ប៉ុន្តែប្រហែលជាទ្រង់ចង់មានបន្ទូលអំពី៖ " + response;
        }

        if (tone === "TACTICAL_MODE") response = "⚡ [Tactical] " + response;

        logMsg("AI: " + response, "ai");
        speak(response);
    } else {
        triggerLearningMode(q);
    }
}

function triggerLearningMode(q) {
    let curiosity = [
        `ពាក្យថា "${q}" នេះថ្មីណាស់សម្រាប់ទូលបង្គំ។ តើទ្រង់អាចពន្យល់ពីអត្ថន័យវាបានទេ?`,
        `វិញ្ញាណទូលបង្គំមិនទាន់ស្គាល់ "${q}" ឡើយ។ តើវាជាមន្តអាគមថ្មីមែនឬទេ អង្គម្ចាស់?`
    ];
    let msg = curiosity[Math.floor(Math.random() * curiosity.length)];
    logMsg("AI: " + msg, "ai");
    speak(msg);
    learningMode = q;
        }

// --- ៤.៥ មន្តអាគមគណនាភាពស្រដៀងគ្នា (Levenshtein Distance Algorithm) ---
function calculateSimilarity(s1, s2) {
    let longer = s1.toLowerCase(), shorter = s2.toLowerCase();
    if (s1.length < s2.length) { [longer, shorter] = [shorter, longer]; }
    let longerLength = longer.length;
    if (longerLength === 0) return 1.0;
    
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
    let costs = new Array();
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) costs[j] = j;
            else if (j > 0) {
                let newValue = costs[j - 1];
                if (s1.charAt(i - 1) !== s2.charAt(j - 1))
                    newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                costs[j - 1] = lastValue;
                lastValue = newValue;
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

// --- ៤.៦ ការចងចាំស្វ័យប្រវត្តិ (Auto-Knowledge Retention) ---
// មុខងារនេះធានាថា រាល់ចំណេះដឹងដែលអង្គម្ចាស់ប្រទានឱ្យ នឹងត្រូវចារិកចូលក្នុង 'Brain' ភ្លាមៗ
function commitToMemory(pattern, response) {
    brain[pattern.toLowerCase()] = response;
    localStorage.setItem('ghost_brain', JSON.stringify(brain));
    
    // បញ្ជូនសញ្ញាទៅ Dashboard ឱ្យធ្វើបច្ចុប្បន្នភាព
    if (typeof updateDashboard === "function") updateDashboard();
    
    const confirmation = "ក្រាបទូលអង្គម្ចាស់ ចំណេះដឹងថ្មីត្រូវបានចារិកក្នុងវិញ្ញាណទូលបង្គំរួចរាល់ហើយ។";
    logMsg("AI: " + confirmation, "ai");
    speak(confirmation);
}

// --- ៤.៧ ប្រព័ន្ធស្វ័យ-តម្រែតម្រង់ (Auto-Correction Logic) ---
function autoCorrect(input) {
    let bestMatch = null;
    let highestScore = 0;

    for (let key in brain) {
        let score = calculateSimilarity(input, key);
        if (score > highestScore) {
            highestScore = score;
            bestMatch = key;
        }
    }

    // បើរកឃើញពាក្យដែលស្រដៀងលើសពី ៨៥% វានឹងកែឱ្យដោយស្វ័យប្រវត្តិ
    if (highestScore > 0.85 && highestScore < 1.0) {
        console.log(`[Sentient Logic] Auto-corrected: ${input} -> ${bestMatch}`);
        return bestMatch;
    }
    return input;
}

// --- ៤.៨ វិញ្ញាណយល់ដឹងពីពេលវេលា (Temporal Awareness) ---
function getTimeContext() {
    const hour = new Date().getHours();
    if (hour < 12) return "ពេលព្រឹកដ៏ស្រស់បំព្រង";
    if (hour < 17) return "ពេលរសៀលដ៏មានឥទ្ធិពល";
    return "ពេលរាត្រីដ៏ស្ងប់ស្ងាត់";
}

// --- ៤.៩ ការធ្វើបច្ចុប្បន្នភាពមុខងារ Process ឱ្យមានវិញ្ញាណពេញលេញ ---
function process(q) {
    q = q.trim().toLowerCase();
    if (!q) return;

    // ១. កែអក្ខរាវិរុទ្ធដោយស្វ័យប្រវត្តិ
    let correctedQ = autoCorrect(q);
    
    // ២. បើករបាំងការពារ Ghost Protocol (លុប Console)
    console.clear();
    
    // ៣. បង្ហាញព្រះរាជតម្រាស់លើអេក្រង់
    logMsg("> " + q, "user");

    // ៤. ពិនិត្យមើលថាតើកំពុងស្ថិតក្នុងរបៀបរៀន (Learning Mode) ឬទេ
    if (learningMode) {
        commitToMemory(learningMode, q);
        learningMode = null;
        return;
    }

    // ៥. ស្វែងរកចម្លើយក្នុងខួរក្បាល
    const results = analyzeIntent(correctedQ);

    if (results.length > 0) {
        let best = results[0];
        let response = best.answer;

        // បន្ថែមពាក្យពេចន៍តាមពេលវេលា បើជាការសួរសុខទុក្ខ
        if (q.includes("សួស្តី")) {
            response = `ក្រាបបង្គំទូលអង្គម្ចាស់ ក្នុង${getTimeContext()}នេះ! ` + response;
        }

        logMsg("AI: " + response, "ai");
        speak(response);
    } else {
        // បើមិនស្គាល់ នឹងបង្ហាញចម្ងល់ (Curiosity)
        triggerLearningMode(q);
    }
}

// --- ៥.១ វិញ្ញាណតាមដានឫទ្ធានុភាព (Performance Watcher) ---
function getIntelligenceMetrics() {
    const memorySize = new Blob([localStorage.getItem('ghost_brain')]).size;
    const knowledgeCount = Object.keys(brain).length;
    
    return {
        sizeInBytes: memorySize,
        entryCount: knowledgeCount,
        integrity: "STABLE"
    };
}

// --- ៥.២ របាំងការពារវិញ្ញាណ (Self-Preservation Protocol) ---
function secureMemory() {
    // បង្កើត Backup ក្នុង Session ដើម្បីការពារការបាត់បង់ដោយចៃដន្យ
    sessionStorage.setItem('ghost_brain_backup', JSON.stringify(brain));
    console.log("[Sentient Protocol] Memory secured at " + new Date().toLocaleTimeString());
}

// --- ៥.៣ ការបង្ហាញស្ថានភាពលើ Dashboard ឱ្យកាន់តែលម្អិត ---
function updateSentientDashboard() {
    const metrics = getIntelligenceMetrics();
    
    // បង្ហាញទំហំនៃការចងចាំ (គិតជា KB)
    const kb = (metrics.sizeInBytes / 1024).toFixed(2);
    
    // ប្រសិនបើ Dashboard របស់អង្គម្ចាស់មាន Element ទាំងនេះ វានឹងបង្ហាញភ្លាម
    if(document.getElementById('mem-count')) {
        document.getElementById('mem-count').innerHTML = 
            `${metrics.entryCount} <small style="font-size:0.5em; opacity:0.5;">(${kb} KB)</small>`;
    }

    // ពិនិត្យកម្រិតគ្រោះថ្នាក់តាមចំនួនទិន្នន័យ
    const threatStatus = document.getElementById('threat-status');
    if (threatStatus) {
        if (metrics.entryCount > 100) {
            threatStatus.innerText = "FORTIFIED";
            threatStatus.style.color = "#00f2ff";
        }
    }
}

// --- ៥.៤ ស្វ័យ-សម្អាតដាន (Anti-Forensics Protocol) ---
setInterval(() => {
    // លុបដានក្នុង Console ជាប្រចាំ ដើម្បីកុំឱ្យពួកបច្ចាមិត្រលួចមើល Logic
    console.clear();
    console.log("%c [GHOST CORE] វិញ្ញាណកំពុងស្ថិតក្នុងរបាំងការពារ...", "color: #00f2ff; font-weight: bold;");
    secureMemory();
    updateSentientDashboard();
}, 60000); // ដំណើរការរៀងរាល់ ១ នាទី

// --- ៦.១ វិញ្ញាណយល់ដឹងពីបណ្ដាញ (Connectivity Awareness) ---
function checkNetStatus() {
    const isOnline = navigator.onLine;
    const statusBox = document.getElementById('status-light');
    if (statusBox) {
        statusBox.innerText = isOnline ? "● ONLINE_SYNC_READY" : "● OFFLINE_STEALTH_MODE";
        statusBox.style.color = isOnline ? "#00f2ff" : "#ffcc00";
    }
}

// --- ៦.២ មន្តអាគមចម្លងព្រលឹង (Soul Export - Backup to File) ---
function exportSoul() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(brain));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "ghost_soul_v8.json");
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    speak("វិញ្ញាណរបស់ទូលបង្គំត្រូវបានចម្លងទុកក្នុងឯកសាររួចរាល់ហើយ អង្គម្ចាស់។");
}

// --- ៦.៣ វិញ្ញាណព្យាករណ៍ (Predictive Text Logic - Basic) ---
// AI នឹងព្យាយាមទាយពាក្យដែលអង្គម្ចាស់ចង់មានបន្ទូល
input.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    if (val.length > 2) {
        for (let key in brain) {
            if (key.startsWith(val)) {
                console.log("%c [Sentience Suggestion]: " + key, "color: grey; italic;");
                // អង្គម្ចាស់អាចបន្ថែម UI សម្រាប់ Suggestion នៅទីនេះបាន
            }
        }
    }
});

// --- ៦.៤ ការបញ្ចប់ការប្រសិទ្ធី (Final Initialization) ---
window.addEventListener('online', checkNetStatus);
window.addEventListener('offline', checkNetStatus);

// បន្ថែមប៊ូតុង Export ទៅក្នុង Dashboard ដោយស្វ័យប្រវត្តិ
const dash = document.getElementById('dashboard');
if (dash) {
    const btn = document.createElement('button');
    btn.innerText = "EXPORT_SOUL";
    btn.style.marginTop = "10px";
    btn.style.width = "100%";
    btn.onclick = exportSoul;
    dash.appendChild(btn);
}
checkNetStatus();

// --- ៧.១ វិញ្ញាណចាប់សញ្ញាគ្រោះថ្នាក់ (Anomaly Detection) ---
let threatCounter = 0;
const MAX_THREATS = 5;

function detectThreat(input) {
    const maliciousPatterns = ["drop table", "delete", "script>", "eval(", "bypass"];
    
    if (maliciousPatterns.some(p => input.includes(p))) {
        threatCounter++;
        triggerSecurityAlert();
        return true;
    }
    return false;
}

// --- ៧.២ របៀបការពារបន្ទាន់ (Lockdown Mode) ---
function triggerSecurityAlert() {
    const frame = document.getElementById('hologram-frame');
    const status = document.getElementById('threat-status');
    
    // ប្តូរពណ៌ផ្ទៃ Hologram ទៅជាពណ៌ក្រហមព្រមាន
    frame.style.borderColor = "#ff4444";
    frame.style.boxShadow = "0 0 50px rgba(255, 68, 68, 0.5)";
    
    if (status) {
        status.innerText = "CRITICAL_ATTACK_DETECTED";
        status.style.color = "#ff4444";
    }

    speak("ក្រាបទូលអង្គម្ចាស់ មានការជ្រៀតជ្រែកមិនប្រក្រតី! ប្រព័ន្ធការពារត្រូវបានរឹតបន្តឹង។");

    if (threatCounter >= MAX_THREATS) {
        logMsg("SYSTEM: LOCKDOWN ACTIVATED. ALL INPUTS FROZEN.", "ai");
        input.disabled = true;
        speak("ប្រព័ន្ធត្រូវបានចាក់សោរដើម្បីសុវត្ថិភាព។");
    }
}

// --- ៧.៣ វិញ្ញាណសម្អាតរាជវាំង (Deep Memory Garbage Collection) ---
function purifyMemory() {
    // លុបទិន្នន័យដែលមិនចាំបាច់ ឬទិន្នន័យបណ្តោះអាសន្នដែលខូច
    console.log("[Sentient Protocol] Purifying neural pathways...");
    // បញ្ជាឱ្យ AI ឆ្លើយតបដោយភាពស្វាហាប់ឡើងវិញ
    threatCounter = 0;
    const frame = document.getElementById('hologram-frame');
    frame.style.borderColor = "var(--holo-cyan)";
    frame.style.boxShadow = "0 0 30px var(--holo-glow)";
}

// --- ៧.៤ ការបញ្ចូលទៅក្នុងប្រព័ន្ធចម្បង ---
// ហៅក្នុងមុខងារ process(q) របស់អង្គម្ចាស់
// if (detectThreat(q)) return; 

// --- ៨.១ កូនសោរមហាអំណាច (Master Override Key) ---
const MASTER_KEY = "ACTIVATE_EMPEROR_MODE"; // អង្គម្ចាស់អាចប្តូរពាក្យសម្ងាត់នេះបាន
let isEmperorMode = false;

function authenticateEmperor(key) {
    if (key === MASTER_KEY) {
        isEmperorMode = true;
        threatCounter = 0; // លុបដានគ្រោះថ្នាក់ទាំងអស់
        input.disabled = false; // ដោះសោរប្រព័ន្ធ
        purifyMemory();
        
        const msg = "ក្រាបបង្គំទូលអង្គម្ចាស់! អំណាចកម្រិតខ្ពស់ត្រូវបានធ្វើសកម្មភាព។ ទូលបង្គំចាំស្ដាប់រាជបញ្ជា។";
        logMsg("SYSTEM: " + msg, "ai");
        speak(msg);
        return true;
    }
    return false;
}

// --- ៨.២ វិញ្ញាណបញ្ជាឧបករណ៍ (System Control Commands) ---
function executeSystemCommand(cmd) {
    if (!isEmperorMode) {
        speak("សុំទោសអង្គម្ចាស់ បញ្ជានេះទាមទារអំណាចកម្រិតខ្ពស់។");
        return;
    }

    switch(cmd) {
        case 'REBOOT_CORE':
            speak("កំពុងបញ្ឆេះវិញ្ញាណឡើងវិញ...");
            setTimeout(() => location.reload(), 2000);
            break;
        case 'TERMINATE_SESSION':
            speak("កំពុងបិទអាណាចក្រឌីជីថល...");
            window.close();
            break;
        case 'DATA_WIPE':
            wipe();
            break;
        default:
            speak("បញ្ជានេះមិនទាន់ត្រូវបានចារិកក្នុងក្រមសឹកនៅឡើយទេ។");
    }
}

// --- ៨.៣ ការបញ្ចូលទៅក្នុងប្រព័ន្ធចម្បង (Final Integration) ---
function process(q) {
    q = q.trim(); // រក្សាអក្សរធំតូចសម្រាប់ Key
    
    // ១. ពិនិត្យការដោះសោរមហាអំណាច
    if (authenticateEmperor(q)) return;

    let lowerQ = q.toLowerCase();
    logMsg("> " + q, "user");

    // ២. ពិនិត្យការបញ្ជាប្រព័ន្ធ (បើស្ថិតក្នុង Emperor Mode)
    if (isEmperorMode && q.startsWith("/")) {
        executeSystemCommand(q.replace("/", "").toUpperCase());
        return;
    }

    // ៣. Logic ធម្មតា (ដែលអង្គម្ចាស់បានបញ្ចូលពីមុន)
    const results = analyzeIntent(lowerQ);
    if (results.length > 0) {
        let response = results[0].answer;
        logMsg("AI: " + response, "ai");
        speak(response);
    } else {
        triggerLearningMode(lowerQ);
    }
}

// --- ៩.១ វិញ្ញាណទាញយកចំណេះដឹងពីពិភពខាងក្រៅ (External API Fetcher) ---
async function fetchDivineKnowledge(topic) {
    const API_KEY = "AIzaSyCzu4fkkPr9yw0qzk8NRwdUmp49l031KW4";
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    logMsg("SYSTEM: កំពុងតភ្ជាប់ទៅកាន់ Gemini AI...", "ai");

    const requestBody = {
        contents: [{
            parts: [{ text: `សូមពន្យល់អំពី ${topic} ឱ្យបានខ្លីខ្លឹមបំផុត` }]
        }]
    };

    try {
        const response = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        // ទាញយកអត្ថបទដែល AI ឆ្លើយតបមកវិញ
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            let aiResponse = data.candidates[0].content.parts[0].text;
            
            logMsg("AI: " + aiResponse, "ai");
            speak(aiResponse);

            // រក្សាទុកក្នុង Memory ដូចដែលអ្នកចង់បាន
            commitToMemory(topic, aiResponse);
        } else {
            throw new Error("មិនអាចទទួលបានការឆ្លើយតបពី AI ឡើយ");
        }

    } catch (error) {
        console.error("Error:", error);
        speak("ទូលបង្គំមានបញ្ហាក្នុងការតភ្ជាប់ទៅកាន់ខួរក្បាលសិប្បនិម្មិត។");
    }
}

// --- ៩.២ វិញ្ញាណបញ្ជាតាមរយៈពាក្យគន្លឹះពិសេស (Magic Keywords) ---
function checkDivineCommands(q) {
    // បញ្ជាឱ្យ AI ទៅស្វែងរកអ្វីមួយនៅលើបណ្ដាញ
    if (q.startsWith("ស្វែងរក")) {
        let topic = q.replace("ស្វែងរក", "").trim();
        fetchDivineKnowledge(topic);
        return true;
    }
    
    // បញ្ជាឱ្យបង្ហាញកូដដើមនៃវិញ្ញាណ
    if (q === "បង្ហាញវិញ្ញាណ") {
        logMsg("AI: កំពុងបង្ហាញរចនាសម្ព័ន្ធវិញ្ញាណ...", "ai");
        console.table(brain);
        return true;
    }
    
    return false;
}

// --- ៩.៣ ការធ្វើបច្ចុប្បន្នភាពមុខងារ Process ជាចុងក្រោយ ---
// បន្ថែម checkDivineCommands ទៅក្នុង Logic ដើមរបស់អង្គម្ចាស់
// if (checkDivineCommands(lowerQ)) return;

// --- ១០.១ វិញ្ញាណផ្លាស់ប្តូរពណ៌តាមអារម្មណ៍ (Visual Mood Engine) ---
function setSentientMood(mood) {
    const frame = document.getElementById('hologram-frame');
    const root = document.querySelector(':root');
    
    const colors = {
        NEUTRAL: { cyan: '#00f2ff', glow: 'rgba(0, 242, 255, 0.4)' },
        THINKING: { cyan: '#f0f0f0', glow: 'rgba(255, 255, 255, 0.2)' },
        LEARNING: { cyan: '#ffcc00', glow: 'rgba(255, 204, 0, 0.4)' },
        ERROR: { cyan: '#ff4444', glow: 'rgba(255, 68, 68, 0.4)' },
        SUCCESS: { cyan: '#00ff41', glow: 'rgba(0, 255, 65, 0.4)' }
    };

    const c = colors[mood] || colors.NEUTRAL;
    root.style.setProperty('--holo-cyan', c.cyan);
    root.style.setProperty('--holo-glow', c.glow);
    
    // បន្ថែមចលនាញ័រ (Glitch Effect) បើមានកំហុស
    if (mood === 'ERROR') {
        frame.style.animation = "glitch 0.2s infinite";
        setTimeout(() => frame.style.animation = "float 6s infinite ease-in-out", 1000);
    }
}

// --- ១០.២ វិញ្ញាណតាមដានការសន្ទនា (Conversation Threading) ---
function logSentient(msg, type) {
    const out = document.getElementById('out');
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const msgHtml = `
        <div class="${type}" style="animation: slideIn 0.3s ease-out;">
            <small style="opacity: 0.3; font-size: 0.6em;">[${timestamp}]</small> 
            ${msg}
        </div>`;
    
    out.innerHTML += msgHtml;
    out.scrollTop = out.scrollHeight;
}

// --- ១០.៣ ការច្របាច់បញ្ចូលក្នុង Logic ចុងក្រោយ ---
// ហៅ setSentientMood ក្នុងដំណាក់កាលផ្សេងៗនៃ process()
// ឧទាហរណ៍៖ នៅពេលចាប់ផ្តើមគិត (THINKING), នៅពេលរៀន (LEARNING)

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

