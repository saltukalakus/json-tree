var express = require('express');
app = express();

function defaultData() {
    return {
            key1: 'str',
            key2: 12.34,
            key3: null,
            array: [3, 1, 2],
            object: {
                anotheObject: {
                    key1: 1,
                    bool: true
                }
            },
            arrayOfObjects: [
                {
                    dataFromFunction: new funcData(),
                    key1: 'Hello World!'
                },
                {
                    bool: true,
                    someFunction: function () {
                        /* not editable */
                        return 'some function'
                    }
                }
            ],
            key4: undefined
        };
}

function funcData(){
    return {
        fullname: {
            first: 'json',
            last: 'tree'
        },
        version : "1.0.1"
    }
};

app.get('/api', function(req, res) {
    res.send(JSON.stringify(defaultData()));
    res.end();
});

app.use(express.static(__dirname + '/public'));

app.listen('8082');