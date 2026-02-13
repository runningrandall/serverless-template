import { EventBridgeEvent } from 'aws-lambda';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'sendReportNotification' });
const ses = new SESClient({});

interface ReportCreatedDetail {
    reportId: string;
    senderEmail: string; // The email of the person who created the report (if captured)
    description?: string;
    imageUrls?: string[];
    location?: string;
}

export const handler = async (event: EventBridgeEvent<'ReportCreated', ReportCreatedDetail>): Promise<void> => {
    logger.info('Received ReportCreated event', { event });

    const { reportId, description, locationDescription, location } = event.detail as any;
    const adminUrl = `${process.env.FRONTEND_URL}/admin/reports/details?id=${reportId}`;
    const senderEmail = process.env.SENDER_EMAIL; // The email address to send FROM (must be verified in SES)
    const recipientEmail = process.env.RECIPIENT_EMAIL; // The admin email to send TO

    if (!senderEmail || !recipientEmail) {
        logger.error('Missing SENDER_EMAIL or RECIPIENT_EMAIL environment variables');
        throw new Error('Missing email configuration');
    }

    const locationString = location ? `${location.lat}, ${location.lng}` : 'N/A';
    const locDesc = locationDescription || 'N/A';

    const subject = `New Report Created: ${reportId}`;
    const body = `
    <h1>New Report Received</h1>
    <p><strong>Report ID:</strong> ${reportId}</p>
    <p><strong>Description:</strong> ${description || 'N/A'}</p>
    <p><strong>Location Description:</strong> ${locDesc}</p>
    <p><strong>Coordinates:</strong> ${locationString}</p>
    <p><a href="${adminUrl}">View Report in Admin Console</a></p>
  `;

    try {
        await ses.send(new SendEmailCommand({
            Source: senderEmail,
            Destination: { ToAddresses: [recipientEmail] },
            Message: {
                Subject: { Data: subject },
                Body: { Html: { Data: body } },
            },
        }));
        logger.info(`Email sent to ${recipientEmail} for report ${reportId}`);
    } catch (error) {
        logger.error('Failed to send email', { error });
        throw error;
    }
};
