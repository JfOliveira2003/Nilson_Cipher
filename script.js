const isLocalEnv =
  window.location.protocol === "file:" ||
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const backendBase = isLocalEnv
  ? "http://localhost:3000"
  : window.location.origin;
const backendUrl = `${backendBase}/app`;
const algorithm = "des-ede-cbc"; // deve ser o mesmo do backend
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
// Permitidos no algoritmo: letras A-Z e a-z, dígitos 0-9, espaço, barra invertida \\ e asterisco * (este último usado como padding interno),
// além dos caracteres do Base64: +, / e = (para suportar colar o texto cifrado).
// Qualquer letra com acento ou caractere especial fora desse conjunto deverá disparar um aviso.
// Regex para encontrar caracteres não permitidos (captura primeiro caractere inválido para mensagem):
const REGEX_NAO_PERMITIDO = /[^A-Za-z0-9 \+\/=\\\*]/u; // inclui tudo fora do set básico + Base64 (+,/ ,=)
// Regex específica para detectar letras acentuadas (intervalos Unicode comuns em PT-BR):
const REGEX_ACENTO = /[\u00C0-\u00FF]/u;

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
      `Caractere inválido detectado: "${parteProblema}". Use apenas letras sem acento, números, espaço, +, /, = e \\ (barra invertida).`
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

async function criptografar() {
  try {
    const valores = receberValores();
    if (!valores) return;
    clearError();
    const { texto, senha } = valores;
    const textoEncriptado = await fetch(`${backendUrl}/encrypt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: texto,
        password: senha,
        algorithm: algorithm,
      }),
    }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      return data;
    });
    exibirResultado("Texto encriptado", textoEncriptado.encrypted || "");
  } catch (err) {
    showError(
      `Erro ao criptografar: ${err instanceof Error ? err.message : err}`
    );
  }
}

async function decifrar() {
  try {
    const valores = receberValores();
    if (!valores) return;
    clearError();
    const { texto, senha } = valores;
    const resposta = await fetch(`${backendUrl}/decrypt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: texto, // deve ser o base64 retornado pela criptografia
        password: senha,
        algorithm: algorithm,
      }),
    }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      return data;
    });
    exibirResultado("Texto decriptado", resposta.decrypted || "");
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
