import type { Appointment, User, Vendor } from '../types/database';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';

const MAILGUN_API_KEY = '4573175144a542dfd9c9ad28e304c01b-e298dd8e-b75a04bc';
const MAILGUN_DOMAIN = 'bilo.fi';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

async function sendEmail({ to, subject, html, from = 'Bilo <noreplay@bilo.fi>' }: EmailOptions) {
  try {
    const response = await fetch(`https://api.eu.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        from,
        to,
        subject,
        html
      })
    });

    if (!response.ok) {
      throw new Error(`Mailgun API error: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Email templates
function getAppointmentConfirmationTemplate(appointment: Appointment, vendor: Vendor, serviceName: string) {
  const appointmentDate = appointment.date instanceof Date 
    ? appointment.date 
    : new Date(appointment.date.seconds * 1000);

  return `
    <h2>Varaus vahvistettu</h2>
    <p>Hei ${appointment.customerDetails.firstName},</p>
    <p>Varauksesi on vahvistettu:</p>
    <ul>
      <li>Palvelu: ${serviceName}</li>
      <li>Päivämäärä: ${format(appointmentDate, "d.M.yyyy 'klo' HH:mm", { locale: fi })}</li>
      <li>Yritys: ${vendor.businessName}</li>
      <li>Osoite: ${vendor.address}</li>
      <li>Hinta: ${appointment.totalPrice}€</li>
    </ul>
  `;
}

function getAppointmentReminderTemplate(appointment: Appointment, vendor: Vendor, serviceName: string) {
  const appointmentDate = appointment.date instanceof Date 
    ? appointment.date 
    : new Date(appointment.date.seconds * 1000);

  return `
    <h2>Muistutus huomisesta varauksesta</h2>
    <p>Hei ${appointment.customerDetails.firstName},</p>
    <p>Muistathan huomisen varauksesi:</p>
    <ul>
      <li>Palvelu: ${serviceName}</li>
      <li>Päivämäärä: ${format(appointmentDate, "d.M.yyyy 'klo' HH:mm", { locale: fi })}</li>
      <li>Yritys: ${vendor.businessName}</li>
      <li>Osoite: ${vendor.address}</li>
    </ul>
  `;
}

function getWelcomeEmailTemplate(user: User) {
  return `
    <h2>Tervetuloa Biloon!</h2>
    <p>Hei ${user.firstName || 'käyttäjä'},</p>
    <p>Kiitos rekisteröitymisestäsi. Olemme antaneet sinulle 10 kolikkoa tervetuliaislahjana.</p>
    <p>Voit käyttää kolikoita alennuksiin varatessasi palveluita.</p>
  `;
}

// Email sending functions
export async function sendAppointmentConfirmation(appointment: Appointment, vendor: Vendor) {
  try {
    const html = getAppointmentConfirmationTemplate(appointment, vendor, appointment.serviceName || 'Palvelu');
    return sendEmail({
      to: appointment.customerDetails.email,
      subject: 'Varauksesi on vahvistettu',
      html
    });
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return false;
  }
}

export async function sendAppointmentReminder(appointment: Appointment, vendor: Vendor) {
  try {
    const html = getAppointmentReminderTemplate(appointment, vendor, appointment.serviceName || 'Palvelu');
    return sendEmail({
      to: appointment.customerDetails.email,
      subject: 'Muistutus huomisesta varauksesta',
      html
    });
  } catch (error) {
    console.error('Error sending reminder email:', error);
    return false;
  }
}

export async function sendWelcomeEmail(user: User) {
  try {
    return sendEmail({
      to: user.email,
      subject: 'Tervetuloa Biloon',
      html: getWelcomeEmailTemplate(user)
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

export async function sendVendorNotification(vendor: Vendor, subject: string, message: string) {
  try {
    return sendEmail({
      to: vendor.email,
      subject,
      html: `<p>${message}</p>`
    });
  } catch (error) {
    console.error('Error sending vendor notification:', error);
    return false;
  }
}
