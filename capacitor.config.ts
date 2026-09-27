import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.nexorasoft.qorb",
  appName: "Qorb",
  webDir: "public",
  server: {
    url: "https://qorb-ten.vercel.app",
    cleartext: false,
  },
};

export default config;