// Archivo: server.js

const express = require('express');
const fetch = require('node-fetch'); // Asegúrate de que 'node-fetch' esté instalado (npm install node-fetch@2)
const cors = require('cors');

const app = express();
// Railway asignará un puerto automáticamente a través de la variable de entorno PORT
const port = process.env.PORT || 3000; 

// Tu clave de API de Gemini se leerá de las variables de entorno de Railway
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Middlewares
app.use(cors()); // Permite peticiones desde cualquier origen (ajusta esto en producción si necesitas más seguridad)
app.use(express.json({ limit: '10mb' })); // Aumenta el límite para manejar imágenes grandes

// Endpoint de prueba para verificar que el servidor está funcionando
app.get('/', (req, res) => {
    res.send('Backend de Pyros funcionando!');
});

// Endpoint para comunicarse con la API de Gemini
app.post('/api/gemini', async (req, res) => {
    // Verifica si la clave API está configurada
    if (!GEMINI_API_KEY) {
        console.error('Error: La clave API de Gemini no está configurada en el servidor.');
        return res.status(500).json({ error: 'La clave API no está configurada en el servidor.' });
    }

    const { prompt, mimeType, imageData } = req.body;

    // Verifica que el prompt sea requerido
    if (!prompt) {
        console.error('Error: El prompt es requerido en la solicitud.');
        return res.status(400).json({ error: 'El prompt es requerido.' });
    }

    // URL de la API de Gemini (usando gemini-2.0-flash para consistencia)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const parts = [{ text: prompt }];
    if (mimeType && imageData) {
        // CORRECCIÓN CLAVE: Usar 'inlineData' y 'mimeType' en camelCase
        parts.push({
            inlineData: {
                mimeType: mimeType,
                data: imageData
            }
        });
    }

    const payload = {
        contents: [{ role: "user", parts: parts }],
        generationConfig: { // CORRECCIÓN: Usar 'generationConfig' en camelCase
            temperature: 0.2,
            topP: 0.95, // CORRECCIÓN: Usar 'topP' en camelCase
            topK: 40,    // CORRECCIÓN: Usar 'topK' en camelCase
            maxOutputTokens: 500
        }
    };

    try {
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await apiResponse.json();

        // Si la respuesta de Gemini no es OK, loguea el error y reenvíalo
        if (!apiResponse.ok) {
            console.error('Error de la API de Gemini:', result);
            return res.status(apiResponse.status).json({ 
                error: 'Error de la API de Gemini', 
                details: result.error?.message || JSON.stringify(result) 
            });
        }
        
        // Envía la respuesta de Gemini directamente al cliente
        res.status(apiResponse.status).json(result);

    } catch (error) {
        console.error('Error interno del servidor al llamar a Gemini:', error);
        res.status(500).json({ error: 'Error interno del servidor al procesar la solicitud.' });
    }
});

// Inicia el servidor
app.listen(port, () => {
    console.log(`🚀 Servidor escuchando en el puerto ${port}`);
});
