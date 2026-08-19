import { prisma } from "../lib/prisma";

async function seedAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL as string;
    const adminPassword = process.env.ADMIN_PASSWORD as string;

    console.log(
      "Calling sign-up API to ensure proper hashing via Better Auth...",
    );

    // 1. Call Better Auth's sign-up API so it handles the password hashing and Account creation
    const response = await fetch(
      "http://localhost:5000/api/v1/auth/sign-up/email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
          name: "Admin",
        }),
      },
    );

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      console.log("User signed up successfully via API.");
    } else {
      console.log(
        "API sign-up notice (User may already exist):",
        data.message || data,
      );
    }

    // 2. Use Prisma to enforce the ADMIN role
    const result = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        role: "ADMIN",
        emailVerified: true,
      },
      create: {
        email: adminEmail,
        name: "Admin",
        role: "ADMIN",
        emailVerified: true,
        // Password omitted here because it should be handled by the API call above
      },
    });

    console.log("Admin user is ready with ADMIN role!");
  } catch (e) {
    console.log("Error seeding admin user:", e);
  }
}

seedAdmin();
