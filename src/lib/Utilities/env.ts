export function GetLineConfig() {
    let lineConfig: string = process.env.LINE_CONFIG?.toString();
    const config = JSON.parse(lineConfig);
}
