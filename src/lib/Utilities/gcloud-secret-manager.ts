import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import * as dotenv from 'dotenv';

console.log('Environment:', process.env.NODE_ENV);
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const axios = require('axios');
const client = new SecretManagerServiceClient();

export async function GetProjectIdFromMetadata() {
    console.log('Environment inside:', process.env.NODE_ENV);
    if (process.env.NODE_ENV !== 'production') {
        return process.env.GCLOUD_PROJECT_ID || 'local-development';
    } else {
        try {
            const response = await axios.get(
                'http://metadata.google.internal/computeMetadata/v1/project/project-id',
                {
                    headers: { 'Metadata-Flavor': 'Google' },
                }
            );
            return response.data;
        } catch (error) {
            console.error(
                'Error fetching Project ID from metadata server:',
                error
            );
            return null;
        }
    }
}

export async function GetSecretValue(
    secretName: string
): Promise<string | undefined> {
    const projectId = await GetProjectIdFromMetadata();
    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;

    try {
        const [version] = await client.accessSecretVersion({ name });
        if (!version || !version.payload || !version.payload.data) {
            console.error('Secret version payload is empty.');
            return;
        }
        return version.payload.data.toString();
    } catch (error) {
        console.error('Failed to access secret:', error);
        return;
    }
}
