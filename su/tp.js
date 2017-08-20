const { encrypt } = require("./encrypt");
var request = require('request');
var j = request.jar();
var request = request.defaults({ jar: j })

var host = '192.168.1.1'; // set the router's ip  to default address.

function requestPage(url, form) {
    return new Promise((resolve, reject) => {
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

        console.log('request:',url, form);

        request.post(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
}

function parserURL(url, callback) {
    let components = url.split('?');
    let userInfo = {};
    if (components.length == 2) {
        let params = components[1].split('&');
        for (let idx = 0; idx < params.length; idx++) {
            let info = params[idx].split('=');
            if (info.length > 0) {
                userInfo[info[0]] = info[1];
            }
        }
    }else {
        callback(new Error("url format error"),null);
    }
    callback(null,userInfo);
}

function loginRouter(userInfo) {
    return new Promise((resolve, reject) => {
        const username = userInfo['admin'] || 'admin';
        const password = userInfo['password'] || 'password';
        const ipAddress = userInfo["ip"];
        if (ipAddress !== undefined) {
            host = ipAddress;
        }
        const url = `http://${host}/cgi-bin/luci/;stok=/login?form=login`;
        const preReqData = { data: '{"method":"get"}' };
    
        requestPage(url, preReqData)
            .then((body) => {
                let params = JSON.parse(body).result.password;
                let encodedPassword = encrypt(password, params);
                let loginData = { data: `{"method":"login","params":{"username":"${username}","password":"${encodedPassword}"}}` };
                return requestPage(url, loginData);
            })
            .then((body) => {
                let stok = JSON.parse(body).result.stok;
                resolve(stok);
            })
            .catch((error) => {
                reject(error);
            });
    });
}

function listMacAddress(stok) {
    return new Promise((resolve, reject) => {
        if (stok != undefined && typeof stok === 'string') {
            const url = `http://${host}/cgi-bin/luci/;stok=${stok}/admin/wlan_station?form=stainfo`;
            const data = { data: '{"method":"get","params":{"key_idx":"-1"}}' };
            requestPage(url, data)
                .then((body) => {
                    let result = JSON.parse(body).result.sta_info;
                    if (result != undefined && typeof result === 'object') {
                        let filtedMAC = [];
                        for (let idx = 0; idx < result.length; idx++) {
                            filtedMAC.push(result[idx].sta_mac);
                        }
                        if (filtedMAC.length > 0) {
                            resolve(filtedMAC);
                        } else {
                            reject(new Error("not found any mac address")); 
                        }
                    } else {
                        reject(new Error("sta_info format error"));
                    }
                })
                .catch((err) => {
                    reject(err);
                });
        } else {
            reject(new Error('stok is undefined!'));
        }
    });
}

module.exports = {loginRouter, listMacAddress, parserURL};


