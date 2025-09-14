const textoInput = document.querySelector("#texto");
const senhaInput = document.querySelector("#senha");

const criptBtn = document.querySelector("#cript");
const decriptBtn = document.querySelector("#decript");
const errorDiv = document.querySelector("#error");
// Novos elementos de resultado separado
const resultadoContainer = document.querySelector("#resultado");
const resultadoTitulo = document.querySelector("#resultado-titulo");
const resultadoTexto = document.querySelector("#resultado-texto");
const copiarBtn = document.querySelector("#copiar");

criptBtn.addEventListener("click", criptografar);
decriptBtn.addEventListener("click", decifrar);

// Regras de caracteres:
// Permitidos no algoritmo: letras A-Z e a-z, dígitos 0-9, espaço, barra invertida \\ e asterisco * (este último usado como padding interno)
// Qualquer letra com acento (á, ê, õ, ç, ü etc.) ou caractere especial fora desse conjunto deverá disparar um aviso.
// Regex para encontrar caracteres não permitidos (captura primeiro caractere inválido para mensagem):
const REGEX_NAO_PERMITIDO = /[^A-Za-z0-9 \\*]/u; // inclui tudo fora do set básico
// Regex específica para detectar letras acentuadas (intervalos Unicode comuns em PT-BR):
const REGEX_ACENTO = /[\u00C0-\u00FF]/u; // Latin-1 Supplement (inclui ç, ñ, ÿ etc.)

let clearWarningHandler = null;
function showError(msg) {
  if (!errorDiv) return;
  errorDiv.textContent = msg;
  errorDiv.classList.remove("hide");
  errorDiv.classList.add("error");
  if (resultadoContainer) resultadoContainer.hidden = true;
}

function clearError() {
  if (!errorDiv) return;
  errorDiv.textContent = "";
  errorDiv.classList.add("hide");
}

function mostrarWarning(msg) {
  // compat retro
  showError(msg);
  if (clearWarningHandler) {
    textoInput.removeEventListener("input", clearWarningHandler);
    senhaInput.removeEventListener("input", clearWarningHandler);
  }
  clearWarningHandler = () => {
    if (textoInput.value.length > 0 || senhaInput.value.length > 0) {
      clearError();
      textoInput.removeEventListener("input", clearWarningHandler);
      senhaInput.removeEventListener("input", clearWarningHandler);
      clearWarningHandler = null;
    }
  };
  textoInput.addEventListener("input", clearWarningHandler);
  senhaInput.addEventListener("input", clearWarningHandler);
}

function limparWarningSeNecessario() {
  if (!errorDiv || errorDiv.classList.contains("hide")) return;
  if (
    REGEX_NAO_PERMITIDO.test(textoInput.value) ||
    REGEX_NAO_PERMITIDO.test(senhaInput.value)
  )
    return; // ainda há inválidos
  clearError();
}

function validarEntrada(e) {
  const valor = e.target.value;
  // Detecta acento ou caractere não permitido
  const temAcento = REGEX_ACENTO.test(valor);
  const matchNaoPermitido = valor.match(REGEX_NAO_PERMITIDO);
  if (temAcento || matchNaoPermitido) {
    let parteProblema = matchNaoPermitido
      ? matchNaoPermitido[0]
      : valor.match(REGEX_ACENTO)[0];
    mostrarWarning(
      `Caractere inválido detectado: "${parteProblema}". Use apenas letras sem acento, números, espaço e \\ (barra invertida).`
    );
  } else {
    limparWarningSeNecessario();
  }
}

// Listeners para detecção imediata durante digitação
textoInput.addEventListener("input", validarEntrada);
senhaInput.addEventListener("input", validarEntrada);

// Mantém caracteres conforme digitados (uppercase não forçado)

function receberValores() {
  const texto = textoInput.value;
  const senha = senhaInput.value;
  if (!texto || !senha) {
    mostrarWarning("Por favor, preencha todos os campos.");
    return;
  }
  return { texto, senha };
}

function criptografar() {
  try {
    const valores = receberValores();
    if (!valores) return;
    clearError();
    const { texto, senha } = valores;
    const transp = transposicao(texto, senha);
    exibirResultado("Texto encriptado", vigenere(transp, senha));
  } catch (err) {
    showError(
      `Erro ao criptografar: ${err instanceof Error ? err.message : err}`
    );
  }
}

function decifrar() {
  try {
    const valores = receberValores();
    if (!valores) return;
    clearError();
    const { texto, senha } = valores;
    const vig = vigenere(texto, senha, true);
    exibirResultado("Texto decriptado", transposicao(vig, senha, true));
  } catch (err) {
    showError(
      `Erro ao descriptografar: ${err instanceof Error ? err.message : err}`
    );
  }
}

function exibirResultado(titulo, texto) {
  clearError();
  resultadoTitulo.textContent = titulo;
  resultadoTexto.textContent = texto;
  resultadoContainer.hidden = false;
  resultadoContainer.classList.remove("hide");
}

if (copiarBtn) {
  copiarBtn.addEventListener("click", () => {
    const conteudo = resultadoTexto.textContent || "";
    if (!conteudo) return;
    navigator.clipboard.writeText(conteudo).then(() => {
      const txtOriginal = copiarBtn.textContent;
      copiarBtn.textContent = "Copiado!";
      copiarBtn.disabled = true;
      setTimeout(() => {
        copiarBtn.textContent = txtOriginal;
        copiarBtn.disabled = false;
      }, 1800);
    });
  });
}

function transposicao(texto, senha, decifrar = false) {
  const numColunas = senha.length;
  const ordemColunas = senha
    .split("")
    .map((c, i) => [c, i])
    .sort((a, b) => a[0].localeCompare(b[0]) || a[1] - b[1])
    .map(([, i]) => i);

  if (!decifrar) {
    const numLinhas = Math.ceil(texto.length / numColunas);
    texto = texto.padEnd(numLinhas * numColunas, "*");
    const matriz = [];
    for (let i = 0; i < numLinhas; i++)
      matriz.push(texto.substr(i * numColunas, numColunas).split(""));
    let out = "";
    for (let col of ordemColunas)
      for (let r = 0; r < numLinhas; r++) out += matriz[r][col];
    return out;
  } else {
    const numLinhas = Math.ceil(texto.length / numColunas);
    const matriz = Array.from({ length: numLinhas }, () => Array(numColunas));
    let off = 0;
    for (let k = 0; k < ordemColunas.length; k++) {
      const colOriginal = ordemColunas[k];
      const trecho = texto.slice(off, off + numLinhas);
      for (let r = 0; r < numLinhas; r++) matriz[r][colOriginal] = trecho[r];
      off += numLinhas;
    }
    let plano = "";
    for (let r = 0; r < numLinhas; r++) plano += matriz[r].join("");
    return plano.replace(/\*+$/g, "");
  }
}

// function transporDecript(texto, senha) {}

function vigenere(texto, senha, decifrar = false) {
  const alfabeto =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 \\" + "*";
  const n = alfabeto.length;
  let resultado = "";

  for (let i = 0; i < texto.length; i++) {
    const charTexto = texto[i];
    const charSenha = senha[i % senha.length];

    const idxTexto = alfabeto.indexOf(charTexto);
    const idxSenha = alfabeto.indexOf(charSenha);

    let novoIdx;
    if (decifrar) novoIdx = (idxTexto - idxSenha + n) % n;
    else novoIdx = (idxTexto + idxSenha) % n;
    console.log("Novo idx", novoIdx);
    console.log("Novo char", alfabeto[novoIdx]);
    resultado += alfabeto[novoIdx];
  }

  return resultado;
}
