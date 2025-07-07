function calculateSLA() {
    const startDateTimeStr = document.getElementById('startDateTime').value;
    const workdayStartStr = document.getElementById('workdayStart').value;
    const workdayEndStr = document.getElementById('workdayEnd').value;
    const includeWeekends = document.getElementById('includeWeekends').checked;
    const holidaysStr = document.getElementById('holidays').value;
    const slaHours = parseFloat(document.getElementById('slaHours').value);
    const pauseHours = parseInt(document.getElementById('pauseHours').value);
    const pauseMinutes = parseInt(document.getElementById('pauseMinutes').value);

    if (!startDateTimeStr) {
        alert('Por favor, insira a Data e Hora de Início do Ticket.');
        return;
    }

    const startDateTime = new Date(startDateTimeStr);
    const [wsHour, wsMinute] = workdayStartStr.split(':').map(Number);
    const [weHour, weMinute] = workdayEndStr.split(':').map(Number);
    const holidays = holidaysStr.split(',').map(h => h.trim()).filter(h => h).map(h => new Date(h + 'T00:00:00'));

    let currentDateTime = new Date(startDateTime.getTime());
    let remainingSLA = (slaHours * 60); // Convertendo SLA para minutos

    const totalPauseMinutes = (pauseHours * 60) + pauseMinutes;
    remainingSLA += totalPauseMinutes; 

    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `<strong>Calculando...</strong>`;

    // Função para verificar se é feriado
    const isHoliday = (date) => {
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return holidays.some(holiday => holiday.getTime() === dateOnly.getTime());
    };

    // Função para verificar se é fim de semana (sábado ou domingo)
    const isWeekend = (date) => {
        const day = date.getDay();
        return day === 0 || day === 6; // Domingo (0) ou Sábado (6)
    };

    while (remainingSLA > 0) {
        // Lógica: pular feriados OU (se NÃO for para incluir finais de semana E for fim de semana)
        if (isHoliday(currentDateTime) || (!includeWeekends && isWeekend(currentDateTime))) {
            currentDateTime.setDate(currentDateTime.getDate() + 1);
            currentDateTime.setHours(wsHour, wsMinute, 0, 0); // Volta para o início da jornada do próximo dia
            continue;
        }

        const currentHour = currentDateTime.getHours();
        const currentMinute = currentDateTime.getMinutes();

        // Se estiver fora da jornada de trabalho (antes do início), avança para o início da jornada
        if (currentHour < wsHour || (currentHour === wsHour && currentMinute < wsMinute)) {
            currentDateTime.setHours(wsHour, wsMinute, 0, 0);
            continue;
        }

        // Se já passou do fim da jornada de trabalho, avança para o início da jornada do próximo dia
        if (currentHour > weHour || (currentHour === weHour && currentMinute >= weMinute)) {
            currentDateTime.setDate(currentDateTime.getDate() + 1);
            currentDateTime.setHours(wsHour, wsMinute, 0, 0);
            continue;
        }

        // Calcula quanto tempo resta na jornada de trabalho do dia
        const endOfWorkday = new Date(currentDateTime);
        endOfWorkday.setHours(weHour, weMinute, 0, 0);
        let minutesUntilEndOfWorkday = (endOfWorkday.getTime() - currentDateTime.getTime()) / (1000 * 60);

        // Garante que não calcule tempo negativo se já estiver no fim da jornada
        if (minutesUntilEndOfWorkday < 0) {
            currentDateTime.setDate(currentDateTime.getDate() + 1);
            currentDateTime.setHours(wsHour, wsMinute, 0, 0);
            continue;
        }

        if (minutesUntilEndOfWorkday >= remainingSLA) {
            currentDateTime.setMinutes(currentDateTime.getMinutes() + remainingSLA);
            remainingSLA = 0;
        } else {
            remainingSLA -= minutesUntilEndOfWorkday;
            currentDateTime.setMinutes(currentDateTime.getMinutes() + minutesUntilEndOfWorkday);
            // Passou do fim da jornada, avança para o próximo dia útil
            currentDateTime.setDate(currentDateTime.getDate() + 1);
            currentDateTime.setHours(wsHour, wsMinute, 0, 0);
        }
    }

    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    const formattedResult = currentDateTime.toLocaleString('pt-BR', options);

    resultDiv.innerHTML = `
        <p>Data e Hora de Início do Ticket: <strong>${startDateTime.toLocaleString('pt-BR', options)}</strong></p>
        <p>Jornada de Trabalho: <strong>${workdayStartStr} às ${workdayEndStr}</strong> (Finais de Semana ${includeWeekends ? 'Contabilizados' : 'Ignorados'})</p>
        <p>Feriados Considerados: <strong>${holidays.length > 0 ? holidaysStr : 'Nenhum'}</strong></p>
        <p>SLA Definido: <strong>${slaHours} horas</strong></p>
        <p>Tempo de Pausa Adicional: <strong>${pauseHours} horas e ${pauseMinutes} minutos</strong></p>
        <hr style="border: 0; height: 1px; background: var(--result-border); margin: 15px 0;">
        <p>Data e Hora Limite do SLA: <strong>${formattedResult}</strong></p>
    `;
}