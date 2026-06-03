const GROQ_API_KEY = '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';
fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Test' }]
    })
})
.then(r => r.json())
.then(data => console.log(JSON.stringify(data)))
.catch(e => console.error(e));
