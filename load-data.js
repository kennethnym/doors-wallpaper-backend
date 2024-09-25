import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

cloudinary.api.resources_by_asset_folder("wallpaper", (error, result) => {
	if (error) {
		console.error(error);
		return;
	}

	const data = result.resources.map((res) => ({
		...res,
		thumbnail_url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/c_scale,w_300/${encodeURIComponent(res.public_id)}.${res.format}`,
	}));

	Bun.write("./data.json", JSON.stringify(data)).then(() => {
		console.log("Wallpaper data saved successfully.");
	});
});
