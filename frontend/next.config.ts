import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	experimental: {
		globalNotFound: true,
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "media0.giphy.com",
			},
			{
				protocol: "https",
				hostname: "cdn.pixabay.com",
			},
			{
				protocol: "http",
				hostname: "127.0.0.1",
				port: "54321",
			},
		],
	},
};

export default nextConfig;
