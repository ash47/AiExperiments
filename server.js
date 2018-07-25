const express = require('express')
const app = express()

const hostedDir = '/AiExperiments/';

app.get('/', function(req, res) {
	res.redirect(hostedDir);
});

app.use(hostedDir, express.static(__dirname))

const port = 80;
app.listen(port, () => console.log('Example app listening on port ' + port + '!'));
