var express = require('express');
var app = express();
app.use('/', express.static(__dirname + '/')); // ← adjust
app.listen(3000, (
    res
) => console.log('Listening on port 3000!',res));

