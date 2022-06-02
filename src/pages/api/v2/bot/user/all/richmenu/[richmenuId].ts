// see: https://developers.line.biz/ja/reference/messaging-api/#set-default-rich-menu
export default async function handler(req, res) {
  const response = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${req.query.richmenuId}`, {
    method: "POST",
    headers: { "Authorization": req.headers.authorization }
  });

  res.status(response.status).json(await response.json());
}
