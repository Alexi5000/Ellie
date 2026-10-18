import express from "express";
import { afterEach, expect, it, vi } from "vitest";
import type { Server } from "http";

vi.mock("fs", () => ({ default: { existsSync: () => true } }));
import { serveStatic } from "./vite";

let server: Server | undefined;
afterEach(async () => {
  if (server)
    await new Promise<void>(resolve => server!.close(() => resolve()));
});

it("limits repeated SPA fallback requests before reading the index file", async () => {
  const app = express();
  const sendFile = vi
    .spyOn(app.response, "sendFile")
    .mockImplementation(function (this: express.Response) {
      this.status(200).send("app shell");
      return this;
    });
  serveStatic(app);
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server!.once("listening", resolve));
  const address = server.address() as { port: number };
  const url = `http://127.0.0.1:${address.port}/dashboard`;
  for (let count = 0; count < 120; count++) {
    const response = await fetch(url);
    expect(response.status).toBe(200);
    await response.text();
  }
  const response = await fetch(url);
  expect(response.status).toBe(429);
  expect(response.headers.get("retry-after")).toBeTruthy();
  expect(sendFile).toHaveBeenCalledTimes(120);
  sendFile.mockRestore();
});
