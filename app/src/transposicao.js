export default function transposicao(texto, senha, decifrar = false) {
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
