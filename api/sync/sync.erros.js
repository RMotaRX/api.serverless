'use strict';

let errorList = {
  "ERR_1": "Assunto Inválido",
  "ERR_2": "Código da Escola inválido",
  "ERR_3": "Código do Usuário inválido",
  "ERR_4": "Nome inválido",
  "ERR_5": "email inválido",
  "ERR_6": "Operação inválida",
  "ERR_7": "Erro incluindo perfil",
  "ERR_8": "Erro excluindo perfil",
  "ERR_9": "Operação inválida",
  "ERR_10": "Message id inválido", // vago
  "ERR_11": "Papel inválido",
  "ERR_12": "Erro na leitura do Papel: ",
  "ERR_13": "Papel não cadastrado no HUB",
  "ERR_14": "Perfil já cadastrado no HUB",
  "ERR_15": "Instituicao não cadastrada no HUB",
  "ERR_16": "Erro na leitura da Instituição: ",
  "ERR_17": "Código da Turma inválido",
  "ERR_18": "Nome da Turma inválido",
  "ERR_19": "Erro na leitura da Turma: ",
  "ERR_20": "Turma já cadastrada no HUB",
  "ERR_21": "Erro incluindo Turma: ",
  "ERR_22": "Turma inválida",
  "ERR_23": "Data inicial inválida",
  "ERR_24": "Data final inválida",
  "ERR_25": "Erro na leitura da Turma: ",
  "ERR_26": "Turma não cadastrada no HUB",
  "ERR_27": "Aluno não cadastrado no HUB",
  "ERR_28": "Relação Turma x Aluno já cadastrada no HUB",
  "ERR_29": "Erro incluindo Turma x Aluno: ",
  "ERR_30": "Turma  x Aluno inválida",
  "ERR_31": "Código do Responsável inválido",
  "ERR_32": "Código do Aluno inválido",
  "ERR_33": "Responsável não cadastrado no HUB",
  "ERR_34": "Erro na leitura do Responsável x Aluno: ",
  "ERR_35": "Relação Responsável x Aluno já cadastrada no HUB",
  "ERR_36": "Erro incluindo Responsável x Aluno: ",
  "ERR_37": "REsponsável x Aluno inválido",
  "ERR_38": "Erro incluindo perfil"
};

class LogSequence {
  constructor(){
    this.sequencia = 0;
  };

  getSequencia(){
    this.sequencia++;
    return this.sequencia;
  }
};

class MetaErros {
  constructor(messageId, titulo){
    this.codInstituicao = "Invalido";
    this.titulo = titulo;
    this.messageId = messageId;
    this.status = "OK";
    this.erros = [];
  };

  setErro(codErro, erroAux = ""){
    var erro = {
      codigo: "",
      descricao: ""
    };
  
    erro.codigo = "ERR_" + codErro;
    erro.descricao = errorList[erro.codigo];

    this.status = "erro";
    this.erros.push(erro);
  };

  getErros(){
    var metaErro = {
      status: this.status,
      erros: this.erros
    };

    return metaErro;
  };

  getQtdeErros(){
    return this.erros.length;
  };

  getCodInstituicao(){
    return this.codInstituicao;
  };

  getTitulo(){
    return this.titulo;
  };

  setCodInstituicao(codInstituicao){
    this.codInstituicao = codInstituicao;
  };

  getMessageId(){
    return this.messageId;
  };
};

var metaError1 = {
    Status: "OK",
    erros: []
};

var metaError1a = {
  Status: "OK",
  erros: []
};

var metaError2 = {
  Status: "OK",
  erros: []
};

var metaError3 = {
  Status: "OK",
  erros: []
};

var metaError4 = {
  Status: "OK",
  erros: []
};

function setErro(codErro){
  var erro = {
    codigo: "",
    descricao: ""
  };

  erro.codigo = "ERR_" + codErro;
  erro.descricao = errorList[erro.codigo];

  return erro;
};

function setLog(dscErro){
  var logAtivo = true;

  if (logAtivo){
    console.log(dscErro);
  }
};

module.exports = {setErro, metaError1, metaError2, metaError3, metaError4, metaError1a, setLog, MetaErros, LogSequence};
