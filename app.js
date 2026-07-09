const produtos = [];
let editandoIndex = null;

const botaoAdicionar = document.getElementById("addProduto");
const botaoGerarWord = document.getElementById("gerarWord");
const botaoGerarPDF = document.getElementById("gerarPDF");
const selectQuantidadePagamentos = document.getElementById("quantidadePagamentos");

// =======================
// MÁSCARA CEP
// =======================
document.getElementById("clienteCEP").addEventListener("input", function (e) {
  let v = e.target.value.replace(/\D/g, "").slice(0, 8);
  if (v.length > 5) v = v.slice(0, 5) + "-" + v.slice(5);
  e.target.value = v;
});

// =======================
// FORMATAÇÃO MOEDA INPUT
// =======================
function formatarCampoMoedaInput(input) {
  let valor = input.value.replace(/\D/g, "");

  if (!valor) {
    input.value = "";
    return;
  }

  valor = (Number(valor) / 100).toFixed(2);

  input.value = Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

// =======================
// NOME DE ARQUIVO
// =======================
function sanitizarNomeArquivo(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function obterMesAnoArquivo() {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const ano = String(agora.getFullYear());
  return `${mes}${ano}`;
}

function montarNomeArquivo(extensao) {
  const nomeCliente = document.getElementById("clienteNome").value.trim() || "SemNome";
  const nomeLimpo = sanitizarNomeArquivo(nomeCliente);
  const mesAno = obterMesAnoArquivo();
  return `Orcamento_${nomeLimpo}_${mesAno}.${extensao}`;
}

// =======================
// EVENTOS INPUT PRODUTO
// =======================
document.getElementById("produtoValor").addEventListener("input", function (e) {
  formatarCampoMoedaInput(e.target);
  atualizarValorFinalProduto();
});

document.getElementById("produtoVista").addEventListener("input", function (e) {
  formatarCampoMoedaInput(e.target);
});

document.getElementById("produtoDesconto").addEventListener("input", atualizarValorFinalProduto);
document.getElementById("produtoQtd").addEventListener("input", atualizarValorFinalProduto);

// =======================
// ADICIONAR PRODUTO
// =======================
botaoAdicionar.addEventListener("click", function () {
  const nome = document.getElementById("produtoNome").value.trim();
  const valor = document.getElementById("produtoValor").value.trim();
  const qtd = document.getElementById("produtoQtd").value.trim();
  const desconto = document.getElementById("produtoDesconto").value.trim();
  let final = document.getElementById("produtoVista").value.trim();
  const obs = document.getElementById("produtoObs").value.trim();
  const prazo = document.getElementById("produtoPrazo").value.trim();

  if (!nome) {
    alert("Preencha o nome do produto.");
    return;
  }

  if (!final) {
    final = calcularValorFinal(valor, desconto, qtd);
  }

  if (editandoIndex !== null) {
    // Salvar edição
    produtos[editandoIndex] = { nome, valor, qtd, desconto, final, obs, prazo };
    cancelarEdicao();
  } else {
    // Novo produto
    produtos.push({ nome, valor, qtd, desconto, final, obs, prazo });
    limparCamposProduto();
  }

  renderTabela();
  atualizarResumosPagamentos();
});

// =======================
// LIMPAR CAMPOS PRODUTO
// =======================
function limparCamposProduto() {
  document.getElementById("produtoNome").value = "";
  document.getElementById("produtoValor").value = "";
  document.getElementById("produtoQtd").value = "1";
  document.getElementById("produtoDesconto").value = "";
  document.getElementById("produtoVista").value = "";
  document.getElementById("produtoObs").value = "";
  document.getElementById("produtoPrazo").value = "";
}

// =======================
// RENDER TABELA
// =======================
function renderTabela() {
  const tbody = document.querySelector("#tabelaProdutos tbody");
  tbody.innerHTML = "";

  produtos.forEach(function (produto, index) {
    const descontoExibir = produto.desconto && produto.desconto.trim() !== "" ? produto.desconto : "";
    const total = produtos.length;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${produto.nome}</td>
      <td>${produto.valor}</td>
      <td>${produto.qtd}</td>
      <td>${descontoExibir}</td>
      <td>${produto.final}</td>
      <td>${produto.obs}</td>
      <td>${produto.prazo || ""}</td>
      <td class="td-acoes">
        <button type="button" class="btn-mover" onclick="moverProduto(${index}, -1)" ${index === 0 ? "disabled" : ""} title="Mover para cima">▲</button>
        <button type="button" class="btn-mover" onclick="moverProduto(${index}, 1)" ${index === total - 1 ? "disabled" : ""} title="Mover para baixo">▼</button>
        <button type="button" class="btn-editar" onclick="editarProduto(${index})">Editar</button>
        <button type="button" class="btn-remover" onclick="removerProduto(${index})">Remover</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.moverProduto = function (index, direcao) {
  const novoIndex = index + direcao;
  if (novoIndex < 0 || novoIndex >= produtos.length) return;
  const temp = produtos[index];
  produtos[index] = produtos[novoIndex];
  produtos[novoIndex] = temp;
  renderTabela();
};

window.editarProduto = function (index) {
  const p = produtos[index];
  document.getElementById("produtoNome").value = p.nome || "";
  document.getElementById("produtoValor").value = p.valor || "";
  document.getElementById("produtoQtd").value = p.qtd || "1";
  document.getElementById("produtoDesconto").value = p.desconto || "";
  document.getElementById("produtoVista").value = p.final || "";
  document.getElementById("produtoObs").value = p.obs || "";
  document.getElementById("produtoPrazo").value = p.prazo || "";

  // Marca qual está sendo editado
  editandoIndex = index;
  document.getElementById("addProduto").textContent = "Salvar alterações";
  document.getElementById("addProduto").classList.add("btn-salvando");

  // Destaca a linha sendo editada
  const rows = document.querySelectorAll("#tabelaProdutos tbody tr");
  rows.forEach(function(r, i) {
    r.classList.toggle("linha-editando", i === index);
  });

  document.getElementById("produtoNome").focus();
  document.getElementById("produtoNome").scrollIntoView({ behavior: "smooth", block: "center" });
};

window.removerProduto = function (index) {
  produtos.splice(index, 1);
  // Se estava editando esse item, cancela
  if (editandoIndex === index) cancelarEdicao();
  renderTabela();
  atualizarResumosPagamentos();
};

function cancelarEdicao() {
  editandoIndex = null;
  document.getElementById("addProduto").textContent = "Adicionar produto";
  document.getElementById("addProduto").classList.remove("btn-salvando");
  limparCamposProduto();
}

// =======================
// UTILIDADES
// =======================
function parseMoeda(valor) {
  if (!valor) return 0;

  return Number(
    String(valor)
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "")
  ) || 0;
}

function parsePercentual(valor) {
  if (!valor) return 0;

  return Number(
    String(valor)
      .replace("%", "")
      .replace(",", ".")
      .trim()
  ) || 0;
}

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function calcularValorFinal(valorUnitarioTexto, descontoTexto, qtd) {
  const valorUnitario = parseMoeda(valorUnitarioTexto);
  const desconto = parsePercentual(descontoTexto);
  const quantidade = Number(qtd) || 1;

  const final = valorUnitario * quantidade * (1 - desconto / 100);

  return valorUnitario ? formatarMoeda(final) : "";
}

function atualizarValorFinalProduto() {
  const valor = document.getElementById("produtoValor").value.trim();
  const desconto = document.getElementById("produtoDesconto").value.trim();
  const qtd = document.getElementById("produtoQtd").value.trim();

  document.getElementById("produtoVista").value =
    valor ? calcularValorFinal(valor, desconto, qtd) : "";
}

function formatarDataExtenso(data) {
  const meses = [
    "janeiro","fevereiro","março","abril","maio","junho",
    "julho","agosto","setembro","outubro","novembro","dezembro"
  ];

  return `${data.getDate()} de ${meses[data.getMonth()]} de ${data.getFullYear()}`;
}

// =======================
// PAGAMENTOS
// =======================
selectQuantidadePagamentos.addEventListener("change", atualizarVisibilidadePagamentos);

[
  "pag1Titulo", "pag1EntradaPercentual", "pag1NumeroParcelas", "pag1DescontoAdicional",
  "pag2Titulo", "pag2EntradaPercentual", "pag2NumeroParcelas", "pag2DescontoAdicional",
  "pag3Titulo", "pag3EntradaPercentual", "pag3NumeroParcelas", "pag3DescontoAdicional"
].forEach(function (id) {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener("input", atualizarResumosPagamentos);
    el.addEventListener("change", atualizarResumosPagamentos);
  }
});

// =======================
// TAXA CARTÃO
// =======================
window.atualizarTaxaCartao = function(numero, parte) {
  const selectId = `pag${numero}${parte}Forma`;
  const wrapId = `pag${numero}${parte}TaxaWrap`;
  const select = document.getElementById(selectId);
  const wrap = document.getElementById(wrapId);
  if (!select || !wrap) return;
  const isCartao = select.value === "Cartão de Crédito" || select.value === "Cartão de Débito";
  wrap.style.display = isCartao ? "flex" : "none";
  atualizarResumosPagamentos();
};

// =======================
// PRESET POR TIPO DE PAGAMENTO
// =======================
window.aplicarPresetPagamento = function(numero) {
  const tipoEl = document.getElementById(`pag${numero}Titulo`);
  if (!tipoEl) return;
  const tipo = tipoEl.value;

  const entradaPctEl = document.getElementById(`pag${numero}EntradaPercentual`);
  const entradaFormaEl = document.getElementById(`pag${numero}EntradaForma`);
  const restanteFormaEl = document.getElementById(`pag${numero}RestanteForma`);
  const parcelasEl = document.getElementById(`pag${numero}NumeroParcelas`);

  const descontoEl = document.getElementById(`pag${numero}DescontoAdicional`);

  if (tipo === "À Vista") {
    if (descontoEl) descontoEl.value = 10;
    if (entradaPctEl) entradaPctEl.value = 100;
    if (entradaFormaEl) entradaFormaEl.value = "PIX";
    if (parcelasEl) parcelasEl.value = 0;
  } else if (tipo === "Entrada + Boleto") {
    if (descontoEl) descontoEl.value = 0;
    if (entradaPctEl) entradaPctEl.value = 30;
    if (entradaFormaEl) entradaFormaEl.value = "PIX";
    if (restanteFormaEl) restanteFormaEl.value = "Boleto";
    if (parcelasEl) parcelasEl.value = 4;
  } else if (tipo === "Entrada + Cartão de Crédito") {
    if (descontoEl) descontoEl.value = 0;
    if (entradaPctEl) entradaPctEl.value = 30;
    if (entradaFormaEl) entradaFormaEl.value = "PIX";
    if (restanteFormaEl) restanteFormaEl.value = "Cartão de Crédito";
    if (parcelasEl) parcelasEl.value = 6;
  } else if (tipo === "Boletos") {
    if (descontoEl) descontoEl.value = 0;
    if (entradaPctEl) entradaPctEl.value = 0;
    if (entradaFormaEl) entradaFormaEl.value = "Boleto";
    if (restanteFormaEl) restanteFormaEl.value = "Boleto";
    if (parcelasEl) parcelasEl.value = 6;
  } else if (tipo === "Cartão de Crédito") {
    if (descontoEl) descontoEl.value = 0;
    if (entradaPctEl) entradaPctEl.value = 100;
    if (entradaFormaEl) entradaFormaEl.value = "Cartão de Crédito";
    if (parcelasEl) parcelasEl.value = 0;
  }

  // Atualiza visibilidade das taxas de cartão
  atualizarTaxaCartao(numero, "Entrada");
  atualizarTaxaCartao(numero, "Restante");
  atualizarResumosPagamentos();
};

function atualizarVisibilidadePagamentos() {
  const q = Number(selectQuantidadePagamentos.value);

  document.getElementById("pagamento1").style.display = q >= 1 ? "block" : "none";
  document.getElementById("pagamento2").style.display = q >= 2 ? "block" : "none";
  document.getElementById("pagamento3").style.display = q >= 3 ? "block" : "none";

  atualizarResumosPagamentos();
}

function calcularTotalProdutos() {
  return produtos.reduce(function (soma, produto) {
    return soma + parseMoeda(produto.final);
  }, 0);
}

function getTaxaCartao(numero, parte) {
  const selectEl = document.getElementById(`pag${numero}${parte}Forma`);
  if (!selectEl) return 0;
  const forma = selectEl.value;
  if (forma === "Cartão de Crédito" || forma === "Cartão de Débito") {
    const taxaEl = document.getElementById(`pag${numero}${parte}Taxa`);
    return taxaEl ? Number(taxaEl.value || 0) : 0;
  }
  return 0;
}

function montarPagamento(numero) {
  const titulo = document.getElementById(`pag${numero}Titulo`).value.trim();
  const entradaPct = Number(document.getElementById(`pag${numero}EntradaPercentual`).value || 0);
  const parcelasRestante = Number(document.getElementById(`pag${numero}NumeroParcelas`).value || 0);
  const descontoAdicionalPct = Number(document.getElementById(`pag${numero}DescontoAdicional`).value || 0);

  const entradaFormaEl = document.getElementById(`pag${numero}EntradaForma`);
  const restanteFormaEl = document.getElementById(`pag${numero}RestanteForma`);
  const entradaForma = entradaFormaEl ? entradaFormaEl.value : "";
  const restanteForma = restanteFormaEl ? restanteFormaEl.value : "";

  const taxaEntrada = getTaxaCartao(numero, "Entrada");
  const taxaRestante = getTaxaCartao(numero, "Restante");

  const totalBase = calcularTotalProdutos();
  const valorDescontoAdicional = totalBase * (descontoAdicionalPct / 100);
  const totalComDesconto = totalBase - valorDescontoAdicional;

  const entradaBruta = totalComDesconto * (entradaPct / 100);

  // Entrada: taxa do cartão incide sobre o valor de entrada (se forma for cartão)
  const entradaComTaxa = entradaBruta * (1 + taxaEntrada / 100);

  // Restante: taxa do cartão incide sobre o saldo — aumenta o valor das parcelas
  const saldo = totalComDesconto - entradaBruta;
  const saldoComTaxa = saldo * (1 + taxaRestante / 100);

  // Total final que o cliente paga = entrada (sem taxa se não for cartão) + restante com taxa
  const totalFinal = entradaComTaxa + saldoComTaxa;

  const valorParcelaRestante = parcelasRestante > 0 ? saldoComTaxa / parcelasRestante : 0;

  // Monta texto da entrada
  let entradaTexto = "";
  if (entradaPct > 0) {
    entradaTexto = formatarMoeda(entradaComTaxa);
    if (taxaEntrada > 0) entradaTexto += ` +${taxaEntrada}% taxa`;
  } else {
    entradaTexto = "Sem entrada";
  }

  // Monta texto do restante (sem mencionar forma de pagamento — fica na coluna própria)
  let restanteTexto = "";
  if (entradaPct < 100 && saldo > 0) {
    if (parcelasRestante > 1) {
      restanteTexto = `${parcelasRestante}x de ${formatarMoeda(valorParcelaRestante)}`;
    } else {
      restanteTexto = formatarMoeda(saldoComTaxa);
    }
  } else if (entradaPct >= 100) {
    restanteTexto = "Pago integralmente na entrada";
  } else {
    restanteTexto = "Sem restante";
  }

  return {
    TITULO: titulo,
    DESCONTO_ADICIONAL_PERCENTUAL: `${descontoAdicionalPct}%`,
    DESCONTO_ADICIONAL_VALOR: formatarMoeda(valorDescontoAdicional),
    TOTAL_BASE: formatarMoeda(totalBase),
    TOTAL_COM_DESCONTO: formatarMoeda(totalComDesconto),
    TOTAL_FINAL: formatarMoeda(totalFinal),
    ENTRADA_PERCENTUAL: `${entradaPct}%`,
    ENTRADA_VALOR: formatarMoeda(entradaComTaxa),
    ENTRADA_FORMA: entradaForma,
    ENTRADA_TEXTO: entradaTexto,
    RESTANTE_VALOR: formatarMoeda(saldoComTaxa),
    RESTANTE_FORMA: restanteForma,
    RESTANTE_TEXTO: restanteTexto,
    PARCELAS_TEXTO: restanteTexto
  };
}

function atualizarResumosPagamentos() {
  const q = Number(selectQuantidadePagamentos.value);

  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById(`resumoPag${i}`);
    if (!el) continue;

    if (i > q) {
      el.innerHTML = "";
      continue;
    }

    const pagamento = montarPagamento(i);

    el.innerHTML = `
      <strong>Total base:</strong> ${pagamento.TOTAL_BASE}<br>
      <strong>Desconto adicional:</strong> ${pagamento.DESCONTO_ADICIONAL_VALOR} (${pagamento.DESCONTO_ADICIONAL_PERCENTUAL})<br>
      <strong>Total com desconto:</strong> ${pagamento.TOTAL_COM_DESCONTO}<br>
      ${pagamento.TOTAL_FINAL !== pagamento.TOTAL_COM_DESCONTO ? `<strong>Total com taxa cartão:</strong> ${pagamento.TOTAL_FINAL}<br>` : ""}
      <hr style="border:none;border-top:1px solid #ddd;margin:8px 0;">
      <strong>💰 Entrada (${pagamento.ENTRADA_PERCENTUAL}):</strong> ${pagamento.ENTRADA_TEXTO}<br>
      <strong>📄 Restante:</strong> ${pagamento.RESTANTE_TEXTO}
    `;
  }
}

// =======================
// GERAR WORD
// =======================
botaoGerarWord.addEventListener("click", async function () {
  try {
    const response = await fetch("modelo.docx");

    if (!response.ok) {
      throw new Error("Não encontrou modelo.docx");
    }

    const zip = new PizZip(await response.arrayBuffer());

    const hoje = new Date();

    const itens = produtos.map(function (p) {
      return {
        PRODUTO: p.nome || "",
        VALOR: p.valor || "",
        QTD: p.qtd || "",
        DESC: p.desconto || "",
        FINAL: p.final || "",
        OBS: p.obs || "",
        PRAZO: p.prazo || ""
      };
    });

    const pagamentos = [];
    for (let i = 1; i <= Number(selectQuantidadePagamentos.value); i++) {
      pagamentos.push(montarPagamento(i));
    }

    const dados = {
      DATA_CIDADE: `São Paulo, ${formatarDataExtenso(hoje)}`,
      CLIENTE: document.getElementById("clienteNome").value,
      CONTATO: document.getElementById("clienteContato").value,
      CNPJ: document.getElementById("clienteDoc").value,
      ENDERECO: [
        document.getElementById("clienteRua").value,
        document.getElementById("clienteBairro").value,
        document.getElementById("clienteCEP").value,
        document.getElementById("clienteCidade").value,
        document.getElementById("clienteEstado").value
      ].filter(Boolean).join(", "),
      EMAIL: document.getElementById("clienteEmail").value,
      TELEFONE: document.getElementById("clienteTelefone").value,
      ITENS: itens,
      PAGAMENTOS: pagamentos,
      GARANTIA: document.getElementById("garantia").value,
      FRETE: document.getElementById("frete").value,
      INSTALACAO: document.getElementById("instalacao").value,
      VALIDADE: document.getElementById("validade").value,
      OBSERVACOES_FINAIS: document.getElementById("observacoesFinais").value,
      VENDEDOR: document.getElementById("vendedorNome").value,
      VENDEDOR_TELEFONE: document.getElementById("vendedorTelefone").value
    };

    let doc;
    try {
      doc = new window.docxtemplater(zip, {
        delimiters: { start: "[[", end: "]]" },
        paragraphLoop: true,
        linebreaks: true
      });
      doc.setData(dados);
      doc.render();
    } catch (renderErro) {
      let msg = renderErro.message || String(renderErro);
      if (renderErro.properties && renderErro.properties.errors && renderErro.properties.errors.length) {
        msg = renderErro.properties.errors.map(function(e) {
          return (e.properties && e.properties.explanation) || e.message || String(e);
        }).join("\n");
      }
      console.error("Render error:", renderErro);
      alert("Erro ao renderizar Word:\n" + msg);
      return;
    }

    const docxBase64 = doc.getZip().generate({ type: "base64" });
    downloadArquivo(
      docxBase64,
      montarNomeArquivo("docx"),
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

  } catch (erro) {
    console.error("ERRO COMPLETO:", erro);
    const msg = erro.message || String(erro);
    alert("Erro ao gerar Word:\n" + msg);
  }
});

// =======================
// MONTAR HTML DO PDF
// =======================
function montarHtmlOrcamento() {
  const hoje = new Date();
  const dataCidade = `São Paulo, ${formatarDataExtenso(hoje)}`;

  const clienteNome = document.getElementById("clienteNome").value;
  const clienteContato = document.getElementById("clienteContato").value;
  const clienteDoc = document.getElementById("clienteDoc").value;
  const clienteEndereco = [
    document.getElementById("clienteRua").value,
    document.getElementById("clienteBairro").value,
    document.getElementById("clienteCEP").value,
    document.getElementById("clienteCidade").value,
    document.getElementById("clienteEstado").value
  ].filter(Boolean).join(", ");
  const clienteEmail = document.getElementById("clienteEmail").value;
  const clienteTelefone = document.getElementById("clienteTelefone").value;

  const garantia = document.getElementById("garantia").value;
  const frete = document.getElementById("frete").value;
  const instalacao = document.getElementById("instalacao").value;
  const validade = document.getElementById("validade").value;

  const vendedorNome = document.getElementById("vendedorNome").value;
  const vendedorTelefone = document.getElementById("vendedorTelefone").value;

  const pagamentos = [];
  for (let i = 1; i <= Number(selectQuantidadePagamentos.value); i++) {
    pagamentos.push(montarPagamento(i));
  }

  const itensHtml = produtos.map(function (p) {
    return `
      <tr>
        <td style="border:1px solid #000; padding:6px;">${p.nome || ""}</td>
        <td style="border:1px solid #000; padding:6px;">${p.valor || ""}</td>
        <td style="border:1px solid #000; padding:6px;">${p.qtd || ""}</td>
        <td style="border:1px solid #000; padding:6px;">${p.desconto || ""}</td>
        <td style="border:1px solid #000; padding:6px;">${p.final || ""}</td>
        <td style="border:1px solid #000; padding:6px;">${p.obs || ""}</td>
        <td style="border:1px solid #000; padding:6px;">${p.prazo || ""}</td>
      </tr>
    `;
  }).join("");

  const pagamentosHtml = pagamentos.map(function (p) {
    return `
      <tr>
        <td style="border:1px solid #000; padding:6px;">${p.TITULO}</td>
        <td style="border:1px solid #000; padding:6px;">${p.ENTRADA_PERCENTUAL}</td>
        <td style="border:1px solid #000; padding:6px;">${p.ENTRADA_VALOR}</td>
        <td style="border:1px solid #000; padding:6px;">${p.PARCELAS_TEXTO}</td>
        <td style="border:1px solid #000; padding:6px; font-weight:bold;">${p.TOTAL_FINAL}</td>
      </tr>
    `;
  }).join("");

  return `
    <div style="font-family: Arial, sans-serif; color:#000; font-size:12px; background:#fff; padding:20px; width:760px;">
      <div style="text-align:center; margin-bottom:20px;">
        <img src="logo.png" alt="Sinmag Brasil" style="max-width:220px; height:auto;" onerror="this.style.display='none'" />
        <h1 style="margin:8px 0 0; font-size:20px;">PROPOSTA COMERCIAL</h1>
      </div>

      <p>${dataCidade}</p>

      <div style="background:#d9e6ef; padding:8px; font-weight:bold; margin-top:10px;">Dados do cliente</div>
      <p><strong>Cliente:</strong> ${clienteNome}</p>
      <p><strong>A/C:</strong> ${clienteContato}</p>
      <p><strong>CNPJ/CPF:</strong> ${clienteDoc}</p>
      <p><strong>Endereço:</strong> ${clienteEndereco}</p>
      <p><strong>Email:</strong> ${clienteEmail} &nbsp;&nbsp;&nbsp; <strong>Telefone:</strong> ${clienteTelefone}</p>

      <div style="background:#d9e6ef; padding:8px; font-weight:bold; margin-top:10px;">Proposta Comercial</div>
      <p><strong>Prezados(as) Senhores(as):</strong><br>
      Conforme solicitado, apresentamos nossa proposta comercial para seu projeto.</p>

      <h3 style="margin-bottom:5px;">ITENS DA PROPOSTA</h3>
      <p style="margin-top:0;">Quadro resumo</p>

      <table style="width:100%; border-collapse:collapse; font-size:11px;">
        <thead>
          <tr>
            <th style="border:1px solid #000; padding:6px;">Produto</th>
            <th style="border:1px solid #000; padding:6px;">Valor Unitário</th>
            <th style="border:1px solid #000; padding:6px;">Qtd</th>
            <th style="border:1px solid #000; padding:6px;">Desconto</th>
            <th style="border:1px solid #000; padding:6px;">Valor Final</th>
            <th style="border:1px solid #000; padding:6px;">Obs</th>
            <th style="border:1px solid #000; padding:6px;">Prazo Entrega</th>
          </tr>
        </thead>
        <tbody>
          ${itensHtml}
        </tbody>
      </table>

      <p><em>*Materiais referentes aos produtos serão enviados separadamente*</em></p>
      <p><em>*O prazo informado é aproximado e está sujeito a alterações conforme disponibilidade de estoque, logística e outros fatores*</em></p>
      
      <h3>TERMOS COMERCIAIS</h3>
      <p><strong>Condições de pagamento:</strong></p>

      <table style="width:100%; border-collapse:collapse; font-size:11px;">
        <thead>
          <tr>
            <th style="border:1px solid #000; padding:6px;">Forma de pagamento</th>
            <th style="border:1px solid #000; padding:6px;">Entrada %</th>
            <th style="border:1px solid #000; padding:6px;">Entrada</th>
            <th style="border:1px solid #000; padding:6px;">Parcelamento</th>
            <th style="border:1px solid #000; padding:6px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${pagamentosHtml}
        </tbody>
      </table>

      <p><em>*Os valores para pagamento por meio de boleto bancário estão sujeitos à prévia análise de crédito.*</em></p>

      <p><strong>Garantia:</strong> ${garantia}</p>
      <p><strong>Frete:</strong> ${frete}</p>
      <p><strong>Instalação:</strong> ${instalacao}</p>
      <p><strong>Validade da proposta:</strong> ${validade}</p>

      <br>
      <p>Sem mais, agradecemos a oportunidade de apresentar nossa proposta.</p>
      <p>Atenciosamente,</p>
      <p>${vendedorNome}<br>${vendedorTelefone}</p>
    </div>
  `;
}

// =======================
// GERAR PDF (VERSÃO FINAL)
// =======================
if (botaoGerarPDF) {
  botaoGerarPDF.addEventListener("click", function () {
    if (typeof html2pdf === "undefined") {
      alert("Biblioteca de PDF não carregou. Verifique sua conexão e tente novamente.");
      return;
    }

    if (produtos.length === 0) {
      alert("Adicione pelo menos um produto antes de gerar o PDF.");
      return;
    }

    const preview = document.getElementById("previewPDF");
    const conteudo = document.getElementById("pdfConteudo");
    const overlay = document.getElementById("pdfOverlay");

    conteudo.innerHTML = montarHtmlOrcamento();

    const nomeOriginal = botaoGerarPDF.textContent;
    botaoGerarPDF.textContent = "Gerando...";
    botaoGerarPDF.disabled = true;
    overlay.style.display = "flex";

    const opcoes = {
      margin: 5,
      filename: montarNomeArquivo("pdf"),
      html2canvas: { scale: 2, useCORS: true, scrollX: 0, scrollY: 0 },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait"
      }
    };

    // Pequeno atraso para garantir que o conteúdo (e a logo, se houver) já renderizou
    setTimeout(() => {
      html2pdf()
        .set(opcoes)
        .from(preview)
        .save()
        .catch(function (erro) {
          console.error("Erro ao gerar PDF:", erro);
          alert("Erro ao gerar PDF:\n" + (erro.message || erro));
        })
        .finally(function () {
          botaoGerarPDF.textContent = nomeOriginal;
          botaoGerarPDF.disabled = false;
          overlay.style.display = "none";
          conteudo.innerHTML = "";
        });
    }, 300);
  });
}

// =======================
// DOWNLOAD
// =======================
function isIOS() {
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function base64ParaBlob(base64Data, mimeType) {
  const byteChars = atob(base64Data);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

function downloadArquivo(base64Data, nome, mimeType) {
  if (isIOS()) {
    // iOS (incluindo navegadores embutidos como WhatsApp/Instagram) perde o
    // tipo do arquivo ao abrir um blob: URL em nova aba, e o Safari acaba
    // "adivinhando" pelos bytes que é um .zip. Um Data URI (base64) carrega
    // o tipo junto com os dados, então navegar na MESMA aba resolve.
    const dataUri = `data:${mimeType};base64,${base64Data}`;
    window.location.href = dataUri;
    return;
  }

  // Demais navegadores: Blob + <a download> funciona normalmente
  const blob = base64ParaBlob(base64Data, mimeType);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 1000);
}
atualizarVisibilidadePagamentos();

// Inicializa visibilidade das taxas de cartão
[1, 2, 3].forEach(function(n) {
  atualizarTaxaCartao(n, "Entrada");
  atualizarTaxaCartao(n, "Restante");
});