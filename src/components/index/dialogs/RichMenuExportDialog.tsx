import { RichMenuResponse } from "@line/bot-sdk";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Typography from "@mui/material/Typography";
import richMenuDatabase from "databases/RichMenu";
import JSZip from "jszip";
import React, { useEffect, useState } from "react";
import { StoredRichMenu } from "types/RichMenu";

export default function RichMenuExportDialog(
  { richMenuId, isDialogOpened, setIsDialogOpened, handleMenuClose: handleMenuClose }:
  {
    richMenuId: string,
    isDialogOpened: boolean,
    setIsDialogOpened: React.Dispatch<React.SetStateAction<boolean>>,
    handleMenuClose: () => void
  }) {
  const [richMenuToExport, setRichMenuToExport] = useState<StoredRichMenu>(null);
  useEffect(() => {
    (async () => {
      if (richMenuId) setRichMenuToExport(await richMenuDatabase.menus.where("richMenuId").equalsIgnoreCase(richMenuId).first());
    })();
  }, [richMenuId]);
  const [exportFileList, setExportFileList] = useState({
    json: false,
    minJSON: false,
    image: false
  });
  useEffect(() => {
    setExportFileList({
      json: true,
      minJSON: false,
      image: Boolean(richMenuToExport?.menuImage)
    });
  }, [richMenuToExport]);

  const toBlob = (base64: string): Blob => {
    const bin = atob(base64.replace(/^.*,/, ""));
    const buffer = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      buffer[i] = bin.charCodeAt(i);
    }
    try {
      return new Blob([buffer.buffer]);
    } catch (e) {
      return null;
    }
  };

  return (
    <Dialog onClose={() => setIsDialogOpened(false)} open={isDialogOpened} maxWidth="xs" fullWidth>
      <DialogTitle>リッチメニューをエクスポート</DialogTitle>
      <DialogContent>
        <Typography>エクスポートするファイル</Typography>
        <FormGroup>
          <FormControlLabel
            control={ <Checkbox
              checked={exportFileList.json}
              onChange={e => setExportFileList({ ...exportFileList, json: e.target.checked })}
            /> } label="メニュー構造(整形済JSON)" />
          <FormControlLabel
            control={ <Checkbox
              checked={exportFileList.minJSON}
              onChange={e => setExportFileList({ ...exportFileList, minJSON: e.target.checked })}
            /> } label="メニュー構造(圧縮済JSON)" />
          <FormControlLabel
            control={ <Checkbox
              checked={exportFileList.image}
              onChange={e => setExportFileList({ ...exportFileList, image: e.target.checked })}
              disabled={!(richMenuToExport?.menuImage)}
            /> }
            label={`メニュー画像(${richMenuToExport?.menuImage?.fileType || "保存されていません"})`} />
        </FormGroup>
        {Object.values(exportFileList).filter(bool => bool).length > 1 && (
          <Alert severity="info" sx={{ my: 1 }}>
            ファイルはZIP形式に圧縮して保存されます。
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => { setIsDialogOpened(false); handleMenuClose(); }} variant="text">キャンセル</Button>
        <Button onClick={async () => {
          const files: {[key: string]: string | Blob} = {};
          const richMenuBody: Partial<RichMenuResponse> = { ...richMenuToExport.menu };
          const downloadLink = document.createElement("a");

          if (richMenuToExport.richMenuId.startsWith("richmenu-")) richMenuBody.richMenuId = richMenuToExport.richMenuId;

          if (exportFileList.json) {
            files["richmenu-structure.json"] = JSON.stringify(richMenuBody, null, 2);
          }
          if (exportFileList.minJSON) {
            files["richmenu-structure.min.json"] = JSON.stringify(richMenuBody);
          }
          if (exportFileList.image) {
            files[`richmenu-image.${richMenuToExport.menuImage.fileType === "JPEG" ? "jpg" : "png"}`] = toBlob(richMenuToExport.menuImage.imageSrc);
          }
          if (Object.keys(files).length > 1) {
            const zip = new JSZip();
            Object.entries(files).forEach(([fileName, content]) => {
              zip.file(fileName.replace(/\.base64$/, ""), content);
            });
            const zipFile = await zip.generateAsync({ type: "blob" });
            downloadLink.download = `${richMenuToExport.menu.name || "richmenu"}.zip`;
            downloadLink.href = URL.createObjectURL(zipFile);
          } else {
            const [fileName, content] = Object.entries(files)[0];
            downloadLink.href = URL.createObjectURL(typeof content === "string" ? new Blob([content]) : content);
            downloadLink.download = `${richMenuToExport.menu.name || "richmenu"}.${fileName.replace(/\.base64$/, "").split(".").reverse()[0]}`;
          }
          downloadLink.click();
          handleMenuClose();
          setIsDialogOpened(false);
        }}
        variant="text"
        disabled={Object.values(exportFileList).every(v => !v)}>エクスポート</Button>
      </DialogActions>
    </Dialog>
  );
}
