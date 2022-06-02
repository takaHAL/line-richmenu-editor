// see: https://developers.line.biz/ja/reference/messaging-api/#bot
export default async function handler(req, res) {
  const response = await fetch("https://api.line.me/v2/bot/info", { headers: { Authorization: req.headers.authorization }});

  res.status(response.status).json(await response.json());
}
