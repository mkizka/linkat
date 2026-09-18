import {
  database,
  defineRailway,
  github,
  preserve,
  project,
  service,
} from "railway/iac";

const env = {
  RAILWAY_CONFIG_DOMAINS: process.env.RAILWAY_CONFIG_DOMAINS
    ? process.env.RAILWAY_CONFIG_DOMAINS.split(",")
    : ["linkat.blue"],
  RAILWAY_CONFIG_BRANCH: process.env.RAILWAY_CONFIG_BRANCH,
};

export default defineRailway((ctx) => {
  const prod = ctx.isEnvironment("production");

  const postgres = database(
    prod ? "Postgres" : `Postgres-${ctx.environment}`,
    "postgres",
    {
      image: "ghcr.io/railwayapp-templates/postgres-ssl:16",
      output: "DATABASE_URL",
      defaultMountPath: "/var/lib/postgresql/data",
      region: "asia-southeast1-eqsg3a",
    },
  );
  postgres.networking = {
    privateNetworkEndpoint: "postgres-lbyr",
    tcpProxies: { "5432": {} },
  };
  postgres.deploy = {
    restartPolicyType: "ALWAYS",
  };

  const linkat = service("Linkat", {
    source: github("mkizka/linkat", {
      branch: env.RAILWAY_CONFIG_BRANCH,
      checkSuites: prod,
    }),
    build: {
      builder: "DOCKERFILE",
    },
    healthcheck: "/health",
    healthcheckTimeout: 60,
    preDeploy: "node_modules/.bin/prisma migrate deploy",
    replicas: { "asia-southeast1-eqsg3a": 1 },
    domains: prod ? env.RAILWAY_CONFIG_DOMAINS : [],
    deploy: {
      sleepApplication: !prod,
    },
    env: {
      COOKIE_SECRET: preserve(),
      DATABASE_URL: postgres.env.DATABASE_URL,
      JETSTREAM_URL: preserve(),
      PRIVATE_KEY_ES256_B64: preserve(),
      PUBLIC_URL: "https://${{RAILWAY_PUBLIC_DOMAIN}}",
      SENTRY_AUTH_TOKEN: preserve(),
      SENTRY_DSN: preserve(),
      SENTRY_ORG: preserve(),
      SENTRY_PROJECT: preserve(),
      UMAMI_SCRIPT_URL: preserve(),
      UMAMI_WEBSITE_ID: preserve(),
    },
  });

  return project("Linkat", {
    resources: [postgres, linkat],
  });
});
