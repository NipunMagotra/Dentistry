import { AppointmentReminderData } from '../types'

/**
 * Renders HTML and Plain-Text templates for appointment reminders with multi-tenant branding support.
 */
export function renderAppointmentReminderEmail(data: AppointmentReminderData): {
  subject: string
  html: string
  text: string
} {
  const subject = `Appointment Reminder – ${data.clinicName}`

  const clinicPhoneSection = data.clinicPhone
    ? `<p style="margin: 4px 0 0 0; color: #4b5563; font-size: 14px;"><strong>Phone:</strong> ${data.clinicPhone}</p>`
    : ''

  const clinicAddressSection = data.clinicAddress
    ? `<p style="margin: 4px 0 0 0; color: #4b5563; font-size: 14px;"><strong>Address:</strong> ${data.clinicAddress}</p>`
    : ''

  const logoHeader = data.clinicLogoUrl
    ? `<img src="${data.clinicLogoUrl}" alt="${data.clinicName} Logo" style="max-height: 50px; margin-bottom: 16px; border-radius: 8px;" />`
    : ''

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #e5e7eb;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 32px; text-align: center; color: #ffffff;">
              ${logoHeader}
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Appointment Reminder</h1>
              <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.9;">${data.clinicName}</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px; color: #1f2937;">
              <p style="font-size: 16px; margin: 0 0 20px 0; color: #374151;">
                Hello <strong>${data.patientName}</strong>,
              </p>
              <p style="font-size: 15px; margin: 0 0 24px 0; color: #4b5563; line-height: 1.6;">
                This is a friendly reminder about your upcoming appointment with <strong>${data.clinicName}</strong>.
              </p>

              <!-- Appointment Details Card -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
                <tr>
                  <td>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0369a1; letter-spacing: 0.5px;">Doctor</span>
                          <div style="font-size: 16px; font-weight: 600; color: #0c4a6e; margin-top: 2px;">${data.doctorName}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0369a1; letter-spacing: 0.5px;">Date</span>
                          <div style="font-size: 16px; font-weight: 600; color: #0c4a6e; margin-top: 2px;">${data.appointmentDate}</div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0369a1; letter-spacing: 0.5px;">Time</span>
                          <div style="font-size: 16px; font-weight: 600; color: #0c4a6e; margin-top: 2px;">${data.appointmentTime}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Notice & Contact Info -->
              <p style="font-size: 14px; margin: 0 0 16px 0; color: #6b7280; line-height: 1.5;">
                If you need to reschedule or have any questions, please contact the clinic directly.
              </p>

              ${clinicPhoneSection || clinicAddressSection ? `
              <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 20px;">
                <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Clinic Contact Info</p>
                ${clinicPhoneSection}
                ${clinicAddressSection}
              </div>
              ` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 13px;">
              Thank you for choosing <strong>${data.clinicName}</strong>.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  const text = `
Hello ${data.patientName},

This is a friendly reminder about your upcoming appointment.

Clinic:
${data.clinicName}

Doctor:
${data.doctorName}

Date:
${data.appointmentDate}

Time:
${data.appointmentTime}

${data.clinicPhone ? `Phone: ${data.clinicPhone}\n` : ''}${data.clinicAddress ? `Address: ${data.clinicAddress}\n` : ''}
If you need to reschedule, please contact the clinic.

Thank you,
${data.clinicName}
  `.trim()

  return { subject, html, text }
}
