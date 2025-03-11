async function generateCopies() {
    const url = document.getElementById("url").value;

    if (!url) {
        alert("Por favor, ingresa un enlace.");
        return;
    }

    try {
        // Enviar el enlace al backend
        const response = await fetch("/generate-copies", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ url }),
        });

        const data = await response.json();

        if (data.error) {
            alert(data.error);
        } else {
            // Mostrar los copys generados en los campos respectivos
            document.getElementById("fb-copy").innerText = data.facebook;
            document.getElementById("twitter-copy").innerText = data.twitter;
            document.getElementById("wpp-copy").innerText = data.wpp;  // Aquí cambiamos a 'data.wpp'
        }
    } catch (error) {
        console.error("Error generando los copys:", error);
        alert("Hubo un error al generar los copys. Inténtalo de nuevo.");
    }
}

async function shortenUrl(url) {
    const longUrlWithUtm = `${url}?utm_source=whatsapp&utm_medium=social&utm_campaign=canal`;

    console.log('URL antes de acortar:', longUrlWithUtm);

    try {
        const response = await fetch('/shorten-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: longUrlWithUtm }) // Enviamos la URL al backend
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error en la solicitud de acortamiento:', errorData);
            alert('Hubo un error al acortar el enlace. Verifica la URL y los parámetros.');
            return null;
        }

        const data = await response.json();
        console.log('URL acortada:', data.shortenedUrl);
        return data.shortenedUrl;
    } catch (error) {
        console.error('Error al realizar la solicitud:', error);
        alert('Hubo un error al realizar la solicitud para acortar el enlace.');
        return null;
    }
}

document.getElementById('copyForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const url = document.getElementById('urlInput').value;

    if (!url) {
        alert("Por favor, ingresa un enlace válido.");
        return;
    }

    try {
        const response = await fetch('/generate-copies', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('fbCopy').value = data.facebook;
            document.getElementById('twitterCopy').value = data.twitter;
            document.getElementById('wppCopy').value = data.wpp;
        } else {
            alert("Hubo un error generando los copys.");
        }
    } catch (error) {
        alert("Error en la comunicación con el servidor.");
    }
});

// Función para copiar al portapapeles
document.querySelectorAll('.copy-btn').forEach(button => {
    button.addEventListener('click', function () {
        const target = document.getElementById(this.dataset.target);
        target.select();
        document.execCommand('copy');
    });
});

// Funcionalidad para copiar la URL original y acortada
document.getElementById('copyOriginalUrl').addEventListener('click', function () {
    const urlInput = document.getElementById('urlInput');
    urlInput.select();
    document.execCommand('copy');
    alert("URL Original copiada");
});

// Función para pegar la URL desde el portapapeles
document.getElementById('pasteUrl').addEventListener('click', async function () {
    try {
        const text = await navigator.clipboard.readText(); // Lee el texto del portapapeles
        document.getElementById('urlInput').value = text;  // Pega el texto en el campo de entrada
    } catch (error) {
        alert("No se pudo pegar el contenido del portapapeles.");
    }
});


document.getElementById('copyShortenedUrl').addEventListener('click', async function () {
    const url = document.getElementById('urlInput').value;
    
    if (!url) {
        alert("Por favor, ingresa un enlace válido.");
        return;
    }

    try {
        const response = await fetch('/shorten-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        const data = await response.json();
        
        if (response.ok) {
            navigator.clipboard.writeText(data.shortenedUrl);
            alert("URL Acortada copiada");
        } else {
            alert("Hubo un error al acortar la URL.");
        }
    } catch (error) {
        alert("Error al comunicar con el servidor.");
    }
});

