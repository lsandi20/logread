const http = require('http');

const findTimeStamp = require('./findTimeStamp')


const app = function (req, res) {
  const { url, headers, method } = req;
  console.log(`${method} http://${headers.host}${url}`) // log received request
  let parsedurl = new URL(url, `http://${headers.host}`)
  let timestamp = parsedurl.searchParams.get('timestamp') // get timestamp from query string

  if (!timestamp || isNaN(Date.parse(timestamp))) { // response if timestamp not provided or invalid
    res.setHeader('Content-Type', 'application/json')
    res.write(JSON.stringify({ message: 'Timestamp is not provided or invalid' }))
    res.end()
  }
  else {
    findTimeStamp(timestamp, res) // call function to find timestamp in log
  }
}

const server = http.createServer(app);
console.log('Listening on port 5000')
server.listen(5000)