const GROQ_API_KEY = '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';
fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Siklus haid saya mulai tanggal 2024-05-05 dan berakhir 2024-05-10. Hari ini tanggal 2024-05-15. Berikan analisis singkat status saya dan 2 rekomendasi (1 makanan dan minuman, 1 kegiatan) dalam format JSON: {"status": "string", "makanan dan minuman": "string", "kegiatan": "string"}. Ingat, kembalikan HANYA JSON murni tanpa markdown, tanpa kalimat tambahan.' }]
    })
})
.then(r => r.json())
.then(data => console.log(JSON.stringify(data)))
.catch(e => console.error(e));
