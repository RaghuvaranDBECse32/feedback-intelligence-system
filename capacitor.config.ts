import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: "com.raghuvaran.feedbackintelligence",
  appName: "Feedback Intelligence",
  webDir: "www",
  server: {
    // Replace with your deployed Vercel URL before building native apps.
    // Example: https://feedback-intelligence-yourname.vercel.app
    url: process.env.CAPACITOR_SERVER_URL || "https://YOUR-VERCEL-APP.vercel.app",
    cleartext: false
  }
};
export default config;
