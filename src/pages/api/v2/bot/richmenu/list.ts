// see: https://developers.line.biz/ja/reference/messaging-api/#get-rich-menu-list
export default async function handler(req, res) {
  const response = await fetch("https://api.line.me/v2/bot/richmenu/list", { headers: { Authorization: req.headers.authorization }});

  res.status(response.status).json(await response.json());
}
