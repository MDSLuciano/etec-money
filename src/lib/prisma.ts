import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
    log: ['query'] // mostra as queries executadas no terminal
})