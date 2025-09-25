import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { baseRouter } from "./routers/base";
import { tableRouter } from "./routers/table";

export const appRouter = createTRPCRouter({
  base: baseRouter,
  table: tableRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
