import { ILineConfig } from '../../models/LINE/ILineConfig';
import { ITmdConfig } from '../../models/weather-warning/ITmdConfig';

export function GetLineConfig(): ILineConfig {
    let lineConfig: string = process.env.LINE_CONFIG?.toString() ?? '';
    if (lineConfig === '')
        throw new Error('LINE_CONFIG environment variable is not defined');

    try {
        const config: ILineConfig = JSON.parse(lineConfig);
        return config;
    } catch (error: any) {
        throw new Error(
            'Failed to parse LINE_CONFIG environment variable: ' + error.message
        );
    }
}

export function GetTmdConfig() {
    let tmdConfig: string = process.env.TMD_CONFIG?.toString() ?? '';
    if (tmdConfig === '')
        throw new Error('TMD_CONFIG environment variable is not defined');

    try {
        const config: ITmdConfig = JSON.parse(tmdConfig);
        return config;
    } catch (error: any) {
        throw new Error(
            'Failed to parse TMD_CONFIG environment variable: ' + error.message
        );
    }
}
