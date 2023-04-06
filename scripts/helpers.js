import CustomFonts from "./custom-fonts.js";

/** Recursively browse for all font files (maximum of 50) in a directory including subdirectories (maximum of 50 levels deep)
 * @param {string} directory The directory to browse
 * @param {string} l The initial recursion level
 * @return {Promise<string[]>} All of the files in the directory and it's subdirectories
 */
export async function recursiveFontFileBrowse(directory, l = 0) {
	// Break if recursion limit has been reached
	if (l >= 50) return [];

	// Get the correct source. ForgeVTT may be defined in globalThis or window
	const source = directory.startsWith(globalThis?.ForgeVTT?.ASSETS_LIBRARY_URL_PREFIX || ForgeVTT?.ASSETS_LIBRARY_URL_PREFIX ) ? "forgevtt" : "data";

	// Try to get the files in that directory and source
	let res = {};
	try {
		res = await FilePicker.browse(source, directory);
		// Check if directory matches returned target or is included in files
		if (res?.target !== directory && !res?.files?.includes(directory)) {
			invalidDirectoryNotification(game.i18n.format("custom-fonts.notifications.invalidFilePickerTarget"));
			return [];
		}
	} catch (err) {
		invalidDirectoryNotification(err);
	}
	const files = res?.files
		// Only use files with valid file extensions
		.filter(file =>
			file
				.split("/")
				.at(-1)
				.match(/\.otf|\.ttf|\.woff|\.woff2/i, "")
		)
		// Only use the first 50
		.slice(0, 50);

	// Recurse if there are subdirectories
	if (res.dirs)
		for (const dir of res.dirs) {
			l++;
			files.push(...(await recursiveFontFileBrowse(dir, l)));
		}
	return files;
}

/** Run a function once the game is ready
 * @param {function} callback The function to run
 */
export function doOnceReady(callback) {
	if (game.ready) {
		callback();
	} else {
		Hooks.once("ready", callback);
	}
}

/** Send an invalid directory message
 * @param msg The message to send
 */
function invalidDirectoryNotification(msg) {
	doOnceReady(() => {
		const message = `${CustomFonts.ID} | ${game.i18n.format("custom-fonts.notifications.invalidDirectory", {
			error: msg,
		})}`;
		ui.notifications.warn(message);
		console.warn(message);
	});
}