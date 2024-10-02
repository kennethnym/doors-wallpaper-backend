import express from "express";
import https from "node:https";

const app = express();
const port = process.env.PORT || 8080;

app.use("/wallpapers", express.static("wallpapers"));

app.get("/wallpapers", async (req, res) => {
	const dataFile = Bun.file("./data.json");
	const wallpaperData = await dataFile.json();
	return res.json(wallpaperData);
});

if (process.env.NO_SSL) {
	app.listen(port, () => {
		console.log(`Server running on ${port}`);
	});
} else {
	const keyFile = Bun.file("./server.key");
	const certFile = Bun.file("./server.cert");
	const key = await keyFile.text();
	const cert = await certFile.text();
	https.createServer({ key, cert }, app).listen(port, () => {
		console.log(`Server running on ${port}`);
	});
}
