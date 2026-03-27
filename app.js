const produtos = [];

const botaoAdicionar = document.getElementById("addProduto");
const botaoGerarWord = document.getElementById("gerarWord");
const selectQuantidadePagamentos = document.getElementById("quantidadePagamentos");

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
    final = calcularValorFinal(valor, desconto);
  }

  produtos.push({
    nome,
    valor,
    qtd,
    desconto,
    final,
    obs,
    prazo
  });

  limparCamposProduto();
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

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${produto.nome}</td>
      <td>${produto.valor}</td>
      <td>${produto.qtd}</td>
      <td>${descontoExibir}</td>
      <td>${produto.final}</td>
      <td>${produto.obs}</td>
      <td>${produto.prazo || ""}</td>
      <td><button type="button" onclick="removerProduto(${index})">Remover</button></td>
    `;

    tbody.appendChild(tr);
  });
}

window.removerProduto = function (index) {
  produtos.splice(index, 1);
  renderTabela();
  atualizarResumosPagamentos();
};

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

function calcularValorFinal(valorUnitarioTexto, descontoTexto) {
  const valorUnitario = parseMoeda(valorUnitarioTexto);
  const desconto = parsePercentual(descontoTexto);

  const final = valorUnitario * (1 - desconto / 100);

  return valorUnitario ? formatarMoeda(final) : "";
}

function atualizarValorFinalProduto() {
  const valor = document.getElementById("produtoValor").value.trim();
  const desconto = document.getElementById("produtoDesconto").value.trim();

  document.getElementById("produtoVista").value =
    valor ? calcularValorFinal(valor, desconto) : "";
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
  "pag1Titulo", "pag1EntradaPercentual", "pag1NumeroParcelas",
  "pag2Titulo", "pag2EntradaPercentual", "pag2NumeroParcelas",
  "pag3Titulo", "pag3EntradaPercentual", "pag3NumeroParcelas"
].forEach(function (id) {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener("input", atualizarResumosPagamentos);
  }
});

function atualizarVisibilidadePagamentos() {
  const q = Number(selectQuantidadePagamentos.value);

  document.getElementById("pagamento1").style.display = q >= 1 ? "block" : "none";
  document.getElementById("pagamento2").style.display = q >= 2 ? "block" : "none";
  document.getElementById("pagamento3").style.display = q >= 3 ? "block" : "none";

  atualizarResumosPagamentos();
}

function calcularTotalProdutos() {
  return produtos.reduce(function (soma, produto) {
    return soma + (Number(produto.qtd || 0) * parseMoeda(produto.final));
  }, 0);
}

function montarPagamento(numero) {
  const titulo = document.getElementById(`pag${numero}Titulo`).value.trim();
  const entradaPct = Number(document.getElementById(`pag${numero}EntradaPercentual`).value || 0);
  const parcelas = Number(document.getElementById(`pag${numero}NumeroParcelas`).value || 0);

  const total = calcularTotalProdutos();
  const entrada = total * (entradaPct / 100);
  const saldo = total - entrada;
  const valorParcela = parcelas > 0 ? saldo / parcelas : 0;

  return {
    TITULO: titulo,
    ENTRADA_PERCENTUAL: `${entradaPct}%`,
    ENTRADA_VALOR: formatarMoeda(entrada),
    PARCELAS_TEXTO: parcelas > 0 ? `${parcelas}x de ${formatarMoeda(valorParcela)}` : "Sem parcelas",
    TOTAL: formatarMoeda(total)
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
      <strong>Total:</strong> ${pagamento.TOTAL}<br>
      <strong>Entrada:</strong> ${pagamento.ENTRADA_VALOR} (${pagamento.ENTRADA_PERCENTUAL})<br>
      <strong>Parcelas:</strong> ${pagamento.PARCELAS_TEXTO}
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

    const doc = new window.docxtemplater(zip, {
      delimiters: { start: "[[", end: "]]" }
    });

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

    doc.setData({
      DATA_CIDADE: `São Paulo, ${formatarDataExtenso(hoje)}`,
      CLIENTE: document.getElementById("clienteNome").value,
      CONTATO: document.getElementById("clienteContato").value,
      CNPJ: document.getElementById("clienteDoc").value,
      ENDERECO: document.getElementById("clienteEndereco").value,
      EMAIL: document.getElementById("clienteEmail").value,
      TELEFONE: document.getElementById("clienteTelefone").value,

      ITENS: itens,
      PAGAMENTOS: pagamentos,

      GARANTIA: document.getElementById("garantia").value,
      FRETE: document.getElementById("frete").value,
      INSTALACAO: document.getElementById("instalacao").value,
      VALIDADE: document.getElementById("validade").value,

      VENDEDOR: document.getElementById("vendedorNome").value,
      VENDEDOR_TELEFONE: document.getElementById("vendedorTelefone").value
    });

    doc.render();

    const blob = doc.getZip().generate({ type: "blob" });
    saveBlob(blob, montarNomeArquivo("docx"));

  } catch (erro) {
    console.error(erro);
    alert("Erro ao gerar Word");
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
  const clienteEndereco = document.getElementById("clienteEndereco").value;
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
      </tr>
    `;
  }).join("");

  return `
    <div style="font-family: Arial, sans-serif; color:#000; font-size:12px; background:#fff; padding:20px;">
      <div style="text-align:center; margin-bottom:20px;">
        <h1 style="margin:0; font-size:24px;">SINMAG BRASIL</h1>
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

      <h3>TERMOS COMERCIAIS</h3>
      <p><strong>Condições de pagamento:</strong></p>

      <table style="width:100%; border-collapse:collapse; font-size:11px;">
        <thead>
          <tr>
            <th style="border:1px solid #000; padding:6px;">Forma de pagamento</th>
            <th style="border:1px solid #000; padding:6px;">Entrada %</th>
            <th style="border:1px solid #000; padding:6px;">Entrada</th>
            <th style="border:1px solid #000; padding:6px;">Parcelamento</th>
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
      alert("Biblioteca PDF não carregada");
      return;
    }

    const preview = document.getElementById("previewPDF");
    const conteudo = document.getElementById("pdfConteudo");

    conteudo.innerHTML = montarHtmlOrcamento();

    // 🔥 MOSTRA TEMPORARIAMENTE (ESSENCIAL)
    preview.style.display = "block";
    preview.style.position = "relative";
    preview.style.opacity = "1";

    const opcoes = {
      margin: 5,
      filename: montarNomeArquivo("pdf"),
      html2canvas: {
        scale: 2
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait"
      }
    };

    setTimeout(() => {
      html2pdf()
        .set(opcoes)
        .from(preview)
        .save()
        .then(() => {
          preview.style.display = "none";
        });
    }, 500); // 🔥 TEMPO MAIOR = GARANTE RENDER
  });
}

// =======================
// DOWNLOAD
// =======================
function saveBlob(blob, nome) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  a.click();
}

atualizarVisibilidadePagamentos();