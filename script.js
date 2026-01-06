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
        maximumFractionDigits: 10
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
        document.getElementById('invTotal').dataset.raw = totalPay;


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

    // --- Lógica de Acumulado Total ---
    let totalServices = [];
    const btnAddTotal = document.getElementById('btnAddTotal');
    const totalSection = document.getElementById('totalSection');
    const serviceList = document.getElementById('serviceList');
    const grandTotalDisplay = document.getElementById('grandTotalDisplay');
    const btnClearTotal = document.getElementById('btnClearTotal');

    // Variable temporal para guardar el último cálculo válido
    let lastCalculation = null;

    // Capturar el último cálculo cuando se hace submit
    const originalSubmitHandler = form.onsubmit; // No capturamos directamente porque ya hay un listener, mejor usamos variables globales o extraemos info del DOM

    // Mejor estrategia: Extraer info del DOM actual al hacer click en "Agregar"
    btnAddTotal.addEventListener('click', () => {
        const serviceName = document.getElementById('invoiceServiceName').textContent;
        // Limpiamos el texto de moneda para obtener el número
        const totalText = document.getElementById('invTotal').textContent;
        const totalValue = parseFloat(totalText.replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.')); // Ajuste rudo para parsear moneda formateada, idealmente usaríamos el valor crudo 'totalPay' si tuviera alcance, pero extraer del DOM es más desacoplado aquí.

        // Pero espera! 'totalPay' está en el scope del submit. 
        // Vamos a hacer que el submit guarde el ultimo resultado en una variable accesible.
    });

    // REFACTOR: Mover lógica de cálculo para tener acceso a variables
    let currentResult = {
        service: '',
        amount: 0
    };

    form.addEventListener('submit', () => {
        // ... (el listener anterior ya corre) ...
        // Este listener corre DESPUES del anterior, así que aprovechamos para leer del DOM o re-computar?
        // Mejor: modifiquemos el listener original.
    });

    // --- RE-IMPLEMENTACIÓN DEL LISTENER DE FORMULARIO PARA SOPORTAR 'ADD TO TOTAL' ---
    // (Para no duplicar código, asumiremos que el listener original de la línea 31 sigue ahí.
    //  Vamos a usar una variable global 'currentCalculatedAmount' que actualizaremos).

    // Necesitamos inyectar la actualización de 'currentCalculatedAmount' dentro del listener principal. 
    // Como no puedo editar fácilmente "insertando" en medio de la función grande con replace simple, 
    // voy a agregar lógica al botón "Agregar" que lea del DOM, que es seguro.

    btnAddTotal.addEventListener('click', () => {
        // Leer valores directamente de la factura generada visible
        const name = document.getElementById('invoiceServiceName').textContent;
        const consumo = document.getElementById('invConsumo').textContent;
        const unit = document.getElementById('invUnit').textContent;
        const price = document.getElementById('invPrice').textContent;

        // Parsear el valor total del DOM es arriesgado por los puntos/comas.
        // TRUCO: Guardar el valor crudo en un dataset del elemento total cuando se calcula.
        const rawTotal = document.getElementById('invTotal').dataset.raw;

        if (!rawTotal) return; // No se ha calculado nada

        const amount = parseFloat(rawTotal);

        // Agregamos objeto con más detalles
        totalServices.push({ name, amount, consumo, unit, price });
        updateTotalUI();

        // Feedback visual
        const originalText = btnAddTotal.innerHTML;
        btnAddTotal.innerHTML = '✅ Agregado';
        setTimeout(() => btnAddTotal.innerHTML = originalText, 1000);
    });

    btnClearTotal.addEventListener('click', () => {
        totalServices = [];
        updateTotalUI();
        totalSection.classList.add('hidden');
    });

    function updateTotalUI() {
        const finalTableBody = document.getElementById('finalTableBody');
        const finalGrandTotal = document.getElementById('finalGrandTotal');
        // Eliminados inputs de cliente

        // Actualizar fecha
        document.getElementById('finalDate').textContent = new Date().toLocaleDateString();

        // Renderizar filas com más detalles
        finalTableBody.innerHTML = totalServices.map((item) => `
            <tr>
                <td><strong>${item.name}</strong></td>
                <td>${item.consumo} ${item.unit}</td>
                <td>${item.price}</td>
                <td class="text-right">${currencyFormatter.format(item.amount)}</td>
            </tr>
        `).join('');

        // Calcular total
        const grandTotal = totalServices.reduce((acc, curr) => acc + curr.amount, 0);
        finalGrandTotal.textContent = currencyFormatter.format(grandTotal);

        if (totalServices.length > 0) {
            totalSection.classList.remove('hidden');
            totalSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            totalSection.classList.add('hidden');
        }
    }

    // Botón Imprimir Final
    const btnPrintFinal = document.getElementById('btnPrintFinal');
    if (btnPrintFinal) {
        btnPrintFinal.addEventListener('click', () => {
            // Truco: Para imprimir SOLO la factura final, ocultamos lo demás temporalmente via CSS Print o clases
            // Pero como ya tenemos estilos print que ocultan '.module', asegurémonos que '#totalSection' se vea.
            // En styles.css ya pusimos .results-card display:block, necesitamos que totalSection tambien.
            // Vamos a agregar una clase especial al body para saber que estamos imprimiendo GLOBAL.
            document.body.classList.add('printing-final');
            window.print();
            document.body.classList.remove('printing-final');
        });
    }

    // --- FIN LÓGICA ACUMULADO ---

    // Botón Imprimir
    document.getElementById('btnPrint').addEventListener('click', () => {
        window.print();
    });

    // Botón Copiar
    document.getElementById('btnCopy').addEventListener('click', () => {
        const textToCopy = explanationText.innerText;
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
