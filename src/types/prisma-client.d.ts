declare module '@prisma/client' {
  interface PrismaDelegate {
    (...args: unknown[]): Promise<unknown>;
    [method: string]: PrismaDelegate;
  }

  export class PrismaClient {
    [model: string]: PrismaDelegate;
    constructor(...args: unknown[]);
  }
}
