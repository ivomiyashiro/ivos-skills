export const shouldExposeOperationalEndpoint = (nodeEnv: string, explicitlyExposed: boolean) =>
  nodeEnv !== 'production' || explicitlyExposed;
