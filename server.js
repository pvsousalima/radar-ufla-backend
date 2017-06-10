
var express = require('express')
var path = require('path')
var compression = require('compression')
var bodyParser = require('body-parser')
var jwt = require('jsonwebtoken')
var cors = require('cors')

// cria o app express
var app = express()

app.use(cors()) //cors enable

// importa os modelos do mongodb
var models = require('./models')

// seta a chave de segredo para geracao dos tokens
app.set('superSecret', 'radar-ufla') // secret variable

// parser de body application/json
app.use(bodyParser.json())

// sistema de erros
var err_op = {
    PARAMETROS_INVALIDOS: {sucesso: false, message: 'Os parâmetros fornecidos são inválidos.'},
    DADOS_INCORRETOS: {sucesso: false, message: 'Dados incorretos.'},
    NOT_UPDATED: {sucesso: false, message:'O perfil não foi atualizado.'},
    NOT_FOUND: {sucesso: false, message:'O usuário não foi encontrado.'},
    NOT_REGISTERED: {sucesso: false, message:'O usuário não foi cadastrado.'},
    MANIFESTACAO_NOT_FOUND: {sucesso: false, message:'Manifestação não foi encontrada.'}
}

// operacoes ok
var success_op = {
    USUARIO_AUTENTICADO: {sucesso: true, message: 'O usuário foi autenticado.'},
    USUARIO_CADASTRADO: {sucesso: true, message: 'O usuário foi cadastrado.'},
    MANIFESTACAO_CRIADA: {sucesso:true, message: 'A manifestação foi criada.'},
    UPDATED: {sucesso:true, message: 'O perfil foi atualizado.'}
}

// Endpoint para realizar a autenticacao e administracao de sessao dos usuarios
app.post('/login', (req, res) => {

    // checa parametros
    if(req.body.email && req.body.password){

        // faz "requisicao" à DGTI
        models.User.findOne({ email: req.body.email, password: req.body.password }, (err, person) => {
            if (err) {
                return res.status(401).json(err)
            } else {
                if(person){
                    geraToken(person.toJSON()).then((data) => { // gera o token de sessao para o usuario
                        delete data.password
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

// Endpoint para realizar a autenticacao e administracao de sessao dos usuarios
app.post('/login/facebook', (req, res) => {

    // checa parametros
    if(req.body.facebookId){

        getUsuarioByFacebookId(req).then((user) => {
            if(user){
                geraToken(user.toJSON()).then((data) => { // gera o token de sessao para o usuario
                    return res.json(data)
                })
            }
        }).catch((err) => {

            cadastraUsuarioByFacebook(req).then((user) => {
                geraToken(user.toJSON()).then((data) => { // gera o token de sessao para o usuario
                    return res.status(203).json(data)
                })
            }).catch((err) => {
                res.send(err)
            })

        })

    } else {
        res.status(401).json(err_op.PARAMETROS_INVALIDOS)
    }

})

// Endpoint para cadastrar um novo usuario por email
app.post('/usuario', (req, res) => {
    cadastraUsuarioByEmail(req).then((data) => {
        res.status(201).json(data)
    }).catch(err => {
        res.status(401).json(err_op.NOT_REGISTERED)
    })
})

// Metodo de protecao com token
app.use((req, res, next)  => {

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token']

    // decode token
    if (token) {

        // verifies secret and checks exp
        jwt.verify(token, app.get('superSecret'), (err, decoded) => {
            if (err) {
                return res.status(401).json({ success: false, message: 'Token inválido.' })
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded
                next()
            }
        })

    } else {

        // if there is no token
        // return an error
        return res.status(401).send({
            auth: false,
            message: 'Token ausente.'
        })

    }
})

// Endpoint para atualizar o perfil do usuario
app.put('/usuario', (req, res) => {
    atualizaPerfil(req).then((updated) => {
        updated ? res.json(updated) : res.status(401).json(err_op.NOT_UPDATED)
    })
})

// Endpoint para retornar o perfil do usuario
app.get('/usuario', (req, res) => {
    getUsuarioPerfil(req).then((usuario) => {
        delete usuario.password
        usuario ? res.json(usuario) : res.status(404).json(err_op.NOT_FOUND)
    }).catch(err => {
        res.status(404).json(err_op.NOT_FOUND)
    })
})

// Endpoint para retornar uma base completa
app.get('/carregaBase', (req, res) => {
    getBase(req.query.base).then((base) => {
        base ? res.json(base) : res.status(404).json(err_op.NOT_FOUND)
    }).catch(err => {
        res.status(404).json(err_op.NOT_FOUND)
    })
})


// Funcao para retornar o perfil do usuario
function getUsuarioPerfil(req) {
    return new Promise((resolve, reject) => {
        models.User.findOne( {'id': req.decoded.id}, (err, doc) => {
            err || doc === null ? reject(null) : resolve(doc)
        })
    })
}

// Retorna uma base
function getBase(base){
    return new Promise((resolve, reject) => {
        models.User.find( {base: base}, (err, users) => {
            if(err){
                reject(err)
            } else {
                users ? resolve(users) : reject(users)
            }
        })
    })
}

// Funcao para retornar um usuario
function getUsuario(req) {
    return new Promise((resolve, reject) => {
        models.User.findOne( {'_id': req.params.id}, (err, doc) => {
            err || doc === null ? reject(null) : resolve(doc)
        })
    })
}

// Funcao para retornar um usuario
function getUsuarioByFacebookId(req) {
    return new Promise((resolve, reject) => {
        models.User.findOne( {'facebookId': req.body.facebookId}, (err, doc) => {
            err || doc === null ? reject(null) : resolve(doc)
        })
    })
}


// Funcao para criar um novo usuario no banco de dados
function cadastraUsuarioByEmail(req) {
    return new Promise((resolve, reject) => {
        models.User.findOne({email: req.body.email}, (err, user) => {
            if(err){
                reject(err)
            } else {
                user ? reject(user) : cadastraUsuario(req, resolve, reject)
            }
        })
    })
}

// Funcao para criar um novo usuario no banco de dados via facebook
function cadastraUsuarioByFacebook(req) {
    return new Promise((resolve, reject) => {
        models.User.findOne({facebookId: req.body.facebookId}, (err, user) => {
            if(err){
                reject(err)
            } else {
                user ? reject(user) : cadastraUsuario(req, resolve, reject)
            }
        })
    })
}

// Salva o usuario no banco de dados
function cadastraUsuario(req, resolve, reject) {
    var novoUsuario = new models.User(req.body)
    novoUsuario.save((err, usuario) => {
        err ? reject(null) : resolve(usuario)
    })
}

// Funcao para gerar um token para um dado usuario de forma assincrona
function geraToken(person){
    return new Promise((resolve, reject) => {
        jwt.sign(person, app.get('superSecret'), { expiresIn: '1Y', algorithm: 'HS256' }, (err, token) => {
            person.token = token
            resolve(person)
        })
    })
}


// Funcao de atualizacao do perfil do usuario
function atualizaPerfil(req) {
    return new Promise((resolve, reject) => {
        models.User.findOneAndUpdate( {'email': req.decoded.email, 'password':req.decoded.password }, req.body, {new: true, upsert:false}, (err, doc) => {
            err || doc === null ? reject(null) : resolve(doc)
        })
    })
}


// Inicia o servidor Node
var PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log('Production Express server running at localhost:' + PORT)
})
