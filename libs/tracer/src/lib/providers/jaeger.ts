import { initTracerFromEnv } from 'jaeger-client';

const config = {
  sampler: { type: 'const', param: 1 },
  reporter: { logSpans: false },
};

export const InitJaegerClient = (serviceName, options) =>
  initTracerFromEnv(
    { ...config, serviceName },
    { logger: console, ...options },
  );
