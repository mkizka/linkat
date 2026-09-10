import {
  database,
  defineRailway,
  github,
  preserve,
  project,
  service,
  volume,
} from "railway/iac";

export default defineRailway((ctx) => {
  const postgres = database("Postgres", "postgres", {
    image: "ghcr.io/railwayapp-templates/postgres-ssl:16",
    output: "DATABASE_URL",
    defaultMountPath: "/var/lib/postgresql/data",
    region: "asia-southeast1-eqsg3a",
  });
  postgres.networking = {
    privateNetworkEndpoint: "postgres-lbyr",
    tcpProxies: { "5432": {} },
  };
  postgres.deploy = {
    restartPolicyType: "ALWAYS",
  };

  const postgresVolume = volume("postgres-volume", {
    alerts: { usage: { "100": {}, "80": {}, "95": {} } },
    allowOnlineResize: true,
    region: "asia-southeast1-eqsg3a",
    sizeMB: 5900,
  });

  const linkat = service("linkat", {
    source: github("mkizka/linkat", { checkSuites: true }),
    healthcheck: "/health",
    healthcheckTimeout: 60,
    preDeploy: "node_modules/.bin/prisma migrate deploy",
    replicas: { "asia-southeast1-eqsg3a": 1 },
    domains: ["linkat.blue"],
    env: {
      COOKIE_SECRET: preserve(),
      DATABASE_URL: postgres.env.DATABASE_URL,
      JETSTREAM_URL: preserve(),
      PRIVATE_KEY_ES256_B64: preserve(),
      PUBLIC_URL: "https://${{RAILWAY_PUBLIC_DOMAIN}}",
      UMAMI_SCRIPT_URL: preserve(),
      UMAMI_WEBSITE_ID: preserve(),
    },
  });

  return project("Linkat", {
    resources: [postgres, linkat, postgresVolume],
  });
});
