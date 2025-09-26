const form = document.getElementById("form");
const tabela = document.querySelector("#tabela .corpo-tabela");
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

// Carregar registros salvos ao abrir
window.addEventListener("DOMContentLoaded", () => {
  jornadaDiarias.forEach(r => montarLinha(r));
  atualizarTotal();
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const hoje = new Date();
  const data = hoje.toISOString().split("T")[0]; // Formato YYYY-MM-DD

  const horario = horarioInput.value;
  const carga = cargaInput.value;

  if (!horario) return;

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
    jornadaDiaria = { data, horarios: [], horasTrabalhadas: "", horaExtra: "", horaDevendo: "" };
    jornadaDiarias.push(jornadaDiaria);
  }

  if (jornadaDiaria.horarios.length >= 4) {
    alert("Já foram registrados 4 horários para esta data!");
    return;
  }

  // Validação: horário deve ser maior que o último informado
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
    montarLinha(r);
  });

  atualizarTotal();
}

function montarLinha(jornada) {
  const [ano, mes, dia] = jornada.data.split("-").map(Number);
  const dataCerta = new Date(ano, mes - 1, dia);
  const diaSemana = dataCerta.toLocaleDateString("pt-BR", { weekday: "long" });
  const dataFormatada = dataCerta.toLocaleDateString("pt-BR");

  const linha = document.createElement("div");
  linha.classList.add("linha-tabela");
  linha.dataset.data = jornada.data;
  linha.innerHTML = `
      <p>${diaSemana}</p>
      <p>${dataFormatada}</p>
      <p>${jornada.horarios[0] || ""}</p>
      <p>${jornada.horarios[1] || ""}</p>
      <p>${jornada.horarios[2] || ""}</p>
      <p>${jornada.horarios[3] || ""}</p>
      <p class="horas-trabalhadas">${jornada.horasTrabalhadas || ""}</p>
      <p class="hora-extra">${jornada.horaExtra || ""}</p>
      <p class="hora-devendo">${jornada.horaDevendo || ""}</p>
  `;
  tabela.appendChild(linha);

  calcularHoras(jornada, linha);
}

function calcularHoras(jornada, linha) {
  let totalMin = 0;

  // Percorre os horarios de 2 em 2 (entrada e saída)
  for (let i = 0; i < jornada.horarios.length; i += 2) {
    const entrada = jornada.horarios[i];
    const saida = jornada.horarios[i + 1];
    if (entrada && saida) {
      totalMin += diffMinutos(entrada, saida);
    }
  }
  
  // Mostra o total de horas trabalhadas
  jornada.horasTrabalhadas = formatarTempo(totalMin);
  linha.querySelector(".horas-trabalhadas").textContent = jornada.horasTrabalhadas;
  
  // Verifica carga horária e calcula horas extras
  const ultimaCargaSalva = localStorage.getItem("ultimaCargaSalva");
  if (cargaInput?.value || ultimaCargaSalva) {
    const carga = parseInt(ultimaCargaSalva || cargaInput.value) * 60;
    const extraMin = totalMin - carga;

    if (extraMin > 0) {
      jornada.horaExtraMinutos = extraMin; // armazenar apenas número
      jornada.horaExtra = `+${formatarTempo(extraMin)}`; // para exibir na tabela
      jornada.horaDevendo = "";
      totalPositiva += extraMin;
    } else if (extraMin < 0) {
      jornada.horaDevendoMinutos = Math.abs(extraMin);
      jornada.horaDevendo = `-${formatarTempo(Math.abs(extraMin))}`;
      jornada.horaExtra = "";
      totalNegativa += Math.abs(extraMin);
    } else {
      jornada.horaExtra = "";
      jornada.horaExtraMinutos = 0;
      jornada.horaDevendo = "";
      jornada.horaDevendoMinutos = 0;
    }

    linha.querySelector(".hora-extra").textContent = jornada.horaExtra;
    linha.querySelector(".hora-devendo").textContent = jornada.horaDevendo;
  }
  totalTrabalhadas += totalMin;

  salvarJornadaDiarias();
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
  totalHoraPositiva.textContent = `Total de Horas Positiva: ${formatarTempo(totalPositiva)}`;
  totalHoraNegativa.textContent = `Total de Horas Negativa: ${formatarTempo(totalNegativa)}`;
  totalHoraTrabalhadas.textContent = `Total de Horas Trabalhadas: ${formatarTempo(totalTrabalhadas)}`;
}

function salvarJornadaDiarias() {
  localStorage.setItem("jornadaDiarias", JSON.stringify(jornadaDiarias));
}

function exportarJornadasParaJson() {
  const carga = localStorage.getItem("ultimaCargaSalva");
  const dados = localStorage.getItem("jornadaDiarias");
  if (!carga && !dados) {
    alert("Não há dados para exportar!");
    return;
  }
  const blob = new Blob([dados], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "jornadas.json";
  a.click();
  URL.revokeObjectURL(url);
}
document.getElementById("exportarJson").addEventListener("click", exportarJornadasParaJson);

function exportarParaPdf() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Título
  doc.setFontSize(14);
  doc.text("Jornada de Horários", 105, 10, { align: "center" });

  // Data de geração
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 177, 10, { align: "center" });

  // Recupera dados
  const jornadas = JSON.parse(localStorage.getItem("jornadaDiarias")) || [];
  const carga = localStorage.getItem("ultimaCargaSalva");

  if (carga) {
    doc.setFontSize(10);
    doc.text(`Carga Horária: ${carga}h`, 14, 20);
  }

  // Totais
  let totalTrabalhadas = 0;
  let totalPositiva = 0;
  let totalNegativa = 0;

  // Converte string de tempo em minutos
  function tempoParaMinutos(str) {
    if (!str) return 0;

    // Remove possíveis sinais '+' ou '-'
    str = str.replace(/[+-]/g, "").trim();

    // Formato "xh ym"
    const regex = /(\d+)h\s*(\d+)?m?/;
    const match = str.match(regex);
    if (match) {
      const h = parseInt(match[1]) || 0;
      const m = parseInt(match[2]) || 0;
      return h * 60 + m;
    }

    // Formato "HH:MM"
    if (str.includes(":")) {
      const [h, m] = str.split(":").map(Number);
      return (h || 0) * 60 + (m || 0);
    }

    // Formato decimal (ex: "1.5" = 1h30m)
    if (!isNaN(str)) {
      const h = Math.floor(parseFloat(str));
      const m = Math.round((parseFloat(str) - h) * 60);
      return h * 60 + m;
    }

    return 0;
  }

  // Soma os totais
  jornadas.forEach(j => {
  totalTrabalhadas += tempoParaMinutos(j.horasTrabalhadas);

  totalPositiva += j.horaExtraMinutos || 0;
  totalNegativa += j.horaDevendoMinutos || 0;
});

  // Formata minutos em string legível
  function formatarTempo(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
  }

  // Mostra totais
  doc.setFontSize(10);
  doc.text(`Total Trabalhado: ${formatarTempo(totalTrabalhadas)}`, 55, 20);
  doc.text(`Total Extra: +${formatarTempo(totalPositiva)}`, 115, 20);
  doc.text(`Total Devendo: -${formatarTempo(totalNegativa)}`, 155, 20);

  // Monta tabela
  const tabela = jornadas.map(j => {
    const [ano, mes, dia] = j.data.split("-").map(Number);
    const dataObj = new Date(ano, mes - 1, dia);
    const dataCorreta = dataObj.toLocaleDateString("pt-BR");
    const diaSemana = dataObj.toLocaleDateString("pt-BR", { weekday: "long" });

    return [
      diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1),
      dataCorreta,
      j.horarios[0] || "",
      j.horarios[1] || "",
      j.horarios[2] || "",
      j.horarios[3] || "",
      j.horasTrabalhadas || "",
      j.horaExtra || "",
      j.horaDevendo || ""
    ];
  });

  doc.autoTable({
    startY: 24,
    head: [["Dia da Semana","Data", "Entrada", "Saída Almoço", "Retorno", "Saída Final", "Horas Trabalhadas", "Hora Extra", "Hora Devendo"]],
    body: tabela,
    theme: "grid",
    styles: {
      halign: "center",
      valign: "middle",
      lineColor: [0, 0, 0],
      lineWidth: 0.3
    },
    headStyles: {
      fillColor: [0, 102, 204],
      textColor: [255, 255, 255],
      lineColor: [0, 0, 0],
      lineWidth: 0.3
    },
    bodyStyles: {
      lineColor: [0, 0, 0],
      lineWidth: 0.3
    }
  });

  // Salva PDF
  doc.save("jornadas.pdf");
}



document.getElementById("exportarPdf").addEventListener("click", exportarParaPdf);