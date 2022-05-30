// see: https://developers.line.biz/ja/reference/messaging-api/#get-rich-menu-list
export default async function handler(req, res) {
  const fileData = req.body.replace(/^data:\w+\/\w+;base64,/, "");
  const decodedFile = Buffer.from(fileData, "base64");

  const response = await fetch(`https://api-data.line.me/v2/bot/richmenu/${req.query.richmenuId}/content`, {
    method: "POST",
    headers: { "Authorization": req.headers.authorization, "Content-Type": req.headers["content-type"] },
    body: decodedFile
  });

  res.status(response.status).json(await response.json());
}
