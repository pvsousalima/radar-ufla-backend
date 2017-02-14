var express = require('express')
var path = require('path')
var compression = require('compression')
var mongoose = require('mongoose');
var bodyParser = require('body-parser')

// cria o app express
var app = express()

// conecta com o servidor do mongodb
// connect to database
// mongoose.connect('mongodb://localhost/test')
mongoose.connect('mongodb://admin:radar@ds147079.mlab.com:47079/radarufladb')

console.log('Connected to mongoDB database.');

// parser de application/json
app.use(bodyParser.json())

// sistema de erros
var err_op = {
    PARAMETROS_INVALIDOS: {message:'Os parametros fornecidos sao invalidos'}
}

// operacoes ok
var success_op = {
    USUARIO_AUTENTICADO: {message:'O usuario foi autenticado'}
}

// Models to access the collection on database
var models = {
    User: mongoose.model('User', { email: String, password: String, nome: String, foto: String })
}

// creates a new user
function createNewUser(){

    var newUser = new models.User({ email: 'neumar@dcc.ufla.br',  password: '123456' });

    newUser.save(function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log('user saved');
        }
    });
}

createNewUser(null)

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

app.put('/me', function (req, res) {

})


var PORT = process.env.PORT || 8080

app.listen(PORT, function() {
    console.log('Production Express server running at localhost:' + PORT)
})
