const fs = require('fs');
const { Buffer } = require('buffer')


function findTimeStamp(ts, res) {
  fs.open('./log.txt', (err, fd) => {
    let target = new Date(ts)
    let found = false;
    fs.fstat(fd, async (err, stats) => {
      let outputBuffer = Buffer.alloc(256) // 256 is maximum line length
      let size = stats.size
      // search for timestamp using binary search
      readTimeStamp(target, fd, outputBuffer, 24, size, Math.floor(size / 2), size, 0, res)

    })
  })
}

function readTimeStamp(target, fd, outputBuffer, length, previouscursor, currentcursor, size, countrecursion, res) {
  // if too many recursion occur in this case, assume not found and exit
  if (countrecursion > 3) {
    res.setHeader('Content-Type', 'application/json')
    res.write(JSON.stringify(
      {
        message: 'Timestamp not found'
      }
    ))
    res.end()
    return;
  }

  // check if cursor position near or hit EOF and allocate more bytes to read
  if ((size - currentcursor) < 256) {
    currentcursor = size - 256
    length = 256
  }

  // check if cursor position at beginning of file and allocate more bytes to read
  if (currentcursor <= 0) {
    currentcursor = 0
    length = 256
    previouscursor = 256
    countrecursion++
  }

  // check if cursor almost reach target and allocate more bytes to read 
  if (Math.abs(previouscursor - currentcursor) < 256) {
    length = 256
  }

  // check if last and current cursor are same
  if (previouscursor === currentcursor) {
    // add the countrecursion and give more chance to search by doubling previouscursor
    countrecursion++;
    previouscursor = previouscursor * 2
  }

  //read the file
  fs.read(fd, outputBuffer, 0, length, currentcursor, (err, bytesRead, buffer) => {

    // handle when timestamp found
    if (buffer.includes(target.toISOString())) {
      fs.read(fd, outputBuffer, 0, length, currentcursor + buffer.indexOf(target.toISOString()), (err, bytesRead, buffer) => {
        const log = buffer.slice(25, buffer.indexOf(10)).toString()
        res.setHeader('Content-Type', 'application/json')
        res.write(JSON.stringify(
          {
            timestamp: target,
            log
          }
        ))
        res.end()
        return;
      })
      return;

    }



    // check if current buffer contain timestamp or not , assumption: the year is in 21st century
    if (!(buffer[0] === 50 && buffer[23] === 90)) {
      // iterate until a timestamp is readed
      readTimeStamp(target, fd, outputBuffer, length, previouscursor, currentcursor - 1, size, countrecursion, res)
    } else {


      let buffertimestamp = new Date(buffer.slice(0, 24).toString())
      if (target < buffertimestamp) {

        readTimeStamp(target, fd, outputBuffer, length, currentcursor, (currentcursor - Math.floor(Math.abs(previouscursor - currentcursor) / 2)), size, countrecursion, res)
      }

      if (target > buffertimestamp) {
        readTimeStamp(target, fd, outputBuffer, length, currentcursor, (currentcursor + Math.floor(Math.abs(previouscursor - currentcursor) / 2)), size, countrecursion, res)
      }
    }


  })
}


module.exports = findTimeStamp;