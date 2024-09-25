import express from "express";

const app = express();
const port = process.env.PORT || 8080;

app.get("/wallpapers", async (req, res) => {
	const dataFile = Bun.file("./data.json");
	const wallpaperData = await dataFile.json();
	return res.json(wallpaperData);
});

app.listen(port, () => {
	console.log(`Server running on ${port}`);
});
