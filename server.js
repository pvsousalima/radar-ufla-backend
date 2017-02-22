var express = require('express')
var path = require('path')
var compression = require('compression')
var mongoose = require('mongoose');
var bodyParser = require('body-parser')

// cria o app express
var app = express()

// conecta com o servidor do mongodb
// connect to database

// cors
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


// connection options
var options = {
  server: {
    socketOptions: {
      socketTimeoutMS: 0,
      connectTimeoutMS: 0
    }
  }
}

// mongoose.connect('mongodb://localhost/test', options);

if (process.env.NODE_ENV === 'develop') {
    mongoose.connect('mongodb://localhost/test', options);
} else {
    mongoose.connect('mongodb://admin:radar@ds147079.mlab.com:47079/radarufladb', options)
}

console.log('Connected to mongoDB database.');

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


// Models to access the collection on database
var models = {
    User: mongoose.model('User', { email: String, password: String, nome: String, categoria: String, foto: String, setor: String}),
    Manifestacao: mongoose.model('Manifestacao', { tipo: String, assunto: String, descricao: String, anexo: String, id_usuario: String, likes: Number, dislikes: Number})
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

    // check params
    if(req.body.email && req.body.password){

        // faz requisicao a DGTI
        models.Manifestacao.findOne({ email: req.body.email, password: req.body.password  }, function (err, person) {
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


// profile update endpoint
app.put('/profile', function (req, res) {
    updateProfile(req.body).then(function(updated){
        res.json(updated)
    }).catch(function(err){
        res.status(401).json(err_op.NOT_UPDATED)
    })

})

// updates the profile
function updateProfile(data) {
    return new Promise(function(res, rej) {
        models.User.findOneAndUpdate({'email': data.email }, data, {upsert:false}, function(err, doc){
            if (err || doc === null) {
                rej(false)
            }
            res(true)
        });
    });
}

models.User.remove({}, function(){})
models.Manifestacao.remove({}, function(){})

// creates a new user
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

// creates a new user
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



var PORT = process.env.PORT || 8080

app.listen(PORT, function() {
    console.log('Production Express server running at localhost:' + PORT)
})
