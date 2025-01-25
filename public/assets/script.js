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

document.getElementById('copyForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const url = document.getElementById('urlInput').value;

    if (!url) {
        alert("Por favor, ingresa un enlace válido.");
        return;
    }

    // Realizar la solicitud POST a la API
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
            // Asignar los valores a los campos
            document.getElementById('fbCopy').value = data.facebook;
            document.getElementById('twitterCopy').value = data.twitter;
            document.getElementById('wppCopy').value = data.wpp;  // Aquí cambiamos a 'data.wpp'
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
        alert("Texto copiado al portapapeles.");
    });
});
