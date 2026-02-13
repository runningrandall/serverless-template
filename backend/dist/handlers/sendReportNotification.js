"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_ses_1 = require("@aws-sdk/client-ses");
const logger_1 = require("@aws-lambda-powertools/logger");
const logger = new logger_1.Logger({ serviceName: 'sendReportNotification' });
const ses = new client_ses_1.SESClient({});
const handler = async (event) => {
    logger.info('Received ReportCreated event', { event });
    const { reportId, description, locationDescription, location } = event.detail;
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
        await ses.send(new client_ses_1.SendEmailCommand({
            Source: senderEmail,
            Destination: { ToAddresses: [recipientEmail] },
            Message: {
                Subject: { Data: subject },
                Body: { Html: { Data: body } },
            },
        }));
        logger.info(`Email sent to ${recipientEmail} for report ${reportId}`);
    }
    catch (error) {
        logger.error('Failed to send email', { error });
        throw error;
    }
};
exports.handler = handler;
