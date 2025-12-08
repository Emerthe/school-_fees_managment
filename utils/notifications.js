/**
 * Notification utility for CI/CD feedback (email and Slack)
 */


const nodemailer = require('nodemailer');

/**
 * Send email notification for CI build result
 * @param {string} recipientEmail - email address to send to
 * @param {object} config - { emailUser, emailPass, emailHost, status, repo, ref, sha }
 */
async function sendEmailNotification(recipientEmail, config) {
  const {
    emailUser,
    emailPass,
    emailHost = 'smtp.gmail.com',
    status = 'unknown',
    repo = 'unknown',
    ref = 'unknown',
    sha = 'unknown',
  } = config;

  if (!emailUser || !emailPass || !recipientEmail) {
    console.log('Email notification skipped: missing credentials or recipient');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: 587,
      secure: false,
      auth: { user: emailUser, pass: emailPass },
    });

    const statusEmoji = status === 'success' ? '✅' : '❌';
    const subject = `${statusEmoji} CI Build ${status.toUpperCase()} - ${repo}`;
    const html = `
      <h2>${statusEmoji} Build Status: <strong>${status.toUpperCase()}</strong></h2>
      <p><strong>Repository:</strong> ${repo}</p>
      <p><strong>Branch:</strong> ${ref}</p>
      <p><strong>Commit:</strong> <code>${sha.substring(0, 8)}</code></p>
      <p>View the full build log on GitHub Actions.</p>
    `;

    const info = await transporter.sendMail({
      from: emailUser,
      to: recipientEmail,
      subject,
      html,
    });

    console.log('Email notification sent:', info.messageId);
  } catch (err) {
    console.error('Error sending email notification:', err.message);
  }
}

/**
 * Send Slack notification via webhook
 * @param {string} webhookUrl - Slack webhook URL
 * @param {object} config - { status, repo, ref, sha }
 */
async function sendSlackNotification(webhookUrl, config) {
  const { status = 'unknown', repo = 'unknown', ref = 'unknown', sha = 'unknown' } = config;

  if (!webhookUrl) {
    console.log('Slack notification skipped: no webhook configured');
    return;
  }

  try {
    const color = status === 'success' ? 'good' : 'danger';
    const payload = {
      attachments: [
        {
          color,
          title: `CI Build ${status.toUpperCase()}`,
          title_link: `https://github.com/${repo}/actions`,
          fields: [
            { title: 'Repository', value: repo, short: true },
            { title: 'Branch', value: ref, short: true },
            { title: 'Commit', value: sha.substring(0, 8), short: true },
            { title: 'Status', value: status, short: true },
          ],
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log('Slack notification sent successfully');
    } else {
      console.error('Failed to send Slack notification:', response.statusText);
    }
  } catch (err) {
    console.error('Error sending Slack notification:', err.message);
  }
}

module.exports = { sendEmailNotification, sendSlackNotification };
