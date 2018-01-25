const events = require('../../helper/helper.js').events;
var database  = require('../../helper/helper.js').database;
var transport = require('../../helper/connection.js');

var getUserReqType = require('./request.js').getRequestType;
var getResponseContent = require('./response.js').getResponseContent;

const userActionList = ['listen'];

var userListenersLogin = {};
var userListenersLogout = {};

module.exports = function(wss){ 

    wss.on('connection', function(ws) {
        
        var _id = false;

        var eventLogin = function(user) {

            database.find({ $where: function() { return (this.online && this._id != _id); } }, function (err, docs) {

                if(!docs)
                    docs = [];

                transport.response.send(
                    transport.response.createSuccess(
                        docs), 
                    ws);

            });
        }
        
        var eventLogout = function(user) {
            database.find({ $where: function() { return (this.online && this._id != _id); } }, function (err, docs) {
                transport.response.send(
                    transport.response.createSuccess(
                        docs), 
                    ws);
            });
        }
        
        ws.on('message', function(data, flag) {

            transport.request(data, flag, userActionList, true).then(
                (RequestHandler) => {
                    var content = RequestHandler.getRequest(getUserReqType("listen"));
                    if(!RequestHandler.hasErrors()){

                        switch(content.type) {
                            case 'listen':

                                _id = RequestHandler.getAuth().key;

                                userListenersLogin[_id] = eventLogin;
                                userListenersLogout[_id] = eventLogout;
                                
                                events.addListener('user.login', userListenersLogin[_id]);
                                events.addListener('user.logout', userListenersLogout[_id]);
                                
                                eventLogin();

                                break;
                        }
                    } else {
                        var error = RequestHandler.getFirstError();
                            transport.response.send(transport.response.createError(error), ws);
                    }
                },
                (error) => {
                    transport.response.send(transport.response.createError(error), ws);
                }
            );
                                
        });

        ws.on('close', function() {
            if(_id){
                events.removeListener('user.login',  userListenersLogin[_id]);
                events.removeListener('user.logout', userListenersLogout[_id]);

                _id = false;
            }
        });

        ws.on('error', function(e) {
            if(_id){
                events.removeListener('user.login',  userListenersLogin[_id]);
                events.removeListener('user.logout', userListenersLogout[_id]);

                _id = false;
            }
        });
        
    });
}; 