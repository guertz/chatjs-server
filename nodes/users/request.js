var requestTypes = {
    listen: {
        type: ""
    }
}

module.exports = {
    getRequestType: function(type) {
        return Object.assign({}, requestTypes[type]);
    }
}