import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "./prisma";
import { sendEmail } from "../utils/sendEmail";
import { twoFactor } from "better-auth/plugins";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
  },
  socialProviders: {
    google: {
      prompt: "select_account consent",
      accessType: "offline",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days (session validity)
    updateAge: 60 * 60 * 24, // 1 day (session extends every day if user is active)
  },
  advanced: {
    defaultCookieAttributes: {
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      try {
        await sendEmail({
          to: user.email,
          subject: "Verify your email address - Blog App",
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f4f7f6;">
              <div style="background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
                <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 10px;">Verify Your Email</h1>
                <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                  Hello <strong>${user.name}</strong>,<br><br>
                  Welcome to our Blog App! Please confirm your email address by clicking the button below to complete your registration.
                </p>
                <a href="${url}" style="display: inline-block; background-color: #4F46E5; color: #ffffff; font-weight: 600; font-size: 16px; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  Verify Email Now
                </a>
                <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                  <p style="color: #a0aec0; font-size: 14px; margin: 0;">
                    If you didn't create an account, you can safely ignore this email.
                  </p>
                </div>
              </div>
            </div>
          `,
        });
      } catch (error) {
        console.error("Failed to send verification email:", error);
      }
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
        input: false,
      },
      phone: {
        type: "string",
        required: false,
      },
      address: {
        type: "string",
        required: false,
      },
    },
  },
  plugins: [
    twoFactor({
      issuer: "Blog App",
    }),
  ],
});
