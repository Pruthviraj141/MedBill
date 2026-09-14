const http = require('https');
http.get('https://cafe-pos-api.pruthvigavhane.workers.dev/api/sync/orders?last_sync=1970-01-01T00:00:00.000Z', (res) => {
  let chunks = '';
  res.on('data', (d) => chunks += d);
  res.on('end', () => console.log('Length:', chunks.length));
}).on('error', (e) => console.error(e));
