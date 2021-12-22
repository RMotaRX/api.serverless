'use strict';

/*const mysql = require('serverless-mysql')({
  config: {
    host     : "127.0.0.1",
    database : "hub_schema",
    user     : "root",
    password : "HubSyncDB2019",
    timeout: 60000
  }
 });*/

/*const configMysql = {
  host     : "127.0.0.1",
  database : "hub_schema",
  user     : "root",
  password : "HubSyncDB2019"
};*/

const configMysql = {
  host     : "database-2.c9wtaj6cluaj.us-east-2.rds.amazonaws.com",
  database : "innodb",
  user     : "admin",
  password : "9xhUYSNNXe2DU1Gz8yiG"
};

const { createUser } = require("../../utils/cognito");
const dbMysql = require("../../utils/RdsMysql");
const { queryByPartitionKey, putItem } = require("../../utils/dynamodb");
const config = require('../../config/apihub.conf.json');
var uuid = require('uuid');

const {RawResponse} = require('../../utils/response');

var syncErros = require("../sync/sync.erros");

let logSequencia = new syncErros.LogSequence();

const LOGCONF = config.dbconfig.logTable[process.env.STAGE];

// POST Function - Início do fluxo de processamento de mensagens

module.exports.postSyncEndpointOld = async (event, context) => {
  console.log('event:', event);
  var dataBase = new dbMysql.Database(configMysql);
  console.log('dataBase:', dataBase);

  var retorno = '';

  var qry = 'Select * From papel'
  let results;
  try {
    console.log('Doing query...');
    results = await dataBase.query(qry);
    console.log('Query done!');
  } catch (error) {
    console.error(error);
    retorno = 'Erro lendo a instituicao:' + JSON.stringify(err);
    const response = {
      statusCode: 200,
      body: retorno
    };
    return response
  }

  if (results){
    if (results.length > 0){
      retorno = 'ok ' + JSON.stringify(results);
      const response = {
        statusCode: 200,
        body: retorno
      };
      return response;
    }
    else {
      retorno = 'nenhum registro encontrado';
      const response = {
          statusCode: 200,
          body: retorno
        };
        return response;
    }
  }
};

module.exports.postSyncEndpoint = async (event, context) => {
  // O schema da mensagem já foi validado pela API Gateway(confirmar)
  context.callbackWaitsForEmptyEventLoop = false;
  var requisicao = JSON.parse(event.body);
  requisicao.MessageId = uuid.v4();

  processaPayload(event, context, requisicao);

  const response = {
    statusCode: 200,
    body: JSON.stringify(requisicao.MessageId),
  };
  return response;
  //callback(null, response);
};

async function processaPayload(event, context, Assuntos){
  if (!Assuntos.MessageId){
    syncErros.setLog('MessageId inválido');
  }
  else{
    let metaErros = new syncErros.MetaErros(Assuntos.MessageId, "Principal");
    if (!Assuntos.cod_instituicao){
      metaErros.setErro(2);
      registraLogHeader(metaErros);
    }
    else {
      metaErros.setCodInstituicao(Assuntos.cod_instituicao);
      var dataBase = new dbMysql.Database(configMysql);

      var qry = getQryInstituicao(Assuntos.cod_instituicao);

      dataBase.query(qry)
        .then( results => {
          if (results){
            if (results.length > 0){
              var res = results[0];
              registraLogHeader(metaErros);
              //agoraVai(res.id_instituicao, Assuntos);
            }
            else {
              metaErros.setErro(15);
              registraLogHeader(metaErros);
            };
          };
        })
        .catch(err => {
          metaErros.setErro(15);
          registraLogHeader(metaErros);
        });
    };
  };
};

async function processaPayloadold(Assuntos){
  console.log('processaPayload, início');
  if (Assuntos.MessageId){
    console.log('processaPayload, passo 1');
    let metaErros = new syncErros.MetaErros(Assuntos.MessageId, "Principal");

    if (Assuntos.cod_instituicao){
      console.log('processaPayload, passo 2');
      metaErros.setCodInstituicao(Assuntos.cod_instituicao);
      console.log('processaPayload, passo 3');
      var dataBase = new dbMysql.Database(configMysql);
      console.log('processaPayload, passo 4');
      var qry = getQryInstituicao(Assuntos.cod_instituicao);
      console.log('processaPayload, passo 5');
      let results;
      console.log('processaPayload, passo 6');
      try {
        console.log('processaPayload, passo 7');
        results = await dataBase.query(qry);
        console.log('processaPayload, passo 8');
      }
      catch (error) {
        console.log('processaPayload, Erro lendo a instituicao: ' + error);
        metaErros.setErro(15);
        console.log('processaPayload, passo 9');
        registraLogHeader(metaErros);
        console.log('processaPayload, passo 10');
        return
      };
      console.log('processaPayload, passo 11');
      if (results){
        console.log('processaPayload, passo 12');
        if (results.length > 0){
          console.log('processaPayload, passo 13');
          var res = results[0];
          console.log('processaPayload, passo 14');
          registraLogHeader(metaErros);
          console.log('processaPayload, passo 15');
          //agoraVai(res.id_instituicao, Assuntos);
        }
        else {
          console.log('processaPayload, passo 16');
          metaErros.setErro(15);
          console.log('processaPayload, passo 17');
          registraLogHeader(metaErros);
          console.log('processaPayload, passo 18');
        };
      }
      else {
        console.log('processaPayload, passo 19');
      };
    }
    else {
      console.log('processaPayload, passo 20');
      metaErros.setErro(2);
      console.log('processaPayload, passo 21');
      registraLogHeader(metaErros);
      console.log('processaPayload, passo 22');
    };
  }
  else {
    console.log('processaPayload, MessageId inválido');
  };
};

async function agoraVai(idInstituicao, Requisicao){
  let usuario = [];
  let turma = [];
  let turmaAluno = [];
  let responsavelAluno = [];

  var header = {
    cod_instituicao: Requisicao.cod_instituicao,
    MessageId: Requisicao.MessageId,
    idInstituicao: idInstituicao,
  };

  if (Requisicao.dat.usuario){
    usuario = Requisicao.dat.usuario;
  };
  if (Requisicao.dat.turma){
    turma = Requisicao.dat.turma;
  };
  if (Requisicao.dat.turmaAluno){
    turmaAluno = Requisicao.dat.turmaAluno;
  };
  if (Requisicao.dat.responsavelAluno){
    responsavelAluno = Requisicao.dat.responsavelAluno;
  };

  const promiseUsuario = processaPerfil(header,usuario);
  const promiseTurma =  processaTurma(header,turma);


  await promiseUsuario;
  processaResponsavelAluno(header,responsavelAluno);
};

function registraLogHeader(MetaErros) {
  var meta = {
    metaErros: MetaErros.getErros()
  };

  meta.titulo = MetaErros.getTitulo();

  meta.cod_instituicao = MetaErros.getCodInstituicao();

  let sequencia = logSequencia.getSequencia();

  var msgId = MetaErros.getMessageId();

  putItem(msgId, sequencia, LOGCONF, meta)
  .catch(function(err) {
    syncErros.setLog("registraLogHeader, Passo 1", err);});
};

function registraLogItem(MetaErros) {
  var meta = {
    metaErros: MetaErros.getErros()
  };

  meta.titulo = MetaErros.getTitulo();

  let sequencia = logSequencia.getSequencia();

  putItem(MetaErros.getMessageId(), sequencia, LOGCONF, meta)
  .catch(function(err) {
    syncErros.setLog("consumeLogQueue, Passo 6", err);});
};

async function processaPerfil(header, pack){
  await pack.reduce(async (promise, objeto) => {
    await promise;
    let metaErros = new syncErros.MetaErros(header.MessageId, "Perfil", header.cod_instituicao);

    if (objeto.oper == 'insert'){
      if (!objeto.obj.cod_usuario){
        metaErros.setErro(3);
      };

      if (!objeto.obj.nom_usuario){
        metaErros.setErro(4);
      };

      if (!objeto.obj.cod_papel){
        metaErros.setErro(11);
      };

      if (metaErros.getQtdeErros() > 0){
        registraLogItem(metaErros);
      }
      else{
        let paramPerfil = {
          idInstituicao: header.idInstituicao,
          cod_instituicao: header.cod_instituicao,
          MessageId: header.MessageId,
          objeto: objeto.obj
        };

        await sqlInsertPerfil(paramPerfil);
      };
    }
    else {
      metaErros.setErro(6);
      registraLogItem(metaErros);
    };
  }, Promise.resolve());
};

async function sqlInsertPerfil(Param){
  let metaErros = new syncErros.MetaErros(Param.MessageId, "Perfil", Param.cod_instituicao);

  var dataBase = new dbMysql.Database(configMysql);

  var qry = getQryPerfil(Param.idInstituicao, Param.objeto.cod_papel, Param.objeto.cod_usuario);

  dataBase.query(qry)
  .then( results => {
    if (results){
      if (results.length > 0){
        var res = results[0];

        if (!res.ExistePapel){
          metaErros.setErro(13);
        }
        else if (res.ExistePerfil){
          metaErros.setErro(14);
        };

        if (metaErros.erros.length > 0){
          registraLogItem(metaErros);
        }
        else {
          let uuidPerfil = uuid.v4();
          let chaveNegocio = Param.cod_instituicao + Param.objeto.cod_papel + Param.objeto.cod_usuario;

          qry = 'Insert Into perfil (cod_hash, nom_usuario, cod_perfil, email_usuario, id_instituicao, id_papel) Values ("' +
                  chaveNegocio + '","' +
                  Param.objeto.nom_usuario + '","' +
                  Param.objeto.cod_usuario + '","' +
                  Param.objeto.email_usuario + '",' +
                  Param.idInstituicao + ',' +
                  res.id_papel + ');';

          dataBase.query(qry)
          .then( results => {
            registraLogItem(metaErros);

            qry = 'Insert Into conta (cod_uuid, cod_negocio) Values ("' +
            uuidPerfil + '","' +
            chaveNegocio + '"); ';

            dataBase.query(qry)
            .then( results => {
              createUser(uuidPerfil)
              .catch(function(err) {
                syncErros.setLog("sqlInsertPerfil, Passo 1", err);});
                          registraLogItem(metaErros);
            })
            .catch(err => {
              metaErros.setErro(38);
              registraLogItem(metaErros);
            });
            })
          .catch(err => {
            metaErros.setErro(7);
            registraLogItem(metaErros);
          });
        };
      }
      else {
        metaErros.setErro(11);
        registraLogItem(metaErros);
      };
    };
  })
  .catch(err => {
    metaErros.setErro(12);
    registraLogItem(metaErros);
  });
};

async function processaTurma(header, pack){
  await pack.reduce(async (promise, objeto) => {
    await promise;

    let metaErros = new syncErros.MetaErros(header.MessageId, "Turma", header.cod_instituicao);

    if (objeto.oper == 'insert'){
      if (!objeto.obj.cod_turma){
        metaErros.setErro(17);
      };

      if (!objeto.obj.nom_turma){
        metaErros.setErro(18);
      };

      if (metaErros.getQtdeErros() > 0){
        registraLogItem(metaErros);
      }
      else{
        let paramTurma = {
          idInstituicao: header.idInstituicao,
          cod_instituicao: header.cod_instituicao,
          MessageId: header.MessageId,
          objeto: objeto.obj
        };

        await sqlInsertTurma(paramTurma);
      };
    }
    else {
      metaErros.setErro(6);
      registraLogItem(metaErros);
    };
  }, Promise.resolve());

  return 1;
};

async function sqlInsertTurma(Param){
  let metaErros = new syncErros.MetaErros(Param.MessageId, "Perfil", Param.cod_instituicao);
  var dataBase = new dbMysql.Database(configMysql);

  var qry = getQryTurma(Param.idInstituicao, Param.objeto.cod_turma);

  dataBase.query(qry)
  .then( results => {
    if (results){
      if (results.length > 0){
        var res = results[0];

        if (res.ExisteTurma){
          metaErros.setErro(20);
        };

        if (metaErros.erros.length > 0){
          registraLogItem(metaErros);
        }
        else {
          qry = 'Insert Into turma (nom_turma, cod_turma, id_instituicao) Values ("' +
                Param.objeto.nom_turma + '","' +
                Param.objeto.cod_turma + '",' +
                Param.idInstituicao + ')';

          dataBase.query(qry)
          .then( results => {
            registraLogItem(metaErros);
          })
          .catch(err => {
            metaErros.setErro(22);
            registraLogItem(metaErros);
          });
        };
      }
      else {
        metaErros.setErro(22);
        registraLogItem(metaErros);
      };
    };
  })
  .catch(err => {
    metaErros.setErro(19);
    registraLogItem(metaErros);
  });
};

function processaTurmaAluno(pack){
  let metaErrosNivel3 = new syncErros.MetaErros(pack.messageId, "Turma x Aluno", pack.cod_instituicao);

  metaErrosNivel3.setNivel2(pack.nivel2);

  for (let objetoIndex in pack.assunto){
    metaErrosNivel3.addNivel3();

    var objeto = pack.assunto[objetoIndex];

    if (objeto.oper == 'insert'){
      if (!objeto.obj.cod_turma){
        metaErrosNivel3.setErro(17);
      };

      if (!objeto.obj.cod_usuario){
        metaErrosNivel3.setErro(3);
      };

      if (!objeto.obj.dat_inicio){
        metaErrosNivel3.setErro(23);
      };

      if (!objeto.obj.dat_fim){
        metaErrosNivel3.setErro(24);
      };

      if (metaErrosNivel3.getQtdeErros() > 0){
        registraLogItem(metaErrosNivel3);
      }
      else{
        var paramTurmaAluno = {
          nivel3: metaErrosNivel3.getNivel3(),
          nivel2: metaErrosNivel3.getNivel2(),
          IdInstituicao:pack.idInstituicao,
          codInstituicao: pack.cod_instituicao,
          Obj: objeto.obj
        };

        (function(prmTurmaAluno){
          var qry = getQryTurmaAluno(prmTurmaAluno.IdInstituicao, prmTurmaAluno.Obj.cod_turma, prmTurmaAluno.Obj.cod_usuario, prmTurmaAluno.Obj.dat_inicio, prmTurmaAluno.Obj.dat_fim);

          mysql.query(qry, function(error, results, fields){
            let metaErrosNivel4 = new syncErros.MetaErros(pack.messageId, pack.cod_instituicao);

            metaErrosNivel4.setNivel2(prmTurmaAluno.nivel2);
            metaErrosNivel4.setNivel3(prmTurmaAluno.nivel3);

            if (error){
              metaErrosNivel4.setErro(25);
              registraLogItem(metaErrosNivel4);
            }
            else if (results){
              if (results.length > 0){
                var res = results[0];

                if (!res.ExisteTurma){
                  metaErrosNivel4.setErro(26);
                };

                if (!res.ExistePerfil){
                  metaErrosNivel4.setErro(27);
                };

                if (res.ExisteTurmaAluno){
                  metaErrosNivel4.setErro(28);
                };

                if (metaErrosNivel4.erros.length > 0){
                  registraLogItem(metaErrosNivel4);
                }
                else {
                  var paramAdd = {
                    Objeto: prmTurmaAluno.Obj,
                    IdInstituicao:prmTurmaAluno.IdInstituicao
                  };
                  syncErros.setLog("postSyncEndpoint, Passo 3");
                  (function(prmAdd){
                    qry = 'Insert Into perfil_turma (id_perfil, id_turma, dt_inicio, dt_fim) Values (' +
                    res.id_perfil + ',' +
                    res.id_turma + ',' +
                    'Str_to_date("' + prmAdd.Objeto.dat_inicio + '", "%d/%m/%Y"),' +
                    'Str_to_date("' + prmAdd.Objeto.dat_fim    + '", "%d/%m/%Y"))';
                    let results = mysql.transaction()
                      .query(qry)
                      .query((c) => {
                        registraLogItem(metaErrosNivel4);
                      })
                      .rollback(e => {
                        metaErrosNivel4.setErro(29);
                        registraLogItem(metaErrosNivel4);
                      })
                      .commit((c) => {
                        registraLogItem(metaErrosNivel4);
                      });
                  })(paramAdd);
                };
              }
              else {
                metaErrosNivel4.setErro(30);
                registraLogItem(metaErrosNivel4);
              };
            }
            else {
              metaErrosNivel4.setErro(30);
              registraLogItem(metaErrosNivel4);
            };
          });
        })(paramTurmaAluno);
      };
    }
    else {
      metaErrosNivel4.setErro(6);
      registraLogItem(metaErrosNivel3);
    };
  };
};

async function processaResponsavelAluno(header, pack){
  await pack.reduce(async (promise, objeto) => {
    await promise;

    let metaErros = new syncErros.MetaErros(header.MessageId, "Responsavel x Aluno", header.cod_instituicao);

    if (objeto.oper == 'insert'){
      if (!objeto.obj.cod_responsavel){
        metaErros.setErro(31);
      };

      if (!objeto.obj.cod_aluno){
        metaErros.setErro(32);
      };

      if (metaErros.getQtdeErros() > 0){
        registraLogItem(metaErros);
      }
      else{
        (function(prmResponsavelAluno){
          var dataBase = new dbMysql.Database(configMysql);

          var qry = getQryResponsavelAluno(header.idInstituicao, prmResponsavelAluno.cod_responsavel, prmResponsavelAluno.cod_aluno);

          dataBase.query(qry)
          .then( results => {
            if (results){
              if (results.length > 0){
                var res = results[0];

                if (!res.ExisteResponsavel){
                  metaErros.setErro(33);
                };

                if (!res.ExisteAluno){
                  metaErros.setErro(27);
                };

                if (res.ExisteResponsavelAluno){
                  metaErros.setErro(35);
                };

                if (metaErros.erros.length > 0){
                  registraLogItem(metaErros);
                }
                else {
                  qry = 'Insert Into responsavel_aluno (id_perfil_responsavel, id_perfil_aluno) Values (' +
                        res.id_perfil_responsavel + ',' +
                        res.id_perfil_aluno + ')';

                  dataBase.query(qry)
                  .then( results => {
                    registraLogItem(metaErros);
                  })
                  .catch(err => {
                    metaErros.setErro(7);
                    registraLogItem(metaErros);
                  });
                };
              }
              else {
                metaErros.setErro(34);
                registraLogItem(metaErros);
              };
            };
          })
          .catch(err => {
            metaErrosNivel1.setErro(37);
            registraLogItem(metaErros);
          });
        })(objeto.obj);
      };
    }
    else {
      metaErros.setErro(6);
      registraLogItem(metaErros);
    };
  }, Promise.resolve());

  return 1;
};

function getQryPerfil(idInstituicao, codPapel, codPerfil){
   return 'Select Case isNull(pp.id_papel) When 1 Then 0 Else pp.id_papel ' +
                 'End as id_papel,' +
                 'Case isNull(pp.id_papel) When 1 Then 0 Else 1 ' +
                 'End as ExistePapel,' +
                 'Case isNull(pp.id_papel) ' +
                    'When 1 Then 0 Else ' +
                       'Case isNull((Select id_perfil From perfil Where id_instituicao = x.id_instituicao And ' +
                                                                                  'id_papel = pp.id_papel And ' +
                                                                                  'cod_perfil = x.cod_perfil)) ' +
                          'When 1 Then 0 Else 1 ' +
                       'End ' +
                 'End as ExistePerfil ' +
             'From (Select ' + idInstituicao + ' as id_instituicao, "' +
                               codPerfil + '" as cod_perfil, "' +
                               codPapel + '" as cod_papel From dual) x ' +
                      'Left Join papel pp on pp.cod_papel = x.cod_papel';
};

function getQryInstituicao(codInstituicao){
  return 'Select id_instituicao ' +
  'From instituicao ' +
  'Where cod_hub = "' + codInstituicao + '"';
};

function getQryTurma(idInstituicao, codTurma){
  return 'Select Case isNull(pp.id_turma) When 1 Then 0 Else pp.id_turma ' +
                'End as id_turma,' +
                'Case isNull(pp.id_turma) When 1 Then 0 Else 1 ' +
                'End as ExisteTurma ' +
            'From (Select ' + idInstituicao + ' as id_instituicao, "' +
                              codTurma + '" as cod_turma From dual) x ' +
                     'Left Join turma pp on pp.id_instituicao = x.id_instituicao And ' +
                                                      'pp.cod_turma = x.cod_turma';
};

function getQryTurmaAluno(idInstituicao, codTurma, codAluno, dataInicio, dataFim){
  return 'Select y.ExisteTurma,' +
                'y.ExistePerfil,' +
                'y.id_turma,' +
                'y.id_perfil,' +
                'y.id_instituicao,' +
                'y.dt_inicio,' +
                'y.dt_fim,' +
                'Case y.ExisteTurma ' +
                  'When 1 Then Case y.ExistePerfil ' +
                                  'When 1 Then Case isNull((Select pt.id_perfil_turma ' +
                                                              'From perfil_turma pt ' +
                                                              'Where pt.id_perfil = y.id_perfil And ' +
                                                                    'pt.id_turma  = y.id_turma And ' +
                                                                    '((y.dt_inicio Between pt.dt_inicio And pt.dt_fim) or ' +
                                                                      '(y.dt_fim    Between pt.dt_inicio And pt.dt_fim)))) ' +
                                                  'When 0 Then 1 ' +
                                                  'Else 0 ' +
                                              'End ' +
                                          'Else 0 ' +
                                'End ' +
                    'else 0 ' +
                'End as ExisteTurmaAluno ' +
            'From (Select Case isNull(t.id_turma) When 1 Then 0 Else 1 ' +
                         'End as ExisteTurma, ' +
                         'Case isNull(p.id_perfil) When 1 Then 0 Else 1 ' +
                         'End as ExistePerfil, ' +
                         't.id_turma, ' +
                         'p.id_perfil, ' +
                         'x.id_instituicao, ' +
                         'x.dt_inicio, ' +
                         'x.dt_fim ' +
                     'From (Select ' + idInstituicao + ' as id_instituicao,"' +
                                       codAluno + '" as cod_perfil,"' +
                                       codTurma + '" as cod_turma,' +
                                   'Str_to_date("' + dataInicio + '", "%d/%m/%Y") as dt_inicio,' +
                                   'Str_to_date("' + dataFim    + '", "%d/%m/%Y") as dt_fim From Dual) x ' +
                              'Left Join turma t on t.id_instituicao = x.id_instituicao And ' +
                                                              't.cod_turma = x.cod_turma ' +
                              'Left Join perfil p on p.id_instituicao = x.id_instituicao And ' +
                                            'p.id_papel = 1 And ' +
                                            'p.cod_perfil = x.cod_perfil) y';
};

function getQryResponsavelAluno(idInstituicao, codResponsavel, codAluno){
  return 'Select Case isNull(pr.id_perfil) When 1 Then 0 Else 1 ' +
                'End as ExisteResponsavel, ' +
                'Case isNull(pa.id_perfil) When 1 Then 0 Else 1 ' +
                'End as ExisteAluno, ' +
                'pr.id_perfil as id_perfil_responsavel, ' +
                'pa.id_perfil as id_perfil_aluno, ' +
                'Case isNull(pr.id_perfil) ' +
                   'When 0 Then Case isNull(pa.id_perfil) ' +
                                  'When 0 Then Case isNull((Select ra.id_responsavel_aluno ' +
                                                              'From responsavel_aluno ra ' +
                                                              'Where ra.id_perfil_responsavel = pr.id_perfil And ' +
                                                                    'ra.id_perfil_aluno       = pa.id_perfil)) ' +
                                                 'When 0 Then 1 ' +
                                                 'Else 0 ' +
                                              'End ' +
                                  'Else 0 ' +
                               'End ' +
                   'else 0 ' +
                'End as ExisteResponsavelAluno ' +
                'From (Select ' + idInstituicao + ' as id_instituicao,"' +
                                  codResponsavel + '" as cod_perfil_responsavel,"' +
                                  codAluno + '" as cod_perfil_aluno, ' +
                          '(Select id_papel From papel where cod_papel = "001") as id_papel_aluno, ' +
                          '(Select id_papel From papel where cod_papel = "002") as id_papel_responsavel From Dual) x ' +
                  'Left Join perfil pr on pr.id_instituicao = x.id_instituicao And ' +
                                                        'pr.id_papel = x.id_papel_responsavel And ' +
                                                        'pr.cod_perfil = x.cod_perfil_responsavel ' +
                  'Left Join perfil pa on pa.id_instituicao = x.id_instituicao And ' +
                                                        'pa.id_papel = x.id_papel_aluno And ' +
                                                        'pa.cod_perfil = x.cod_perfil_aluno';
};

// GET Functions

// Sync Authorization
module.exports.getSyncEndpointOld = async (event, context) => {
  const messageBody = {
    message: "Endpoint is working!",
    claims: event.requestContext.authorizer.claims,
    //event: event,
    //context: context
  };
  return RawResponse(200, JSON.stringify(messageBody));
};

module.exports.getSyncEndpoint = (event, context, callback) => {
  console.log("consumeMainQueue, Passo 0");
  let messageID = event.pathParameters.messageID;
  console.log("getSyncEndpoint, Passo 1", messageID);
  queryByPartitionKey(messageID, LOGCONF)
    .then(function (data){
      console.log("getSyncEndpoint, Passo 2", data);
      delete data.Count;
      delete data.ScannedCount;
      let dados = JSON.stringify(data);
      const response = {
          statusCode: 200,
          body: dados,
      };
      callback(null, response);
    })
    .catch(function (err){
      const response = {
        statusCode: 500,
        body: JSON.stringify({error: err}),
      };
      callback(null, response);
    });
};

module.exports.functionJsonS3 = (event, context, callback) => {
  console.log("functionJsonS3: ", event);
};

module.exports.QueryProfileUserIdEndpoint = async (event, context) => {
  let uuID = event.pathParameters.uuID;

  var retorno = '';

  let results = await module.exports.QueryProfileByUserId(uuID);

  if (results){
    if (results.length > 0){
      retorno = JSON.stringify(results);
      const response = {
        statusCode: 200,
        body: retorno
      };
      return response;
    }
    else {
      retorno = 'nenhum registro encontrado';
      const response = {
          statusCode: 200,
          body: retorno
        };
        return response;
    }
  }
}


module.exports.QueryProfileByUserId = async function (userID) {
  var dataBase = new dbMysql.Database(configMysql);

  const qry = getQryProfileUserId(userID);
  let results;
  try {
    results = await dataBase.query(qry);
  } catch (error) {
    console.error(error);
  }
  return results;
};

function getQryProfileUserId(codUuid){
  return 'Select z.cod_uuid as cod_uuid, ' +
                'Case isNull(z.cod_negocio) When 1 Then 0 Else 1 ' +
                'End as existeConta, ' +
                'Case isNull(z.id_perfil) When 1 Then 0 Else 1 ' +
                'End as existePerfil, ' +
                'z.cod_perfil as cod_perfil, ' +
                'z.nom_usuario as nom_usuario, ' +
                'z.email_usuario as email_usuario, ' +
                'i.nom_instituicao as nom_instituicao, ' +
                'i.cod_hub as cod_instituicao_hub, ' +
                'pp.nom_papel as nom_papel ' +
              'From (Select * ' +
                    'From (Select * ' +
                            'From (Select "' + codUuid + '" as cd_uuid From Dual) x ' +
                                    'Left Join conta c on c.cod_uuid = x.cd_uuid) y ' +
                        'Left Join perfil pf on pf.cod_hash = y.cod_negocio) z ' +
                'Left join instituicao i on i.id_instituicao = z.id_instituicao ' +
                    'Left Join papel pp on pp.id_papel = z.id_papel';
}