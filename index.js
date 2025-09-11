function transposicao(texto, senha) {
  const numColunas = senha.length;
  const numLinhas = Math.ceil(texto.length / numColunas);
  const totalCaracteres = numLinhas * numColunas;

  texto = texto.padEnd(totalCaracteres, "*");

  const matriz = [];
  for (let i = 0; i < numLinhas; i++) {
    matriz.push(texto.substr(i * numColunas, numColunas).split(""));
  }

  const ordemColunas = [];
  const senhaOrdenada = senha
    .split("")
    .map((char, i) => [char, i])
    .sort();
  senhaOrdenada.forEach(([_, i]) => ordemColunas.push(i));

  let resultado = "";
  for (let col of ordemColunas) {
    for (let i = 0; i < numLinhas; i++) {
      resultado += matriz[i][col];
    }
  }

  return resultado;
}

function vigenere(texto, senha, decifrar = false) {
  const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ-*";
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
    resultado += alfabeto[novoIdx];
  }

  return resultado;
}

function cifrar(texto, senha) {
  return vigenere(transposicao(texto, senha), senha);
}

function decifrar(texto, senha) {
  // return transposicao(vigenere(texto, senha, true), senha, true);
}

const texto = "o nilsinho vai passar todo mundo"
  .toUpperCase()
  .replace(/\s/g, "-");
const senha = "intervalo".toUpperCase();

const test = cifrar(texto, senha);
console.log(test);
console.log(vigenere(test, senha, true));
