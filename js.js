const form = document.getElementById("form");
  const tabela = document.querySelector("#tabela tbody");
  const dataInput = document.getElementById("data");
  const horarioInput = document.getElementById("horario");
  const cargaInput = document.getElementById("cargaHoraria");
  const totalGeralEl = document.getElementById("totalExtra");

  let totalExtras = 0;
  let jornadaDiarias = JSON.parse(localStorage.getItem("jornadaDiarias")) || [];
  let cargaHorarias = JSON.parse(localStorage.getItem("cargaHorarias")) || [];

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
    totalExtras = 0;

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

      const ultimaCargaSalva = localStorage.getItem("ultimaCargaSalva");
      if (cargaInput.value || ultimaCargaSalva) {
        const carga = (ultimaCargaSalva || cargaInput.value)
          ? parseInt(ultimaCargaSalva || cargaInput.value) * 60
          : 0;

        const extraMin = totalMin - carga;
        let extraTexto = "0h";

        if (extraMin !== 0) {
          const h = Math.floor(Math.abs(extraMin) / 60);
          const m = Math.abs(extraMin) % 60;
          extraTexto = `${extraMin < 0 ? "-" : "+"}${h}h ${m}m`;

          if (extraMin > 0) {
            totalExtras += extraMin; // só soma positivos ao total
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
    const h = Math.floor(totalExtras / 60);
    const m = totalExtras % 60;
    totalGeralEl.textContent = `Total de Horas Extras: ${h}h ${m}m`;
  }

  function salvarJornadaDiarias() {
    localStorage.setItem("jornadaDiarias", JSON.stringify(jornadaDiarias));
  }