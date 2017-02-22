
var express = require('express')
var path = require('path')
var compression = require('compression')
var bodyParser = require('body-parser')

// cria o app express
var app = express()

// importa os modelos do mongodb
var models = require('./models')

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
    PARAMETROS_INVALIDOS: {message: 'Os parâmetros fornecidos são inválidos'},
    NOT_UPDATED: {updated: false, message:'O perfil não foi atualizado'}
}

// operacoes ok
var success_op = {
    USUARIO_AUTENTICADO: {message: 'O usuário foi autenticado'},
    UPDATED: {message: 'O perfil foi atualizado'}
}


// login endpoint
app.post('/login', function (req, res) {

    // check params
    if(req.body.email && req.body.password){

        // faz requisicao a DGTI
        models.User.findOne({ email: req.body.email, password: req.body.password  }, function (err, person) {
            if (err) {
                return res.status(404).json(err)
            } else {
                return res.json(person)
            }
        })

    } else {
        res.json(err_op.PARAMETROS_INVALIDOS)
    }
})

// login endpoint
app.post('/manifestacao', function (req, res) {
    if(req.body.email && req.body.password){
        createNewManifestacao(req.body);
    } else {
        res.json(err_op.PARAMETROS_INVALIDOS)
    }
})

// login endpoint
app.get('/manifestacao', function (req, res) {
    models.Manifestacao.find({}, function (err, manifestacoes) {
        if (err) {
            return res.status(404).json(err)
        } else {
            return res.json(manifestacoes)
        }
    })
})


// Endpoint de atualizacao do perfil do usuario
app.put('/profile', function (req, res) {
    updateProfile(req.body).then(function(updated){
        res.json(updated)
    }).catch(function(err){
        res.status(401).json(err_op.NOT_UPDATED)
    })

})

// Funcao de atualizacao do perfil do usuario
function updateProfile(data) {
    return new Promise(function(res, rej) {
        models.User.findOneAndUpdate({'email': data.email, 'password':data.password }, data, {upsert:false}, function(err, doc){
            if (err || doc === null) {
                rej(false)
            }
            res(true)
        });
    });
}

models.User.remove({}, function(){})
models.Manifestacao.remove({}, function(){})

// Cria um novo usuario no banco de dados
function createNewUser(data){
    var newUser = new models.User(data);
    newUser.save(function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log('user saved');
        }
    });
}

// Cria uma nova manifestacao no banco de dados
function createNewManifestacao(data){
    var newManifestacao = new models.Manifestacao(data);
    newManifestacao.save(function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log('manifestacao saved');
        }
    });
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

createNewManifestacao(
    {
        "tipo": "consulta",
        "assunto": "este e o assunto",
        "descricao": "esta e a descricao da manifestacao",
        "anexo": "caminho do arquivo",
        "id_usuario": "aslkjdf09f0sa",
        "likes" : 0,
        "dislikes" : 0
    }
)


// Inicia o servidor Node
var PORT = process.env.PORT || 8080

app.listen(PORT, function() {
    console.log('Production Express server running at localhost:' + PORT)
})
