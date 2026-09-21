const axios = require('axios');
const zlib = require('zlib')

async function capcut(url) {
    const headers = {
        'Host': '3bic.com',
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Origin': 'https://3bic.com',
        'Referer': 'https://3bic.com/',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
    };

    const payload = { url };

    const res = await axios.post('https://3bic.com/api/download', payload, {
        headers,
        responseType: 'arraybuffer',
        decompress: false
    });

    let data = res.data;
    const encoding = res.headers['content-encoding'];

    if (encoding === 'br') {
        data = zlib.brotliDecompressSync(data);
    } else if (encoding === 'gzip') {
        data = zlib.gunzipSync(data);
    } else if (encoding === 'deflate') {
        data = zlib.inflateSync(data);
    }

    const json = JSON.parse(data.toString());

    if (json.originalVideoUrl && json.originalVideoUrl.startsWith('/')) {
        json.originalVideoUrl = 'https://3bic.com' + json.originalVideoUrl;
    }
    if (json.originalAudioUrl && json.originalAudioUrl.startsWith('/')) {
        json.originalAudioUrl = 'https://3bic.com' + json.originalAudioUrl;
    }

    return json;
}

module.exports = function(app) {
  app.get("/download/capcut", async (req, res) => {
    const url = req.query.url;

    if (!url)
      return res.status(400).json({ status: false, error: "Url is required" });

    try {
      const result = await capcut(url);
      res.status(200).json({ status: true, result });
    } catch (e) {
      res.status(500).json({ status: false, error: e.message });
    }
  });
};