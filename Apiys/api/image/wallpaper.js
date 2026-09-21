const fetch = require("node-fetch");

async function pinterest(query) {
    try {
        let encodedQuery = encodeURIComponent(query);
        let url = `https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D${encodedQuery}&data=%7B%22options%22%3A%7B%22isPrefetch%22%3Afalse%2C%22query%22%3A%22${encodedQuery}%22%2C%22scope%22%3A%22pins%22%2C%22no_fetch_context_on_resource%22%3Afalse%7D%2C%22context%22%3A%7B%7D%7D&_=1619980301559`;

        let res = await fetch(url, {
            headers: {
                "accept": "application/json, text/javascript, */*, q=0.01",
                "x-pinterest-pws-handler": "www/search/[scope].js",
                "Referer": "https://id.pinterest.com/"
            }
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        let json = await res.json();
        let data = json.resource_response?.data?.results;

        if (!data || !data.length) throw new Error(`Query "${query}" not found`);

        const images = data.map(v => {
            const uploadDate = new Date(v.created_at);
            return {
                id: v.id || "data tidak terbaca",
                title: v.title || "data tidak terbaca",
                upload: uploadDate.toDateString(),
                time: uploadDate.toTimeString().split(' ')[0],
                desc: v.description || "data tidak terbaca",
                img: v.images?.orig?.url || "data tidak terbaca",
                url: `https://id.pinterest.com/pin/${v.id}/`
            };
        });

        return {
            status: true,
            result: images
        };
    } catch (error) {
        return {
            status: false,
            error: error.message
        };
    }
}

module.exports = function(app) {

    app.get("/image/wallpaper", async (req, res) => {
        try {
            const keyword = req.query.q || "wallpaper aesthetic";

            const data = await pinterest(keyword);

            if (!data.status) throw new Error(data.error);
            if (!data.result.length) throw new Error("Tidak ada wallpaper ditemukan");

            const validImages = data.result.filter(
                v => v.img && v.img !== "data tidak terbaca"
            );

            if (!validImages.length) throw new Error("Tidak ada wallpaper valid");

            const randomImage = validImages[Math.floor(Math.random() * validImages.length)];

            const imageRes = await fetch(randomImage.img);
            if (!imageRes.ok) throw new Error(`Gagal fetch gambar: ${imageRes.status}`);

            const arrayBuffer = await imageRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const contentType = imageRes.headers.get("content-type") || "image/jpeg";

            res.writeHead(200, {
                "Content-Type": contentType,
                "Content-Length": buffer.length,
                "Cache-Control": "no-cache, no-store, must-revalidate"
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