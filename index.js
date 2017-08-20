
var {loginRouter, listMacAddress, parserURL} = require('./su/tp');

var express = require('express');
var app = express();

var lastStok;

app.get('/router', function(req,res){
    console.log(req.url);
    parserURL(req.url,function(err, userInfo) {
        if (err !== null) {
            console.log(err); 
            res.end();
            return ;
        }
        console.log(userInfo);

        loginRouter(userInfo)
        .then((stok) => {
            lastStok = stok;
            return listMacAddress(stok);
        })
        .then((macAdress) => {
            console.log(macAdress); 
            res.send(macAdress);
            res.end();
        })
        .catch((err) => {
            console.log("catch:", err);
            res.end();
        });
    });
});

app.get('/list', function (req, res) {
    console.log(req.url);
    if (lastStok == undefined) {
        res.end('please login first');
       return ; 
    }

    listMacAddress(lastStok)
        .then((macAdress) => {
            console.log(macAdress);
            res.send(macAdress);
            res.end();
        })
        .catch((err) => {
            console.log("catch:", err);
            res.end();
        });
});

app.get('*', function (req, res) {
    res.send("<h2>login router: <br />/router?username=xxxx&password=xxxx&ipAddress=xxx</h2><br /><h2>list oneline mac address:<br /> /list</h2>");
    res.end("");
});

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('app listening at http://%s:%s', host, port);
});