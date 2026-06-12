import { Resend } from 'resend';

const resend = new Resend('***');

async function testEmail() {
  try {
    const result = await resend.emails.send({
      from: 'Fardanista <noreply@fardanista.com>',
      to: 'ahmadfardan464@gmail.com',
      subject: '🎉 Test Email dari Payment Gateway',
      html: `
        <h2>Payment Gateway Test</h2>
        <p>Ini test email dari payment gateway setup.</p>
        <p>Resend API key valid dan bisa kirim email! 🎉</p>
      `
    });
    
    console.log('Email sent! ID:', result.id);
    return result;
  } catch (err) {
    console.error('Email failed:', err.message);
    throw err;
  }
}

testEmail();
