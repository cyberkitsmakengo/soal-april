const payloadEl = document.getElementById('payload');
const outputEl = document.getElementById('output');
const sendBtn = document.getElementById('sendBtn');
const resetBtn = document.getElementById('resetBtn');

const defaultPayload = `{
  "username": "admin",
  "password": "admin"
}`;

resetBtn?.addEventListener('click', () => {
  payloadEl.value = defaultPayload;
  outputEl.textContent = 'Payload di-reset.';
});

sendBtn?.addEventListener('click', async () => {
  outputEl.textContent = 'Sending...';

  let parsed;
  try {
    parsed = JSON.parse(payloadEl.value);
  } catch (error) {
    outputEl.textContent = `JSON error: ${error.message}`;
    return;
  }

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(parsed)
    });

    const data = await response.json();
    outputEl.textContent = JSON.stringify(data, null, 2);

    if (data.ok && data.redirect) {
      setTimeout(() => {
        window.location.href = data.redirect;
      }, 500);
    }
  } catch (error) {
    outputEl.textContent = `Request error: ${error.message}`;
  }
});
