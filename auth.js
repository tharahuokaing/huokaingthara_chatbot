// Ciphertext នៃ "dutyfree" (SHA-256)
const KEY_PATH = "40798e1e7e780749001b9758782f9d3f11463e27546859560f707f2403f2601a";
const AUTH_USER = "huokaingthara";

async function encryptInput(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function validateAccess() {
    const user = document.getElementById('u').value;
    const pass = document.getElementById('p').value;
    const inputCipher = await encryptInput(pass);

    if (user === AUTH_USER && inputCipher === KEY_PATH) {
        // បិទផ្ទាំង Login និងបង្ហាញប្រព័ន្ធ AI
        document.getElementById('login-overlay').style.display = 'none';
        startBootSequence(); // ហៅមុខងារ AI របស់អ្នក
    } else {
        alert("ACCESS DENIED: Credentials mismatch.");
    }
}
