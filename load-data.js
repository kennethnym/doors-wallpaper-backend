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
	await s.resize(400).toFile(join(cwd, "wallpapers", `thumbnail_${fileName}`));
}

async function pullPanelsContent(allData) {
	const contentFile = Bun.file("./panels-content.json");
	const content = await contentFile.json();

	try {
		const res = await fetch(
			"https://storage.googleapis.com/panels-api/data/20240916/media-1a-i-p~uhd",
		);
		if (res.status !== 200) {
			return;
		}

		const media = await res.json();

		for (const wallpaper of content.wallpapers) {
			const { hd: id, w: width, h: height } = wallpaper.dlm;
			const artistId = wallpaper.artistId;
			const artist = content.artists.find((a) => a.id === artistId);
			if (!artist) continue;

			const urls = media.data[`${id}`];
			if ("dhd" in urls && "dsd" in urls) {
				const dhdUrl = new URL(urls.dhd);
				allData.push({
					width,
					height,
					public_id: `${id}`,
					format: extname(dhdUrl.pathname),
					display_name: wallpaper.label || "",
					secure_url: urls.dhd,
					thumbnail_url: urls.dsd,
					is_ai_generated: false,
					creator_name: artist.label,
					source_url: "https://panels.art",
				});
			}
		}
	} catch (err) {
		console.warn("unable to pull from panels", err);
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
	const promises = [pullPanelsContent(allData)];
	for (const wallpaper of wallpapers) {
		const s = sharp(join(cwd, "wallpapers", wallpaper));
		promises.push(
			Promise.all([
				obtainWallpaperData(s, wallpaper, metadata, allData),
				generateThumbnail(s, wallpaper),
			]),
		);
	}

	await Promise.all(promises);

	Bun.write("./data.json", JSON.stringify(allData)).then(() => {
		console.log("Wallpaper data saved successfully.");
	});
} catch (error) {
	console.error(error);
}
