import express from "express";
import { v2 as cloudinary } from "cloudinary";

const app = express();
const port = 8080;

cloudinary.config({
	cloud_name: "duyynotn0",
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.get("/wallpapers", async (req, res) => {
	cloudinary.api.resources_by_asset_folder("wallpaper", (error, result) => {
		res.json(result.resources);
	});
});

app.listen(port, () => {
	console.log(`Server running on ${port}`);
});
