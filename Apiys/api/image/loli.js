const axios = require("axios");

module.exports = function(app) {

    async function loliArchive() {
        try {
            let res = await fetch("https://nekos.best/api/v2/search?query=loli&type=1");
            let mwdia = await res.json();
            let imageUrl = mwdia.results[0].url;

            // Ambil gambar sebagai ArrayBuffer
            let imageRes = await fetch(imageUrl);
            let arrayBuffer = await imageRes.arrayBuffer();
            let buffer = Buffer.from(arrayBuffer);

            return buffer;
        } catch (error) {
            throw error;
        }
    }

    app.get("/image/loli", async (req, res) => {
        try {
            const buffer = await loliArchive();
            res.writeHead(200, {
                "Content-Type": "image/png",
                "Content-Length": buffer.length
            });
            res.end(buffer);
        } catch (error) {
            res.status(500).json({
                status: false,
                message: error.message
            });
        }
    });

};