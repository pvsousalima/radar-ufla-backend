
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
    PARAMETROS_INVALIDOS: {auth: false, message: 'Os parâmetros fornecidos são inválidos'},
    DADOS_INCORRETOS: {auth: false, message: 'Dados incorretos.'},
    NOT_UPDATED: {updated: false, message:'O perfil não foi atualizado'}
}

// operacoes ok
var success_op = {
    USUARIO_AUTENTICADO: {auth: true, message: 'O usuário foi autenticado'},
    MANIFESTACAO_CRIADA: {message: 'A manifestação foi criada'},

    UPDATED: {message: 'O perfil foi atualizado'}
}

// login endpoint
app.post('/login', function (req, res) {

    // checa parametros
    if(req.body.email && req.body.password){

        // faz "requisicao" à DGTI
        models.User.findOne({ email: req.body.email, password: req.body.password }, (err, person) => {
            if (err) {
                return res.status(401).json(err)
            } else {
                if(person){
                    generateToken(person.toJSON()).then((data) => { // gera o token de sessao para o usuario
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


// GET manifestacoes
app.get('/manifestacao', (req, res) => {
    models.Manifestacao.find({}, (err, manifestacoes) => {
        err ? res.status(404).json(err) : res.json(manifestacoes)
    })
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
    return res.status(403).send({
        auth: false,
        message: 'Token ausente.'
    });

  }
});

// Endpoint para criacao de uma nova manifestacao
app.post('/manifestacao', function (req, res) {
    createNewManifestacao(req).then((data) => {
        data ? res.json(data) : res.status(401).json(err_op.PARAMETROS_INVALIDOS)
    })
})

// Endpoint de atualizacao do perfil do usuario
app.put('/profile', (req, res) => {
    updateProfile(req).then((updated) => {
        updated ? res.json(updated) : res.status(401).json(err_op.NOT_UPDATED)
    })
})

// models.User.remove({}, function(){})
// models.Manifestacao.remove({}, function(){})

// Cria um novo usuario no banco de dados
function createNewUser(data){
    var newUser = new models.User(data);
    newUser.save((err) => {
        return err ? false :  true
    });
}

// gera um token para um dado usuario de forma assincrona
function generateToken(person){
    return new Promise((resolve, reject) => {
        jwt.sign(person, app.get('superSecret'), { expiresIn: 60 * 60 * 24, algorithm: 'HS256' }, (err, token) => {
            person.token = token
            person.auth = true
            resolve(person)
        })
    });
}

// Funcao de atualizacao do perfil do usuario
function updateProfile(req) {
    return new Promise((resolve, reject) => {
        models.User.findOneAndUpdate( {'email': req.decoded.email, 'password':req.decoded.password }, req.body, {new: true, upsert:false}, (err, doc) => {
            err || doc === null ? reject(null) : resolve(doc)
        });
    });
}

// Cria uma nova manifestacao no banco de dados
function createNewManifestacao(req) {
    return new Promise((resolve, reject) => {
        var newManifestacao = new models.Manifestacao(req.body);
        newManifestacao.id_usuario = req.decoded._id
        newManifestacao.save((err, manifestacao) => {
            err ? reject(null) : resolve(manifestacao)
        })
    })
}

createNewUser(
    {
        "email": "neumar@dcc.ufla.br",
        "password": "123456",
        "nome": "Neumar Malheiros",
        "categoria": "professor",
        "setor": "DCC",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    }
)

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
