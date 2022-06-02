// see: https://developers.line.biz/ja/reference/messaging-api/#get-rich-menu-list
export default async function handler(req, res) {
  const response = await fetch("https://api.line.me/v2/bot/richmenu", {
    method: "POST",
    headers: { "Authorization": req.headers.authorization, "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(req.body)
  });

  res.status(response.status).json(await response.json());
}
