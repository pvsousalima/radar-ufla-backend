
var express = require('express')
var path = require('path')
var compression = require('compression')
var bodyParser = require('body-parser')
var jwt = require('jsonwebtoken');

// cria o app express
var app = express()

// importa os modelos do mongodb
var models = require('./models')


// jwt.verify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYWRhIjoiZGFkYSIsImlhdCI6MTQ4NzgxMzQ3OCwiZXhwIjoxNDg3ODEzNTA4fQ.HLxnz-Z4R6rSmrX07pcPIi_fQEWdhWFC8sZ1PylKBOs', 'radar-ufla', function(err, decoded) {
//   if (err) {
//       console.log(err);
//     /*
//       err = {
//         name: 'TokenExpiredError',
//         message: 'jwt expired',
//         expiredAt: 1408621000
//       }
//     */
// } else {
//     console.log('valid');
// }
// });


app.set('superSecret', 'radar-ufla'); // secret variable

// jwt.sign({dada:'dada'}, app.get('superSecret'), { expiresIn: 30, algorithm: 'HS256' }, function(err, token) {
//     console.log(token);
// })

// cors
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// parser de application/json
app.use(bodyParser.json())

// sistema de erros
var err_op = {
    PARAMETROS_INVALIDOS: {sucesso: false, message: 'Os parâmetros fornecidos são inválidos'},
    DADOS_INCORRETOS: {sucesso: false, message: 'Dados incorretos.'},
    NOT_UPDATED: {sucesso: false, message:'O perfil não foi atualizado'},
    NOT_FOUND: {sucesso: false, message:'O usuário não foi encontrado.'},
    MANIFESTACAO_NOT_FOUND: {sucesso: false, message:'Manifestação não foi encontrada.'}
}

// operacoes ok
var success_op = {
    USUARIO_AUTENTICADO: {sucesso: true, message: 'O usuário foi autenticado'},
    MANIFESTACAO_CRIADA: {sucesso:true, message: 'A manifestação foi criada'},
    UPDATED: {sucesso:true, message: 'O perfil foi atualizado'}
}

// Endpoint para realizar a autenticacao e administracao de sessao dos usuarios
app.post('/login', function (req, res) {

    // checa parametros
    if(req.body.email && req.body.password){

        // faz "requisicao" à DGTI
        models.User.findOne({ email: req.body.email, password: req.body.password }, (err, person) => {
            if (err) {
                return res.status(401).json(err)
            } else {
                if(person){
                    geraToken(person.toJSON()).then((data) => { // gera o token de sessao para o usuario
                        return res.json(data)
                    })
                } else {
                    return res.status(401).json(err_op.DADOS_INCORRETOS)
                }
            }
        })

    } else {
        res.status(401).json(err_op.PARAMETROS_INVALIDOS)
    }
})


// Metodo de protecao com token
app.use((req, res, next)  => {

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {
      if (err) {
        return res.json({ success: false, message: 'Token inválido.' });
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });

  } else {

    // if there is no token
    // return an error
    return res.status(401).send({
        auth: false,
        message: 'Token ausente.'
    });

  }
});


// Endpoint para retornar uma manifestacao especifica de acordo com o id
app.get('/manifestacao/:id', (req, res) => {
    getManifestacaoById(req).then((data) => {
        res.json(data)
    }).catch(err => {
        res.status(404).json(err_op.MANIFESTACAO_NOT_FOUND)
    })
})

// Endpoint para retornar uma lista de manifestacoes
app.get('/manifestacao', (req, res) => {
    models.Manifestacao.find({}, (err, manifestacoes) => {
        err ? res.status(404).json(err) : res.json(manifestacoes)
    })
})

// Endpoint para criar uma nova manifestacao
app.post('/manifestacao', function (req, res) {
    createNewManifestacao(req).then((data) => {
        data ? res.json(data) : res.status(401).json(err_op.PARAMETROS_INVALIDOS)
    })
})

// Endpoint para atualizar o perfil do usuario
app.put('/usuario', (req, res) => {
    atualizaPerfil(req).then((updated) => {
        updated ? res.json(updated) : res.status(401).json(err_op.NOT_UPDATED)
    })
})

// Endpoint para retornar o perfil de um usuario especifico de acordo com o id
app.get('/usuario/:id', (req, res) => {
    getUsuario(req).then((usuario) => {
        usuario ? res.json(usuario) : res.status(404).json(err_op.NOT_FOUND)
    }).catch(err => {
        res.status(404).json(err_op.NOT_FOUND)
    })
})

// Endpoint para retornar o perfil do usuario
app.get('/usuario', (req, res) => {
    getUsuarioPerfil(req).then((usuario) => {
        usuario ? res.json(usuario) : res.status(404).json(err_op.NOT_FOUND)
    }).catch(err =>{
        res.status(404).json(err_op.NOT_FOUND)
    })
})

// Funcao que retorna uma manifestacao de acordo com o id da mesma
function getManifestacaoById(req){
    return new Promise(function(resolve, reject) {
        models.Manifestacao.find({"_id": req.params.id}, (err, manifestacao) => {
            err ? reject(err) : resolve(manifestacao)
        })
    });
}

// Funcao para retornar o perfil do usuario
function getUsuarioPerfil(req) {
    return new Promise((resolve, reject) => {
        models.User.findOne( {'id': req.decoded.id}, (err, doc) => {
            err || doc === null ? reject(null) : resolve(doc)
        });
    });
}

// Funcao para retornar um usuario
function getUsuario(req) {
    return new Promise((resolve, reject) => {
        models.User.findOne( {'_id': req.params.id}, (err, doc) => {
            err || doc === null ? reject(null) : resolve(doc)
        });
    });
}


// Funcao para criar um novo usuario no banco de dados
function createNewUser(data){
    var newUser = new models.User(data);
    newUser.save((err) => {
        return err ? false :  true
    });
}

// Funcao para gerar um token para um dado usuario de forma assincrona
function geraToken(person){
    return new Promise((resolve, reject) => {
        jwt.sign(person, app.get('superSecret'), { expiresIn: 60 * 60 * 24, algorithm: 'HS256' }, (err, token) => {
            person.token = token
            person.auth = true
            resolve(person)
        })
    });
}

// Funcao de atualizacao do perfil do usuario
function atualizaPerfil(req) {
    return new Promise((resolve, reject) => {
        models.User.findOneAndUpdate( {'email': req.decoded.email, 'password':req.decoded.password }, req.body, {new: true, upsert:false}, (err, doc) => {
            err || doc === null ? reject(null) : resolve(doc)
        });
    });
}

// Funcao de criacao de  uma nova manifestacao no banco de dados
function createNewManifestacao(req) {
    return new Promise((resolve, reject) => {
        var newManifestacao = new models.Manifestacao(req.body);
        newManifestacao.id_usuario = req.decoded._id
        newManifestacao.save((err, manifestacao) => {
            err ? reject(null) : resolve(manifestacao)
        })
    })
}

// createNewUser(
//     {
//         "email": "neumar@dcc.ufla.br",
//         "password": "123456",
//         "nome": "Neumar Malheiros",
//         "categoria": "professor",
//         "setor": "DCC",
//         "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
//     }
// )

// createNewManifestacao(
//     {
//         "tipo": "consulta",
//         "assunto": "este e o assunto",
//         "descricao": "esta e a descricao da manifestacao",
//         "anexo": "caminho do arquivo",
//         "id_usuario": "aslkjdf09f0sa",
//         "likes" : 0,
//         "dislikes" : 0,
//     }
// )

// Inicia o servidor Node
var PORT = process.env.PORT || 8080

app.listen(PORT, () => {
    console.log('Production Express server running at localhost:' + PORT)
})
