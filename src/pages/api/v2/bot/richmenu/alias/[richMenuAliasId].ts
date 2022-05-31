// see: https://developers.line.biz/ja/reference/messaging-api/#delete-rich-menu-alias
export default async function handler(req, res) {
  const response = await fetch(`https://api.line.me/v2/bot/richmenu/alias/${req.query.richMenuAliasId}`, {
    method: "DELETE",
    headers: { "Authorization": req.headers.authorization },
  });

  res.status(response.status).json(await response.json());
}
