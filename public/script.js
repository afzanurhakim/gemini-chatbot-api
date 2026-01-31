document.addEventListener('DOMContentLoaded', () => {
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');
  const themeSwitch = document.getElementById('theme-switch');

  let conversationHistory = [];

  // --- Theme Handling ---
  function applyTheme(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
    localStorage.setItem('darkMode', isDark);
  }

  // Check for saved theme preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('darkMode');
  const initialThemeIsDark = savedTheme !== null ? savedTheme === 'true' : prefersDark;

  themeSwitch.checked = initialThemeIsDark;
  applyTheme(initialThemeIsDark);

  themeSwitch.addEventListener('change', (e) => {
    applyTheme(e.target.checked);
  });
  // --------------------

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    addMessageToChatBox('user', userMessage);
    conversationHistory.push({ role: 'user', text: userMessage });
    userInput.value = '';

    const thinkingMessageElement = addMessageToChatBox('bot', 'Thinking...', 'thinking-message');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation: conversationHistory }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      if (data && data.result) {
        updateBotMessage(thinkingMessageElement, data.result);
        conversationHistory.push({ role: 'model', text: data.result });
      } else {
        updateBotMessage(thinkingMessageElement, 'Sorry, no response received.');
      }
    } catch (error) {
      console.error('Error:', error);
      updateBotMessage(thinkingMessageElement, 'Failed to get response from server.');
    }
  });

  function formatBotMessage(text) {
    // Escape HTML to prevent XSS, except for our specific formatting
    const escapedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    // 1. Bold: **text** -> <strong>text</strong>
    const boldFormatted = escapedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 2. Newlines: \n -> <br>
    const finalFormatted = boldFormatted.replace(/\n/g, '<br>');
    
    return finalFormatted;
  }

  function addMessageToChatBox(role, text, id = '') {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message-container');
    
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${role}-message`);
    
    if (id) {
      messageElement.id = id;
    }

    if (role === 'bot') {
      messageElement.innerHTML = formatBotMessage(text);
    } else {
      messageElement.innerText = text; // User input should not be parsed as HTML
    }
    
    messageContainer.appendChild(messageElement);
    chatBox.appendChild(messageContainer);
    chatBox.scrollTop = chatBox.scrollHeight;
    return messageElement;
  }

  function updateBotMessage(element, newText) {
    element.innerHTML = formatBotMessage(newText);
    element.id = ''; // Remove the temporary ID
  }
});
