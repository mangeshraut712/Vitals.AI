import type { NextConfig } from "next";
import path from "path";

// Patch Node's fs module to handle EPERM errors on macOS-restricted files/dirs
// This is needed because:
// 1. data/Activity, data/Bloodwork, data/Body Scan are OS-restricted (health data)
// 2. next-env.d.ts has macOS quarantine restrictions
const _fs = require("fs");

const _origReaddir = _fs.readdir;
const _origReaddirSync = _fs.readdirSync;
const _origWriteFile = _fs.writeFile;
const _origWriteFileSync = _fs.writeFileSync;
const _origOpen = _fs.open;

// Patch async readdir
_fs.readdir = function (p: string, options: unknown, callback?: unknown) {
  const cb = typeof options === "function" ? options : callback;
  const opts = typeof options === "function" ? undefined : options;
  const wrappedCb = (err: NodeJS.ErrnoException | null, files: string[]) => {
    if (err && err.code === "EPERM") {
      (cb as (err: null, files: string[]) => void)(null, []);
    } else {
      (cb as (err: NodeJS.ErrnoException | null, files: string[]) => void)(err, files);
    }
  };
  opts !== undefined ? _origReaddir(p, opts, wrappedCb) : _origReaddir(p, wrappedCb);
};

// Patch sync readdir
_fs.readdirSync = function (p: string, options?: unknown) {
  try {
    return options !== undefined ? _origReaddirSync(p, options) : _origReaddirSync(p);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as NodeJS.ErrnoException).code === "EPERM") {
      return [];
    }
    throw e;
  }
};

// Patch async writeFile to silently ignore EPERM on next-env.d.ts
_fs.writeFile = function (p: string, data: unknown, options: unknown, callback?: unknown) {
  const cb = typeof options === "function" ? options : callback;
  const opts = typeof options === "function" ? undefined : options;
  const wrappedCb = (err: NodeJS.ErrnoException | null) => {
    if (err && err.code === "EPERM" && String(p).includes("next-env")) {
      (cb as (err: null) => void)(null);
    } else {
      (cb as (err: NodeJS.ErrnoException | null) => void)(err);
    }
  };
  opts !== undefined ? _origWriteFile(p, data, opts, wrappedCb) : _origWriteFile(p, data, wrappedCb);
};

// Patch sync writeFile
_fs.writeFileSync = function (p: string, data: unknown, options?: unknown) {
  try {
    return options !== undefined ? _origWriteFileSync(p, data, options) : _origWriteFileSync(p, data);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as NodeJS.ErrnoException).code === "EPERM" && String(p).includes("next-env")) {
      return; // silently ignore
    }
    throw e;
  }
};

// Patch open to silently ignore EPERM on next-env.d.ts
_fs.open = function (p: string, flags: unknown, ...args: unknown[]) {
  const callback = args[args.length - 1] as (err: NodeJS.ErrnoException | null, fd?: number) => void;
  const wrappedCb = (err: NodeJS.ErrnoException | null, fd?: number) => {
    if (err && err.code === "EPERM" && String(p).includes("next-env")) {
      callback(null, -1);
    } else {
      callback(err, fd);
    }
  };
  const newArgs = [...args.slice(0, -1), wrappedCb];
  _origOpen(p, flags, ...newArgs);
};

const nextConfig: NextConfig = {
  // Performance optimizations
  reactStrictMode: true,

  // Skip type checking during build (run separately via tsc)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Improved image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
  },

  // Security headers
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ],
    },
  ],

  // Experimental optimizations
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "date-fns",
      "framer-motion",
    ],
  },

  // Webpack config
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        path.resolve(__dirname, "data"),
        path.resolve(__dirname, ".next"),
        path.resolve(__dirname, "node_modules"),
      ],
    };
    return config;
  },

  // Disable telemetry
  env: {
    NEXT_TELEMETRY_DISABLED: "1",
  },
};

export default nextConfig;
