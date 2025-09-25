const form = document.getElementById("form");
  const tabela = document.querySelector("#tabela .corpo-tabela");
  const dataInput = document.getElementById("data");
  const horarioInput = document.getElementById("horario");
  const cargaInput = document.getElementById("cargaHoraria");
  
  let jornadaDiarias = JSON.parse(localStorage.getItem("jornadaDiarias")) || [];
  let cargaHorarias = JSON.parse(localStorage.getItem("cargaHorarias")) || [];

  let totalTrabalhadas = 0;
  let totalPositiva = 0;
  let totalNegativa = 0;

  const totalHoraTrabalhadas = document.getElementById("totalTrabalhadas");
  const totalHoraPositiva = document.getElementById("totalHoraPositiva");
  const totalHoraNegativa = document.getElementById("totalHoraNegativa");
  
  // Preenche a data de hoje automaticamente
  const hoje = new Date();
  dataInput.value = hoje.toISOString().split("T")[0];

  // Se já houver carga horária salva → preencher o input
  const ultimaCargaSalva = localStorage.getItem("ultimaCargaSalva");
  if (ultimaCargaSalva) {
    cargaInput.value = ultimaCargaSalva;
  }

  // Carregar registros salvos ao abrir
  window.addEventListener("DOMContentLoaded", () => {
    jornadaDiarias.forEach(r => montarLinha(r.data, r.horarios));
    atualizarTotal();

  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = dataInput.value;
    const horario = horarioInput.value;
    const carga = cargaInput.value;

    if (!data || !horario) return;

    // Salva carga horária
    if (carga && !cargaHorarias.includes(carga)) {
      cargaHorarias.push(carga);
      cargaHorarias.sort((a, b) => a - b);
    }

    if (carga) {
      localStorage.setItem("ultimaCargaSalva", carga);
    }

    // Busca ou cria jornadaDiaria
    let jornadaDiaria = jornadaDiarias.find(r => r.data === data);
    if (!jornadaDiaria) {
      jornadaDiaria = { data, horarios: [] };
      jornadaDiarias.push(jornadaDiaria);
    }

    if (jornadaDiaria.horarios.length >= 4) {
      alert("Já foram registrados 4 horários para esta data!");
      return;
    }

    // 🔎 Validação: horário deve ser maior que o último informado
    if (jornadaDiaria.horarios.length > 0) {
      const ultimo = jornadaDiaria.horarios[jornadaDiaria.horarios.length - 1];
      if (diffMinutos(ultimo, horario) <= 0) {
        alert("O horário deve ser maior que o último informado!");
        return;
      }
    }

    jornadaDiaria.horarios.push(horario);

    salvarJornadaDiarias();
    montarTabela();
    horarioInput.value = "";

  });

  function montarTabela() {
    tabela.innerHTML = "";
    totalTrabalhadas = 0;
    totalPositiva = 0;
    totalNegativa = 0;

    jornadaDiarias.forEach(r => {
      montarLinha(r.data, r.horarios);
    });

    atualizarTotal();
  }

  function montarLinha(data, horarios) {
    const [ano, mes, dia] = data.split("-").map(Number);
    const dataCerta = new Date(ano, mes - 1, dia);
    const diaSemana = dataCerta.toLocaleDateString("pt-BR", { weekday: "long" });
    const dataFormatada = dataCerta.toLocaleDateString("pt-BR");

    const linha = document.createElement("div");
    linha.classList.add("linha-tabela");
    linha.dataset.data = data;
    linha.innerHTML = `
        <p>${diaSemana}</p>
        <p>${dataFormatada}</p>
        <p class="entrada">${horarios[0] || ""}</p>
        <p class="saida-almoco">${horarios[1] || ""}</p>
        <p class="retorno">${horarios[2] || ""}</p>
        <p class="saida-final">${horarios[3] || ""}</p>
        <p class="horas-trabalhadas"></p>
        <p class="hora-extra"></p>
        <p class="hora-devendo"></p>
    `;
    tabela.appendChild(linha);

    calcularHoras(linha, horarios);
  }

function calcularHoras(linha, horarios) {
  let totalMin = 0;

  //Percorre os horarios de 2 em 2 (entrada e saida)
  for (let i = 0; i < horarios.length; i += 2) {
    const entrada = horarios[i];
    const saida = horarios[i + 1];
    if (entrada && saida) {
      totalMin += diffMinutos(entrada, saida);
    }
  }
  
  //Mostra o total de horas trabalhadas na linha
  linha.querySelector(".horas-trabalhadas").textContent = formatarTempo(totalMin);
  
  //Verifica carga horaria e calcula horas extras
  const ultimaCargaSalva = localStorage.getItem("ultimaCargaSalva");
  if (cargaInput?.value || ultimaCargaSalva) {
    const carga = parseInt(ultimaCargaSalva || cargaInput.value) * 60
    const extraMin = totalMin - carga;
    let horaExtraTexto = "";
    let horaDevendoTexto = "";

    if (extraMin > 0) {
      horaExtraTexto = `+${formatarTempo(extraMin)}`;
      totalPositiva += extraMin; // só soma positivos ao total
    } else if (extraMin < 0) {
      horaDevendoTexto = `-${formatarTempo(Math.abs(extraMin))}`;
      totalNegativa += Math.abs(extraMin); // só soma negativos ao total
    }
    //Atualiza colunas da tabela
    linha.querySelector(".hora-extra").textContent = horaExtraTexto;
    linha.querySelector(".hora-devendo").textContent = horaDevendoTexto;
  }
  totalTrabalhadas += totalMin;
}

function diffMinutos(hora1, hora2) {
  const [h1, m1] = hora1.split(":").map(Number);
  const [h2, m2] = hora2.split(":").map(Number);

  const minuto1 = h1 * 60 + m1;
  const minuto2 = h2 * 60 + m2;

  return minuto2 - minuto1;
}

function formatarTempo(minutosTotais) {
  const h = Math.floor(Math.abs(minutosTotais) / 60);
  const m = Math.abs(minutosTotais) % 60;

  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

function atualizarTotal() {
  const h = Math.floor(totalPositiva / 60);
  const m = totalPositiva % 60;
  const totalHorasSemana = h + (m > 0 ? 1 : 0); // arredonda pra cima se tiver minutos

  if (totalHorasSemana >= 44) {
    console.log(`✅ Jornada semanal atingida: ${formatarTempo(totalTrabalhadas)} (>= 44h)`);
  } else {
    console.log(`⚠️ Jornada semanal incompleta: ${formatarTempo(totalTrabalhadas)} (< 44h)`);
  }

  totalHoraPositiva.textContent = `Total de Horas Positiva: ${h}h ${m}m`;

  const j = Math.floor(totalNegativa / 60);
  const n = totalNegativa % 60;
  totalHoraNegativa.textContent = `Total de Horas Negativa: ${j}h ${n}m`;

  const g = Math.floor(totalTrabalhadas / 60);
  const t = totalTrabalhadas % 60;
  totalHoraTrabalhadas.textContent = `Total de Horas Trabalhadas: ${g}h ${t}m`;
}

function salvarJornadaDiarias() {
  localStorage.setItem("jornadaDiarias", JSON.stringify(jornadaDiarias));
}