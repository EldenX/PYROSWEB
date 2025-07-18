// Archivo: server.js

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
// Railway te asignará un puerto automáticamente a través de la variable de entorno PORT
const port = process.env.PORT || 3000; 

// Tu clave de API de Gemini se leerá de las variables de entorno de Railway
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Middlewares
app.use(cors()); // Permite peticiones desde cualquier origen
app.use(express.json({ limit: '10mb' }));

// Endpoint para comunicarse con la API
app.post('/api/gemini', async (req, res) => {
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'La clave API no está configurada en el servidor.' });
    }

    const { prompt, mimeType, imageData } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'El prompt es requerido.' });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${GEMINI_API_KEY}`;

    const parts = [{ text: prompt }];
    if (mimeType && imageData) {
        parts.push({
            inline_data: {
                mime_type: mimeType,
                data: imageData
            }
        });
    }

    const payload = {
        contents: [{ role: "user", parts: parts }],
        generation_config: {
            temperature: 0.2,
            top_p: 0.95,
            top_k: 40,
            max_output_tokens: 500
        }
    };

    try {
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await apiResponse.json();
        res.status(apiResponse.status).json(result);

    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

app.listen(port, () => {
    console.log(`🚀 Servidor escuchando en el puerto ${port}`);
});
