import { readdir, mkdir } from "node:fs/promises";
import { join, basename, extname } from "node:path";
import sharp from "sharp";

const cwd = process.cwd();

async function obtainWallpaperData(s, fileName, credits, allData) {
	const imgMetadata = await s.metadata();
	const id = basename(fileName).replace(extname(fileName), "");
	const creditMetadata = credits[id];
	allData.push({
		public_id: id,
		format: imgMetadata.format ?? "",
		width: imgMetadata.width ?? 0,
		height: imgMetadata.height ?? 0,
		display_name: fileName,
		secure_url: `${process.env.BASE_URL}/wallpapers/${fileName}`,
		thumbnail_url: `${process.env.BASE_URL}/wallpapers/thumbnail_${fileName}`,
		...(creditMetadata ?? {}),
	});
}

async function generateThumbnail(s, fileName) {
	try {
		await s
			.resize(400)
			.toFile(join(cwd, "wallpapers", `thumbnail_${fileName}`));
	} catch (error) {
		console.warn(`failed to generate thumbnail for ${fileName}: ${error}`);
	}
}

try {
	await mkdir("./wallpapers", { recursive: true });
	const wallpapers = (await readdir("./wallpapers")).filter(
		(p) => !p.startsWith("thumbnail_"),
	);

	const metadataFile = Bun.file("./metadata.json");
	const metadata = await metadataFile.json();

	const allData = [];
	const promises = [];
	for (const wallpaper of wallpapers) {
		const s = sharp(join(cwd, "wallpapers", wallpaper));
		promises.push(
			Promise.all([
				obtainWallpaperData(s, wallpaper, metadata, allData),
				generateThumbnail(s, wallpaper),
			]),
		);
	}

	await Promise.allSettled(promises);

	Bun.write("./data.json", JSON.stringify(allData)).then(() => {
		console.log("Wallpaper data saved successfully.");
	});
} catch (error) {
	console.error(error);
}
