
const { encrypt } = require("./su/encrypt");

var express = require('express');
var app = express();

var request = require('request');
var j = request.jar();
var request = request.defaults({ jar: j })

var stok = undefined;

var host = '192.168.1.1';


function router(url, form, callback) {
    let options = {
        url: url,
        headers: {
            'Referer': `http://${host}/webpages/login.html`,
            'Origin': `http://${host}`,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Safari/604.1.38',
            'Conent-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        form: form
    };

    request.post(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(body);
        }
    });
}

app.get('/router', function (req, res) {


    console.log('/router:' + req.url);
    let components = req.url.split('?');
    let userInfo = {};
    if (components.length == 2) {
        let params = components[1].split('&');
        for(let idx=0; idx<params.length; idx++){
            let info = params[idx].split('=');
            if (info.length > 0) {
                userInfo[info[0]] = info[1];
            }
        }
    }
    const username = userInfo['admin'] || 'admin';
    const password = userInfo['password'] || 'password'; 
    const ipAddress = userInfo["ipAddress"];
    if (ipAddress !== undefined) {
        host = ipAddress;
    }
    
    console.log(`set username:${username}, password:${password}, ipAddress:${host}`);
    const url = `http://${host}/cgi-bin/luci/;stok=/login?form=login`;
    const preReqData = { data: '{"method":"get"}' };
    router(url, preReqData, function (body) {
        let params = JSON.parse(body).result.password;
        let encodedPassword = encrypt(password, params);
        let loginData = { data: `{"method":"login","params":{"username":"${username}","password":"${encodedPassword}"}}` };

        router(url, loginData, function (body) {
            stok = JSON.parse(body).result.stok;
            console.log("stok" + stok);
            res.send({ error: 0, stok: stok });
            res.end("");  
        });
    });
});

app.get('/list', function (req, res) {
    console.log('/list:' + stok);
    if (stok != undefined && typeof stok === 'string') {
        const url = `http://${host}/cgi-bin/luci/;stok=${stok}/admin/wlan_station?form=stainfo`;
        const data = { data: '{"method":"get","params":{"key_idx":"-1"}}' };
        console.log('/list:' + url);
        router(url, data, function (body) {
            let result = JSON.parse(body).result.sta_info;
            console.log(result);
            
            if (result != undefined && typeof result === 'object') {
                let filtedMAC = [];
                for (let idx = 0; idx < result.length; idx++) {
                    filtedMAC.push(result[idx].sta_mac);
                }
                if (filtedMAC.length > 0) {
                    res.send({ error: 0, list: filtedMAC });
                    res.end("");  
                    
                } else {
                    res.send({ error: -1, message: "not found any mac address" });
                    res.end("");  
                }
            }else {
                res.send({ error: -2, message: "not found any mac address" }); 
                res.end("");  
            }

        });
    } else {
        console.log('error!');
        res.send({ error: -1, message: 'stok is undefined!' });
        res.end("");  
    }
});

app.get('*', function(req,res) {
    res.send("<h2>login router: <br />/router?username=xxxx&password=xxxx&ipAddress=xxx</h2><br /><h2>list oneline mac address:<br /> /list</h2>");   
    res.end("");  
});

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('app listening at http://%s:%s', host, port);
});