export class SystemUtils {
	public static sleep(milliseconds: number) {
		return new Promise(resolve => {
			setTimeout(resolve, milliseconds);
		});
	}
}
