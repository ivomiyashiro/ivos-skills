export const shutdownGracefully = async (input: {
  stopServer: () => void | Promise<void>;
  wait: (ms: number) => Promise<void>;
  closeDb: () => Promise<void>;
  graceMs: number;
}) => {
  await input.stopServer();
  await input.wait(input.graceMs);
  await input.closeDb();
};
