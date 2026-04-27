export default async function handler(req: any, res: any) {
  try {
    const mod = await import("../server/index");
    const app = mod.default ?? mod.app;
    if (typeof app !== "function") {
      return res.status(500).json({ message: "Backend app export is invalid." });
    }
    return app(req, res);
  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      message: `Server bootstrap failed: ${message}`,
    });
  }
}
