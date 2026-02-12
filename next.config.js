/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: (() => {
      const publicUrl =
        process.env.CLOUDFLARE_PUBLIC_PRODUCTION_URL ||
        process.env.CLOUDFLARE_PUBCLIC_DEVELOPMENT_URL;

      if (!publicUrl) {
        return [];
      }

      try {
        const url = new URL(publicUrl);
        const pathnameBase = url.pathname.replace(/\/$/, "");

        return [
          {
            protocol: url.protocol.replace(":", ""),
            hostname: url.hostname,
            pathname: `${pathnameBase}/**`
          }
        ];
      } catch {
        return [];
      }
    })()
  }
};

module.exports = nextConfig;
