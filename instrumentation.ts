import "reflect-metadata";

export async function register() {
  // This runs once when the Next.js server starts
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Server-side initialization
    console.log("Reflect metadata initialized");
  }
}
