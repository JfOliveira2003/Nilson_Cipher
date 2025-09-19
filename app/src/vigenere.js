export default function vigenere(texto, senha, decifrar = false) {
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
    resultado += alfabeto[novoIdx];
  }

  return resultado;
}
