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
    `;
    tabela.appendChild(linha);

    calcularHoras(linha, horarios);
  }

function calcularHoras(linha, horarios) {
    const [entrada, saidaAlmoco, retorno, saidaFinal] = horarios;

    if (entrada && retorno && saidaFinal) {
      let totalMin = 0;

      if (entrada && saidaAlmoco) totalMin += diffMinutos(entrada, saidaAlmoco);
      if (retorno && saidaFinal) totalMin += diffMinutos(retorno, saidaFinal);

      const horas = Math.floor(totalMin / 60);
      const minutos = totalMin % 60;
      linha.querySelector(".horas-trabalhadas").textContent = `${horas}h ${minutos}m`;

      const ultimaCargaSalva = localStorage.getItem("ultimaCargaSalva");
      if (cargaInput?.value || ultimaCargaSalva) {
        const carga = parseInt(ultimaCargaSalva || cargaInput.value) * 60
        const extraMin = totalMin - carga;
        let extraTexto = "0h";

        if (extraMin !== 0) {
          const h = Math.floor(Math.abs(extraMin) / 60);
          const m = Math.abs(extraMin) % 60;
          extraTexto = `${extraMin < 0 ? "-" : "+"}${h}h ${m}m`;

          if (extraMin > 0) {
            totalPositiva += extraMin; // só soma positivos ao total
          }
            totalTrabalhadas += totalMin;

          if (extraMin < 0) {
            totalNegativa -= extraMin; // só soma negativos ao total
          }
        }

        linha.querySelector(".hora-extra").textContent = extraTexto;
      }
    }
}

  function diffMinutos(hora1, hora2) {
    const [h1, m1] = hora1.split(":").map(Number);
    const [h2, m2] = hora2.split(":").map(Number);
    return (h2 * 60 + m2) - (h1 * 60 + m1);
  }

  function atualizarTotal() {
    const h = Math.floor(totalPositiva / 60);
    const m = totalPositiva % 60;
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