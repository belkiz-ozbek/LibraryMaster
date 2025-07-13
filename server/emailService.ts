import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Email transporter oluştur
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail', // Gmail kullanıyoruz, diğer servisler de kullanılabilir
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Doğrulama token'ı oluştur
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Email doğrulama maili gönder
export async function sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Doğrulama - Kütüphane Yönetim Sistemi',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Kütüphane Yönetim Sistemi</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Email Doğrulama</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Merhaba ${name}!</h2>
          <p style="color: #666; line-height: 1.6;">
            Kütüphane Yönetim Sistemi'ne hoş geldiniz! Hesabınızı aktifleştirmek için aşağıdaki butona tıklayarak email adresinizi doğrulayın.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      display: inline-block; 
                      font-weight: bold;
                      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              Email Adresimi Doğrula
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            Eğer buton çalışmıyorsa, aşağıdaki linki tarayıcınıza kopyalayabilirsiniz:
          </p>
          <p style="color: #667eea; font-size: 14px; word-break: break-all;">
            ${verificationUrl}
          </p>
        </div>
        
        <div style="background: #e9ecef; padding: 20px; border-radius: 10px; text-align: center;">
          <p style="color: #6c757d; margin: 0; font-size: 14px;">
            Bu email Kütüphane Yönetim Sistemi tarafından gönderilmiştir.<br>
            Eğer bu işlemi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Email gönderilemedi');
  }
}

// Test email bağlantısı
export async function testEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('Email connection verified successfully');
    return true;
  } catch (error) {
    console.error('Email connection failed:', error);
    return false;
  }
} 