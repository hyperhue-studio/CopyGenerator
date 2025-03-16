import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';

dotenv.config();

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

app.post("/generate-copies", async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: "La URL es obligatoria." });
    }

    try {
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);

        const title = $('meta[property="og:title"]').attr('content');
        const description = $('meta[property="og:description"]').attr('content');

        if (!title || !description) {
            return res.status(400).json({ error: "No se encontraron los meta tags adecuados." });
        }

        const combinedText = `${title}. ${description}`;

        const fbPrompt = `Genera un título sobre la siguiente noticia, debe ser informativo y con un tono directo, pero también carismático y llamativo. Breve y al grano, idealmente no más de 10 palabras. Incluye de 1 a 2 emojis(pueden ir al principio, en medio o al final, pero que sean respetuosos en caso que sea un tema sensible).No respondas nada más que el título:"${combinedText}"`;
        const twitterPrompt = `Genera un título sobre la siguiente noticia, debe ser informativo y con un tono directo, un solo emoji al final. Conciso y al grano, idealmente no más de 10 palabras ya que es para un tweet. No respondas nada más que el título: "${combinedText}"`;
        const wppPrompt = `Genera un copy corto para la siguiente noticia. Debe tener un título muy corto(no más de 10 palabras) seguido de un párrafo de máximo 2 renglones describiendo un poco la noticia. Debe ser informativo y con un tono directo, pero también carismático y llamativo(en caso de que la noticia no sea de algo sensible, en dado caso tratarse con respeto).Incluye de 1 a 2 emojis(para título y párrafo, pero que sean respetuosos en caso que sea un tema sensible). No respondas nada más que el copy: "${combinedText}"`;

        const fbCopy = await model.generateContent([fbPrompt]);
        const twitterCopy = await model.generateContent([twitterPrompt]);
        const wppCopy = await model.generateContent([wppPrompt]);

        console.log("Facebook Copy:", fbCopy.response.text());
        console.log("Twitter Copy:", twitterCopy.response.text());
        console.log("WhatsApp Copy:", wppCopy.response.text());

        const fbText = fbCopy.response.text() || "Texto no disponible";
        const twitterText = twitterCopy.response.text() || "Texto no disponible";
        let wppText = wppCopy.response.text() || "Texto no disponible";

        const shortenedUrl = await shortenUrl(url);

        wppText = `${wppText}\nLee más aquí 👉 ${shortenedUrl}`;

        const twitterTextWithUrl = `${twitterText}\n${url}`;

        res.json({
            facebook: fbText,
            twitter: twitterTextWithUrl,
            wpp: wppText,
        });

    } catch (error) {
        console.error("Error al generar los copys:", error);
        res.status(500).json({ error: "Hubo un error al generar los copys." });
    }
});

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
        return data.link;
    } catch (error) {
        console.error("Error al realizar la solicitud para acortar la URL:", error);
        throw new Error("Hubo un error al realizar la solicitud para acortar la URL.");
    }
}

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

export default app;
