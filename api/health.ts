export default async function handler(req: any, res: any) {
  return res.json({ status: "ok", message: "API is alive and kicking!" });
}
