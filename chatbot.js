/* =========================================
   SECURE CHATBOT (Connecting to Proxy)
   ========================================= */

// REPLACE THIS WITH YOUR CLOUDFLARE WORKER URL
const WORKER_URL = "https://tapt-chat-proxy.moominafarash.workers.dev/"; 

document.addEventListener('DOMContentLoaded', () => {
    // 1. Create Chat Widget HTML
    const chatWidget = document.createElement('div');
    chatWidget.id = 'tapt-chatbot';
    chatWidget.innerHTML = `
        <div id="chat-trigger" onclick="toggleChat()">
            <i class="fa-solid fa-message"></i>
        </div>
        <div id="chat-window">
            <div class="chat-header">
                <span>TAPT. Assistant</span>
                <button onclick="toggleChat()">&times;</button>
            </div>
            <div id="chat-messages">
                <div class="msg bot">Hello! How can I help you design your legacy today?</div>
            </div>
            <div class="chat-input-area">
                <input type="text" id="user-input" placeholder="Type a message..." onkeypress="handleEnter(event)">
                <button onclick="sendMessage()"><i class="fa-solid fa-paper-plane"></i></button>
            </div>
        </div>
    `;
    document.body.appendChild(chatWidget);
});

// 2. State & Toggle
let isChatOpen = false;

window.toggleChat = function() {
    const windowEl = document.getElementById('chat-window');
    isChatOpen = !isChatOpen;
    windowEl.style.display = isChatOpen ? 'flex' : 'none';
    if(isChatOpen) document.getElementById('user-input').focus();
};

window.handleEnter = function(e) {
    if(e.key === 'Enter') sendMessage();
};

// 3. Messaging Logic
window.sendMessage = async function() {
    const input = document.getElementById('user-input');
    const msgContainer = document.getElementById('chat-messages');
    const text = input.value.trim();

    if(!text) return;

    // Add User Message
    addMessage(text, 'user');
    input.value = '';

    // Add Loading Indicator
    const loadingId = 'loading-' + Date.now();
    addMessage('...', 'bot', loadingId);

    try {
        // CALL YOUR WORKER, NOT OPENAI DIRECTLY
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                // NO API KEY HERE! It is safe now.
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are a helpful support assistant for TAPT, a brand that sells premium NFC business cards and tags. Be concise, polite, and cool." },
                    { role: "user", content: text }
                ]
            })
        });

        const data = await response.json();
        
        // Remove loading and add actual response
        const loadingEl = document.getElementById(loadingId);
        if(loadingEl) loadingEl.remove();

        if(data.error) {
            addMessage("Error: " + (data.error.message || "Unknown error"), 'bot');
        } else {
            const reply = data.choices[0].message.content;
            addMessage(reply, 'bot');
        }

    } catch (error) {
        console.error(error);
        const loadingEl = document.getElementById(loadingId);
        if(loadingEl) loadingEl.remove();
        addMessage("Sorry, connection error.", 'bot');
    }
};

function addMessage(text, sender, id = null) {
    const div = document.createElement('div');
    div.className = `msg ${sender}`;
    div.innerText = text;
    if(id) div.id = id;
    document.getElementById('chat-messages').appendChild(div);
    const container = document.getElementById('chat-messages');
    container.scrollTop = container.scrollHeight;
}
