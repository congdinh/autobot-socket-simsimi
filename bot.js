'use strict';
var io = require('socket.io-client');
var request = require('request');
 
// tokens
const GTH_TOKENS = [
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1aWQiOiIxNDA5MWQyNC0yYTEyLTRhYjMtYWFhMi03OGJmOTAyMzFlZjgiLCJ0eXBlIjoidXVpZCIsImlhdCI6MTQ4Mzg4NDAxOCwiZXhwIjoxNTQ0MzY0MDE4fQ.wLvql9TTxJthsgY3J5a-CxanpuzoYnb6Djc8BRwv1vs',
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1aWQiOiJkYWJiNTkzNS0wNjFiLTRhMjUtOWIwZC1lMGI3NTU4NTdkZTciLCJ0eXBlIjoidXVpZCIsImlhdCI6MTQ4Mzg0OTQ2MSwiZXhwIjoxNTQ0MzI5NDYxfQ.43eye2upYwvETz4OBw8J7WvgzViIr60TeskogPN8U90',
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1aWQiOiI3YWQ0NzliZi0zZWFhLTQ1NmMtODk4MC1mNTFjOGU1Y2Q5ZmYiLCJ0eXBlIjoidXVpZCIsImlhdCI6MTQ4MzgwMzExOCwiZXhwIjoxNTQ0MjgzMTE4fQ.nj2YHnovWqYZfQN58Tipd8AXg0gyIdKIyTeMnjjek60',
];
 
const SIM_TOKENS = [
    'kmxDDsaKouj2MVs6SGCtueywvo5Cs9Q29Jtod5inUTl',
    'UwmPMKoqosEETKleXWGOJ6lynN1TQq18wwvrmCy6IRt',
    '8ACtyn1WIRLFvpzhNC6P00QS4sfiqXRa4fz7pbacy23'
];
 
// url
const GTH_SOCKET_URL = 'http://socket.url';
const SIMSIMI_REQ_URL = 'http://www.simsimi.com/getRealtimeReq';
 
// chat class
class GthChat{
    startChat(){
        this.socket = io(GTH_SOCKET_URL, {
            query: `token=${this.gth_token}`,
            extraHeaders: {
                Origin: 'http://chat.bot.org'
            }
        });
        // on connect
        this.socket.on('connect', () => {
            console.log(`${this.name} connected`);
            this.newChat();
        });
        // new chat
        this.socket.on('new chat', (data) => {
            this.socket.emit('welcome', {"job": 0, "rp": 0, "csl": 8});
        });
        // online user
        this.socket.on('online user', (data) => {
            console.log(`${data} users are online`);
        });
        // welcome
        this.socket.on('welcome', (data) => {
            console.log(`Matched with ${JSON.stringify(data)}`);
            // if more than 2 report, 90% we quit
            if (data.rp > 2 && Math.random() < 0.9){
                this.closeChatWithDelay(2000);
            }
            else if (data.rp > 1 && Math.random() < 0.7) {
                this.closeChatWithDelay(2000);
            }
            else {
                // 70% we send Hi first
                this.sendMessage('Hi', 0.7);
            }
        });
        // show message when disconnect
        this.socket.on('disconnect', () => {
            console.log(`Disconnected`);
            console.log(`-------------------`);
            console.log(`|      ====       |`);
            console.log(`-------------------`);
        });
        // on receive message
        this.socket.on('chat message', (data) => {
            console.log(`From ${this.name}: ${data}`);
            // bot typing
            this.socket.emit('typing message', true);
            // find reply on simsimi
            request({
                url: SIMSIMI_REQ_URL,
                qs: {
                    uuid: this.sim_token,
                    lc: 'vn',
                    ft: 1,
                    status: 'W',
                    reqText: data
                },
                method: 'GET'
            }, (error, response, body) => {
                    // don't know how to answer, just stop typing
                    if (error || body.indexOf("502 Bad Gateway") > 0 || body.indexOf("respSentence") < 0) {
                        this.socket.emit('typing message', false);
                        return;
                    }
                   
                    let text = JSON.parse(body);
                    if (text.status == "200"){
                        // delay chat like a boss :)
                        let delay = 100 + text.respSentence.length * (1.5 + Math.random()) * 50;
                        this.sendMessageWithDelay(text.respSentence, delay);
                    }
                });
        });
        // show when client typing
        this.socket.on('client typing', (data) => {
            if (data){
                console.log(`${this.name} is typing`)
            }
        });
        // show when chat is close
        this.socket.on('close chat', () => {
            console.log(`${this.name} closed`);
            console.log(`-------------------`);
            console.log(`|      ====       |`);
            console.log(`-------------------`);
            this.newChat();
        });
    }
 
    constructor(name, gth_token, sim_token) {
        this.name = name;
        this.gth_token = gth_token;
        this.sim_token = sim_token;
    }
 
    newChat() {
        // gender, job, target
        this.socket.emit('new chat', [0, 0, 0]);
    }
 
    // send message from socket. If prob is a number, send with that probability
    sendMessage(data, prob) {
        // stop typing
        this.socket.emit('typing message', false);
        // check probability
        if (isNaN(prob) || (Math.random() < prob)) {
            console.log(`To ${this.name}: ${data}`);
            this.socket.emit('chat message', data);
        }          
    }
 
    // send message with delay
    sendMessageWithDelay(data, delay) {
        setTimeout((_this, data) => {
            _this.sendMessage(data);
        }, delay, this, data);
    }
 
    // close chat
    closeChat() {
        this.socket.emit('close chat');
        console.log(`Bot closed`);
        this.newChat();
    }
 
    // close chat with delay
    closeChatWithDelay(delay) {
        setTimeout((_this) => {
            _this.closeChat();
        }, delay, this);
    }
}
 
// create and start chat
let chat = new GthChat("A", GTH_TOKENS[1], SIM_TOKENS[1]);
chat.startChat();
