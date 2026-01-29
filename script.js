let brain = JSON.parse(localStorage.getItem('ghost_brain') || '{}');
let learningMode = null;
const output = document.getElementById('out');
const input = document.getElementById('in');
const micBtn = document.getElementById('mic-btn');

// --- មុខងារសំឡេង (Voice Feedback) ---
function speak(text) {
    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'km-KH'; 
    synth.speak(utter);
}

// --- មុខងារស្តាប់ (Voice Recognition) ---
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (Recognition) {
    const rec = new Recognition();
    rec.lang = 'km-KH';
    rec.continuous = false;

    micBtn.onclick = () => {
        rec.start();
        micBtn.classList.add('active');
    };

    rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        input.value = transcript;
        process(transcript);
        micBtn.classList.remove('active');
    };

    rec.onerror = () => micBtn.classList.remove('active');
    rec.onend = () => micBtn.classList.remove('active');
}

// Boot Screen Sequence
setTimeout(() => {
    document.getElementById('boot').style.display = 'none';
    logMsg("AI: Ghost Protocol activated. Voice system online.", "ai");
    speak("Ghost Protocol activated. Voice system online.");
}, 2000);

function logMsg(msg, type) {
    output.innerHTML += `<div class="${type}">${msg}</div>`;
    output.scrollTop = output.scrollHeight;
}

// --- ការវិភាគសំណួរ (AI Processing) ---
function process(q) {
    q = q.trim().toLowerCase();
    if(!q) return;
    console.clear(); // Ghost Protocol: លុបដានក្នុង Console
    logMsg("> " + q, "user");

    if(learningMode) {
        brain[learningMode] = q;
        localStorage.setItem('ghost_brain', JSON.stringify(brain));
        logMsg("AI: Neural pattern integrated.", "ai");
        speak("Pattern saved.");
        learningMode = null;
        return;
    }

    if(brain[q]) {
        logMsg("AI: " + brain[q], "ai");
        speak(brain[q]);
    } else {
        logMsg(`AI: Unknown pattern "${q}". Please define it:`, "ai");
        speak("Unknown pattern. Define it.");
        learningMode = q;
    }
}

input.onkeypress = (e) => { if(e.key === 'Enter') { process(input.value); input.value = ''; } };

// CSV Loader Logic
document.getElementById('csv').onchange = (e) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
        ev.target.result.split('\n').forEach(row => {
            const parts = row.split(',');
            if(parts.length >= 2) brain[parts[0].trim().toLowerCase()] = parts[1].trim();
        });
        localStorage.setItem('ghost_brain', JSON.stringify(brain));
        logMsg("AI: Core expansion complete.", "ai");
        speak("Knowledge base updated.");
    };
    reader.readAsText(e.target.files[0]);
};

function wipe() { if(confirm("Initiate memory wipe?")) { localStorage.clear(); location.reload(); } }

