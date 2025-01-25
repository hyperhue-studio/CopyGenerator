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
app.post("/generate-copies", async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: "La URL es obligatoria." });
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
            return res.status(400).json({ error: "No se encontraron los meta tags adecuados." });
        }

        // Juntar los dos textos en uno solo
        const combinedText = `${title}. ${description}`;

        // Generar el copy para cada red social
        const fbPrompt = `Genera un título sobre la siguiente noticia, debe ser informativo y con un tono directo, pero también carismático y llamativo. Breve y al grano, idealmente no más de 10 palabras. Incluye de 1 a 2 emojis(pueden ir al principio, en medio o al final, pero que sean respetuosos en caso que sea un tema sensible).No respondas nada más que el título:"${combinedText}"`;
        const twitterPrompt = `Genera un título sobre la siguiente noticia, debe ser informativo y con un tono directo, un solo emoji al final. Conciso y al grano, idealmente no más de 10 palabras ya que es para un tweet. No respondas nada más que el título: "${combinedText}"`;
        const wppPrompt = `Genera un copy corto para la siguiente noticia. Debe tener un título muy corto(no más de 10 palabras) seguido de un párrafo de máximo 2 renglones describiendo un poco la noticia. Debe ser informativo y con un tono directo, pero también carismático y llamativo(en caso de que la noticia no sea de algo sensible, en dado caso tratarse con respeto).Incluye de 1 a 2 emojis(para título y párrafo, pero que sean respetuosos en caso que sea un tema sensible). No respondas nada más que el copy: "${combinedText}"`;

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
        let wppText = wppCopy.response.text() || "Texto no disponible";

        // Llamar a la función de acortar la URL para WhatsApp
        const shortenedUrl = await shortenUrl(url);  // Usamos la función para acortar el enlace

        // Concatenar el enlace acortado al copy de WhatsApp
        wppText = `${wppText} Lee más aquí👉 ${shortenedUrl}`;

        // Concatenar el enlace original al copy de Twitter (en un renglón aparte)
        const twitterTextWithUrl = `${twitterText}\n${url}`;

        // Responder con los textos generados
        res.json({
            facebook: fbText,
            twitter: twitterTextWithUrl,  // Incluye el enlace original al final
            wpp: wppText,  // Incluye el enlace acortado al final
        });
        
    } catch (error) {
        console.error("Error al generar los copys:", error);
        res.status(500).json({ error: "Hubo un error al generar los copys." });
    }
});

// Función para acortar la URL utilizando la API de Bitly (al igual que en tu proyecto pasado)
async function shortenUrl(url) {
    try {
        const longUrlWithUtm = `${url}?utm_source=whatsapp&utm_medium=social&utm_campaign=canal`;

        console.log('URL antes de acortar:', longUrlWithUtm);

        const response = await fetch("https://api-ssl.bitly.com/v4/shorten", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.BITLY_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ long_url: longUrlWithUtm })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error en la solicitud de acortamiento:", errorData);
            throw new Error("Error al acortar la URL.");
        }

        const data = await response.json();
        console.log("URL acortada:", data.link);
        return data.link;  // Devolver la URL acortada
    } catch (error) {
        console.error("Error al realizar la solicitud para acortar la URL:", error);
        throw new Error("Hubo un error al realizar la solicitud para acortar la URL.");
    }
}


// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

export default app;
