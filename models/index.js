
// conexao com mongodb
var mongoose = require('mongoose');

// opcoes de conecao
var options = {
    server: {
        socketOptions: {
            socketTimeoutMS: 0,
            connectTimeoutMS: 0
        }
    }
}

// configuracao de testes ou de desenvolvimento para acessar o mongodb
if (process.env.NODE_ENV === 'develop') {
    mongoose.connect('mongodb://localhost/test', options);
    console.log('Connected to mongoDB database on localhost.');
} else {
    mongoose.connect('mongodb://pvsousalima:digimon@ds115712.mlab.com:15712/minilista', options)
    console.log('Connected to mongoDB database on remote.');
}


// Models to access the collection on database
var models = {
    User: mongoose.model('User', require('./user.js')),
}

module.exports = models;
