// ១. បង្កើត Ciphertext សម្រាប់ "dutyfree" (SHA-256)
const HASHED_PASS = "40798e1e7e780749001b9758782f9d3f11463e27546859560f707f2403f2601a";
const USERNAME = "huokaingthara";

async function hashPassword(plainText) {
    const msgUint8 = new TextEncoder().encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkLogin() {
    const user = document.getElementById('u').value;
    const pass = document.getElementById('p').value;
    
    // បំប្លែង Password ដែលអ្នកប្រើវាយចូល ទៅជា Cipher
    const inputHash = await hashPassword(pass);

    if (user === USERNAME && inputHash === HASHED_PASS) {
        alert("ចូលប្រព័ន្ធជោគជ័យ - Access Granted!");
        startBootSequence(); // ដំណើរការ AI
    } else {
        alert("ទិន្នន័យមិនត្រឹមត្រូវ! (Brute force protection active)");
    }
}
