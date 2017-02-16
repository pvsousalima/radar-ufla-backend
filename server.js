var express = require('express')
var path = require('path')
var compression = require('compression')
var mongoose = require('mongoose');
var bodyParser = require('body-parser')

// cria o app express
var app = express()

// conecta com o servidor do mongodb
// connect to database

if (process.env.NODE_ENV === 'develop') {
    mongoose.connect('mongodb://localhost/test')
} else {
    mongoose.connect('mongodb://admin:radar@ds147079.mlab.com:47079/radarufladb')
}
console.log('Connected to mongoDB database.');

// parser de application/json
app.use(bodyParser.json())

// sistema de erros
var err_op = {
    PARAMETROS_INVALIDOS: {message:'Os parâmetros fornecidos são inválidos'},
    NOT_UPDATED: {message:'O perfil não foi atualizado'}
}

// operacoes ok
var success_op = {
    USUARIO_AUTENTICADO: {message:'O usuário foi autenticado'},
    UPDATED: {message:'O perfil foi atualizado'}
}

// Models to access the collection on database
var models = {
    User: mongoose.model('User', { email: String, password: String, nome: String, foto: String, departamento: String, idade: Number })
}

// login endpoint
app.post('/login', function (req, res) {

    // check params
    if(req.body.email && req.body.password){

        // faz requisicao a DGTI
        models.User.findOne({ email: req.body.email, password: req.body.password  }, function (err, person) {
            if (err) {
                return res.status(404).json(err)
            }
            else {
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
    res.json(success_op.UPDATED)
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
            else {
                res(true)
            }
        });
    });
}

// models.User.remove({}, function(){})

// creates a new user
function createNewUser(){
    var userJSON = { email: 'neumar@dcc.ufla.br',  password: '123456', nome: "Neumar", idade: 25, departamento: "DCC" }
    var newUser = new models.User(userJSON);
    newUser.save(function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log('user saved');
        }
    });
}

// createNewUser(null)


var PORT = process.env.PORT || 8080

app.listen(PORT, function() {
    console.log('Production Express server running at localhost:' + PORT)
})
