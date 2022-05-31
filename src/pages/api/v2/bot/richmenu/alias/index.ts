// see: https://api.line.me/v2/bot/richmenu/alias
export default async function handler(req, res) {
  const response = await fetch("https://api.line.me/v2/bot/richmenu/alias", {
    method: "POST",
    headers: { "Authorization": req.headers.authorization, "Content-Type": "application/json" },
    body: JSON.stringify(req.body)
  });

  res.status(response.status).json(await response.json());
}
