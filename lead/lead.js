(() => {
  'use strict';
  // Paste the Apps Script Web App URL (…/exec) here after deploying. See apps-script/README.md.
  const ENDPOINT = 'https://script.google.com/macros/s/AKfycbwB7UFhmdmwZOc9ZqS7CGdIBhylgbV1Mu2mYtx38pzzSoidpmvUzRysoAcrYuEFK1Ue/exec';
  // true = simulate success locally without sending anything. Also forced on when ?mock=1 or ENDPOINT is a placeholder.
  const MOCK = new URLSearchParams(location.search).get('mock') === '1' || ENDPOINT.includes('example.invalid');
  const CONSENT_TEXT_VERSION = '2026-10-v1';
  const $ = id => document.getElementById(id);
  const form = $('lead-form'), email = $('email'), consent = $('consent'), btn = $('submit'), status = $('status');
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const setErr = (input, msg) => { $(input.id + '-err').textContent = msg; input.setAttribute('aria-invalid', msg ? 'true' : 'false'); };
  function validate() {
    let ok = true, first = null;
    const v = email.value.trim();
    if (!v) { setErr(email, '請填寫 Email'); ok = false; first = email; }
    else if (!EMAIL_RE.test(v)) { setErr(email, 'Email 格式好像不對，再檢查一下'); ok = false; first = email; }
    else setErr(email, '');
    if (!consent.checked) { setErr(consent, '請勾選同意，我們才能把清單寄給你'); ok = false; first = first || consent; }
    else setErr(consent, '');
    if (first) first.focus();
    return ok;
  }
  email.addEventListener('blur', () => { if (email.value) validate(); });
  consent.addEventListener('change', () => { if (consent.checked) setErr(consent, ''); });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    status.textContent = '';
    if (!validate()) return;
    const q = new URLSearchParams(location.search);
    const payload = {
      email: email.value.trim(),
      name: $('name').value.trim(),
      consent: true,
      consent_text_version: CONSENT_TEXT_VERSION,
      timestamp: new Date().toISOString(),
      source: q.get('utm_source') || 'ig_bio',
      utm_medium: q.get('utm_medium') || '',
      utm_campaign: q.get('utm_campaign') || '',
      page: location.href.split('?')[0],
      user_agent: navigator.userAgent,
      website: $('website').value, // honeypot: bots fill this, humans don't
    };
    btn.disabled = true; btn.textContent = '寄送中…';
    try {
      if (MOCK) await new Promise(r => setTimeout(r, 600));
      // text/plain + no-cors = a "simple request": no CORS preflight, which Apps Script can't answer.
      // The response is opaque, so a resolved fetch is treated as success; the script validates server-side.
      else await fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
      showSuccess(payload.name);
    } catch (err) {
      status.textContent = '網路好像不太穩，請稍後再試一次。';
      btn.disabled = false; btn.textContent = '免費寄給我';
    }
  });
  function showSuccess(name) {
    $('form-view').hidden = true;
    const s = $('success-view'); s.hidden = false;
    if (name) $('success-name').textContent = `謝謝你，${name}！幾分鐘內就會收到 Email。`;
    s.focus();
  }
})();
