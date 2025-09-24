  const form = document.getElementById("form");
  const tabela = document.querySelector("#tabela tbody");
  const dataInput = document.getElementById("data");
  const horarioInput = document.getElementById("horario");
  const cargaInput = document.getElementById("cargaHoraria");
  const totalGeralEl = document.getElementById("totalGeral");

  let totalExtras = 0;
  let registros = JSON.parse(localStorage.getItem("registros")) || [];

  // Preenche a data de hoje automaticamente
  const hoje = new Date();
  dataInput.value = hoje.toISOString().split("T")[0];

  // Carregar registros salvos
  window.addEventListener("DOMContentLoaded", () => {
    registros.forEach(r => montarLinha(r.data, r.horarios));
    atualizarTotal();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = dataInput.value;
    const horario = horarioInput.value;

    if (!data || !horario) return;

    // Busca ou cria registro
    let registro = registros.find(r => r.data === data);
    if (!registro) {
      registro = { data, horarios: [] };
      registros.push(registro);
    }

    if (registro.horarios.length >= 4) {
      alert("Já foram registrados 4 horários para esta data!");
      return;
    }

    registro.horarios.push(horario);

    salvarRegistros();
    montarTabela();
    horarioInput.value = "";
  });

  function montarTabela() {
    tabela.innerHTML = "";
    totalExtras = 0;

    registros.forEach(r => {
      montarLinha(r.data, r.horarios);
    });

    atualizarTotal();
  }

  function montarLinha(data, horarios) {
    const [ano, mes, dia] = data.split("-").map(Number);
    const dataCerta = new Date(ano, mes - 1, dia);
    const diaSemana = dataCerta.toLocaleDateString("pt-BR", { weekday: "long" });
    const dataFormatada = dataCerta.toLocaleDateString("pt-BR");

    const linha = document.createElement("tr");
    linha.dataset.data = data;
    linha.innerHTML = `
      <td>${diaSemana}</td>
      <td>${dataFormatada}</td>
      <td class="entrada">${horarios[0] || ""}</td>
      <td class="saida-almoco">${horarios[1] || ""}</td>
      <td class="retorno">${horarios[2] || ""}</td>
      <td class="saida-final">${horarios[3] || ""}</td>
      <td class="horas-trabalhadas"></td>
      <td class="hora-extra"></td>
    `;
    tabela.appendChild(linha);

    calcularHoras(linha, horarios);
  }

  function calcularHoras(linha, horarios) {
    const entrada = horarios[0];
    const saidaAlmoco = horarios[1];
    const retorno = horarios[2];
    const saidaFinal = horarios[3];

    if (entrada && retorno && saidaFinal) {
      let totalMin = 0;

      if (entrada && saidaAlmoco) {
        totalMin += diffMinutos(entrada, saidaAlmoco);
      }

      if (retorno && saidaFinal) {
        totalMin += diffMinutos(retorno, saidaFinal);
      }

      const horas = Math.floor(totalMin / 60);
      const minutos = totalMin % 60;
      linha.querySelector(".horas-trabalhadas").textContent = `${horas}h ${minutos}m`;

      if (cargaInput.value) {
        const carga = Number(cargaInput.value) * 60;
        const extraMin = totalMin - carga;
        let extraTexto = "0h";

        if (extraMin > 0) {
          const h = Math.floor(extraMin / 60);
          const m = extraMin % 60;
          extraTexto = `${h}h ${m}m`;
          totalExtras += extraMin;
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
    const h = Math.floor(totalExtras / 60);
    const m = totalExtras % 60;
    totalGeralEl.textContent = `Total de Horas Extras: ${h}h ${m}m`;
  }

  function salvarRegistros() {
    localStorage.setItem("registros", JSON.stringify(registros));
  }