// see: https://developers.line.biz/ja/reference/messaging-api/#get-rich-menu-list
export default async function handler(req, res) {
  const richMenuId = req.query.richmenuId;
  console.log(richMenuId);
  console.log(req.headers);

  const response = await fetch(`https://api-data.line.me/v2/bot/richmenu/${req.query.richmenuId}/content`, {
    method: "POST",
    headers: { "Authorization": req.headers.authorization, "Content-Type": req.headers["content-type"] },
    body: req.body
  });

  res.status(response.status).json(await response.json());
}
