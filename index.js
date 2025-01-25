import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';  // Importar cheerio correctamente

dotenv.config(); // Cargar las variables de entorno desde .env

const app = express();
const port = 3000;

// Configurar middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Inicializar la API de Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Ruta para hacer el scraping y generar los copys
app.post('/generate-copies', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'La URL es obligatoria.' });
    }

    try {
        // Hacer el scraping para obtener el título y la descripción
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);

        // Validar si existen los meta tags
        const title = $('meta[property="og:title"]').attr('content');
        const description = $('meta[property="og:description"]').attr('content');

        // Si no se encuentran los meta tags, manejar el error
        if (!title || !description) {
            return res.status(400).json({ error: 'No se encontraron los meta tags adecuados.' });
        }

        // Juntar los dos textos en uno solo
        const combinedText = `${title}. ${description}`;

        // Generar el copy para cada red social
        /* const fbPrompt = `Genera un texto atractivo para Facebook con el siguiente título y descripción: "${combinedText}"`;
        const twitterPrompt = `Genera un texto corto y conciso para Twitter con el siguiente título y descripción: "${combinedText}"`;
        const wppPrompt = `Genera un texto más largo para WhatsApp con el siguiente título y descripción, incluye un enlace acortado: "${combinedText}"`; */
        const fbPrompt = `Genera un título sobre la siguiente noticia, debe ser informativo y con un tono directo, pero también carismático y llamativo. Breve y al grano, idealmente no más de 10 palabras. Incluye de 1 a 2 emojis(pueden ir al principio, en medio o al final, pero que sean respetuosos en caso que sea un tema sensible).No respondas nada más que el título:"${combinedText}"`;
        const twitterPrompt = `Genera un título sobre la siguiente noticia, debe ser informativo y con un tono directo, un solo emoji al final. Conciso y al grano, idealmente no más de 10 palabras ya que es para un tweet. No respondas nada más que el título: "${combinedText}"`;
        const wppPrompt = `Genera un copy corto para la siguiente noticia. Debe tener un título muy corto(no más de 10 palabras) seguido de un párrafo de máximo 2 renglones describiendo un poco la noticia y cerrar con un renglón final que diga "Lee más aquí👉" ya que se concatenará a un enlace. Debe ser informativo y con un tono directo, pero también carismático y llamativo(en caso de que la noticia no sea de algo sensible, en dado caso tratarse con respeto).Incluye de 1 a 2 emojis(para título y párrafo, pero que sean respetuosos en caso que sea un tema sensible). No respondas nada más que el copy: "${combinedText}"`;

        // Llamadas a la API de Gemini para generar los textos
        const fbCopy = await model.generateContent([fbPrompt]);
        const twitterCopy = await model.generateContent([twitterPrompt]);
        const wppCopy = await model.generateContent([wppPrompt]);

        // Verifica la respuesta de la API para cada red social
        console.log("Facebook Copy:", fbCopy.response.text());
        console.log("Twitter Copy:", twitterCopy.response.text());
        console.log("WhatsApp Copy:", wppCopy.response.text());

        // Verifica si la respuesta es undefined
        const fbText = fbCopy.response.text() || "Texto no disponible";
        const twitterText = twitterCopy.response.text() || "Texto no disponible";
        const wppText = wppCopy.response.text() || "Texto no disponible";

        // Responder con los textos generados
        res.json({
            facebook: fbCopy.response.text(),
            twitter: twitterCopy.response.text(),
            wpp: wppCopy.response.text() // 'wpp' es el nombre de la propiedad
        });
        
    } catch (error) {
        console.error("Error al generar los copys:", error);
        res.status(500).json({ error: "Hubo un error al generar los copys." });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

export default app;
