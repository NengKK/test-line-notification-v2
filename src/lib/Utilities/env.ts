import { ILineConfig } from '../../models/LINE/ILineConfig';
import { ITmdConfig } from '../../models/weather-warning/ITmdConfig';
import { GetSecretValue } from './gcloud-secret-manager';

export async function GetLineConfig(): Promise<ILineConfig> {
    let lineConfig: string = '';
    try {
        lineConfig = (await GetSecretValue('LINE_CONFIG')) || '';
    } catch (error: any) {
        throw new Error(
            'Failed to get LINE_CONFIG from Secret Manager: ' + error.message
        );
    }

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

export async function GetTmdConfig() {
    const tmdConfig = await GetSecretValue('TMD_CONFIG');
    if (!tmdConfig) throw new Error('TMD_CONFIG secret is not defined');

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
