import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import * as dotenv from 'dotenv';

dotenv.config();

const client = new SecretManagerServiceClient();

export async function GetSecretValue(
    secretName: string
): Promise<string | undefined> {
    const projectId = process.env.GCP_PROJECT_ID;
    if (!projectId) {
        console.error('GCP_PROJECT_ID environment variable is not set.');
        return;
    }

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
