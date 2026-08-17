import app from "./app";
import { prisma } from "./lib/prisma";
import "./workers/image.worker";

const PORT = process.env.PORT || 5000;

async function main() {
  try {
    await prisma.$connect();
    console.log("Database Connected Successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.log("something went wrong", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
