const texto = 'o nilsinho vai passar todo mundo'.toUpperCase();
const senha = 'bolo'.toUpperCase().split( '' ).sort().join( '' );
const carcaterDePreenchimento = '*';


function transpor( texto , senha ){
    const tamanhoTexto = texto.length;
    const tamanhoSenha = senha.length;
    const linhas = tamanhoTexto / tamanhoSenha;
    const resto = tamanhoSenha - tamanhoTexto % tamanhoSenha;
    console.log( resto )


    if ( resto !== 0 )
        texto += carcaterDePreenchimento.repeat( resto );


    const pedacos = [];
    for ( let i = 0; i < linhas; i++ )
        pedacos.push( texto.slice( i * tamanhoSenha, i * tamanhoSenha + tamanhoSenha ) )


    console.log( 'pedaços', pedacos )


    const m = [ senha.split( '' ) ];
    console.log( 'm inicial', m )


    for ( let i = 1; i < linhas; i++ ) {
        m.push( pedacos[ i ].split( '' ) );
    }


    console.log( 'm preenchida', m );


    const transposta = [];


    for ( let i = 0; i < linhas; i++ ) {
        transposta.push( [] )
        for ( let j = 0; j < tamanhoSenha; j++ )
            transposta[ i ].push( m[ i ][ j ] );
    }


    console.log( 'transposta', transposta )


    let textoTransposto = '';
    for ( let linha of transposta ) {
        linha.shift();
        textoTransposto += linha.join( '' );
    }


    console.log( textoTransposto )
}


transpor( texto, senha );


 