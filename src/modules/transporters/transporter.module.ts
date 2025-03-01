import { Injectable } from '@nestjs/common';
import * as twilio from 'twilio';
import * as nodemailer from 'nodemailer';
import { randomInt } from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class OtpService {
  private readonly twilioClient;
  private readonly emailTransporter;

  constructor() {
    // Initialize Twilio client
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );

    // Initialize Nodemailer transporter for email
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Method to generate OTP
  private generateOtp(): string {
    const otp = randomInt(100000, 999999).toString(); // Generate a 6-digit OTP
    return otp;
  }

  // Method to send OTP via SMS using Twilio
  async sendOtpToMobile(phoneNumber: string): Promise<string> {
    const otp = this.generateOtp();

    try {
      // Send OTP via SMS using Twilio
      await this.twilioClient.messages.create({
        body: `Your OTP is ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });

      return otp; // Return OTP to save it for verification
    } catch (error) {
      console.error('Error sending OTP via SMS', error);
      throw new Error('Failed to send OTP via SMS');
    }
  }

  // Method to send OTP via email using Nodemailer
  async sendOtpToEmail(email: string): Promise<string> {
    const otp = this.generateOtp();

    try {
      // Send OTP via email
      await this.emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP is ${otp}`,
        html: `<p>Your OTP is <strong>${otp}</strong></p>`,
      });

      return otp; // Return OTP to save it for verification
    } catch (error) {
      console.error('Error sending OTP via email', error);
      throw new Error('Failed to send OTP via email');
    }
  }

  // Method to generate and send OTP to both mobile and email
  async sendOtp(phoneNumber: string, email: string): Promise<{ otp: string }> {
    const otp = await this.sendOtpToMobile(phoneNumber);
    await this.sendOtpToEmail(email);

    // Store OTP in a cache, database, or memory for verification (with expiry)
    return { otp };
  }
}