document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('calcForm');
    const resultsSection = document.getElementById('resultsSection');
    const resConsumo = document.getElementById('resConsumo');
    const resTotal = document.getElementById('resTotal');
    const explanationText = document.getElementById('explanationText');

    // Botón Saludo
    const welcomeModal = document.getElementById('welcomeModal');
    const btnStart = document.getElementById('btnStart');

    // Comprobar si ya se saludó (para no molestar si recarga, opcional - lo dejaremos siempre por ser tierno)
    btnStart.addEventListener('click', () => {
        welcomeModal.classList.add('fade-out');
        setTimeout(() => {
            welcomeModal.style.display = 'none';
        }, 500); // Esperar a la animación
    });

    // Formateador de moneda (Pesos Colombianos por defecto dado el contexto del prompt anterior, o neutro)
    const currencyFormatter = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    });

    const numberFormatter = new Intl.NumberFormat('es-CO', {
        maximumFractionDigits: 2
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Obtener valores
        const prevReading = parseFloat(document.getElementById('prevReading').value);
        const currReading = parseFloat(document.getElementById('currReading').value);
        const unitPrice = parseFloat(document.getElementById('unitPrice').value);

        // Obtener servicio seleccionado (para el texto de unidades)
        const service = document.querySelector('input[name="service"]:checked').value;
        let unit = 'unidades';
        if (service === 'water') unit = 'm³';
        if (service === 'energy') unit = 'kWh';
        if (service === 'gas') unit = 'm³';

        // Validaciones básicas
        if (currReading < prevReading) {
            alert('¡Ojo! La lectura actual no puede ser menor a la anterior.');
            return;
        }

        // Cálculos
        const consumption = currReading - prevReading;
        const totalPay = consumption * unitPrice;

        // --- Actualizar Factura ---

        // 1. Cabecera y Fecha
        const now = new Date();
        document.getElementById('invoiceDate').textContent = now.toLocaleDateString();

        // Icono y nombre servicio
        const serviceMap = {
            'water': { icon: '💧', name: 'Servicio de Agua' },
            'energy': { icon: '⚡', name: 'Servicio de Energía' },
            'gas': { icon: '🔥', name: 'Servicio de Gas' }
        };
        document.getElementById('invoiceServiceIcon').textContent = serviceMap[service].icon;
        document.getElementById('invoiceServiceName').textContent = serviceMap[service].name;

        // 2. Tabla de detalles
        document.getElementById('invPrev').textContent = prevReading;
        document.getElementById('invCurr').textContent = currReading;
        document.getElementById('invConsumo').textContent = numberFormatter.format(consumption);
        document.getElementById('invUnit').textContent = unit;
        document.getElementById('invPrice').textContent = currencyFormatter.format(unitPrice);
        document.getElementById('invTotal').textContent = currencyFormatter.format(totalPay);


        // Generar texto explicativo dinámico para abajo
        const explanation = `
            Si tu lectura actual es <strong>${currReading}</strong> y la anterior fue <strong>${prevReading}</strong>, 
            significa que consumiste <strong>${numberFormatter.format(consumption)} ${unit}</strong> este mes.<br><br>
            
            Como cada unidad cuesta <strong>${currencyFormatter.format(unitPrice)}</strong>, multiplicamos:
            <br>
            <em>${numberFormatter.format(consumption)} x ${currencyFormatter.format(unitPrice)} = ${currencyFormatter.format(totalPay)}</em>
        `;

        explanationText.innerHTML = explanation;

        // Hacer visible la sección de resultados (y ahora factura)
        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    // Botón Imprimir
    document.getElementById('btnPrint').addEventListener('click', () => {
        window.print();
    });

    // Botón Copiar
    document.getElementById('btnCopy').addEventListener('click', () => {
        const textToCopy = explanationText.innerText; // Obtener solo el texto limpio
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = document.getElementById('btnCopy').innerHTML;
            document.getElementById('btnCopy').innerHTML = '✅ ¡Copiado!';
            setTimeout(() => {
                document.getElementById('btnCopy').innerHTML = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Error al copiar:', err);
            alert('No se pudo copiar automáticamente. Intenta seleccionarlo manualmente.');
        });
    });
});
