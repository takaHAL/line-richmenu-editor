import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { EditingRichMenuContext } from "contexts/EditingRichMenuContext";
import React, { useContext, useEffect, useState } from "react";
import TapAreaController from "../TapAreaController";

export default function TapAreaDeleteDialog(
  { editingAreaIndex, isDialogOpened, setIsDialogOpened, setActiveAreaIndex }:
  {
    editingAreaIndex: number,
    isDialogOpened: boolean,
    setIsDialogOpened: React.Dispatch<React.SetStateAction<boolean>>,
    setActiveAreaIndex: React.Dispatch<React.SetStateAction<number>>
  }) {
  const { menuImage, menu: { areas }, setters: { setAreas }} = useContext(EditingRichMenuContext);
  const [bounds, setBounds] = useState<(number|boolean)[]>([]);
  useEffect(() => {
    if (areas[editingAreaIndex]) {
      setBounds([
        areas[editingAreaIndex].bounds.x,
        areas[editingAreaIndex].bounds.y,
        areas[editingAreaIndex].bounds.width,
        areas[editingAreaIndex].bounds.height,
        true
      ]);
    }
  }, [areas, editingAreaIndex]);
  return (
    <Dialog onClose={() => setIsDialogOpened(false)} open={isDialogOpened} maxWidth="xs">
      <DialogTitle>タップ領域を削除</DialogTitle>
      <DialogContent>
        <TapAreaController {...{
          menuImage,
          bounds
        }}
        readonly
        width={396} />
        <p>この領域を削除しますか?</p>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setIsDialogOpened(false)} variant="text">キャンセル</Button>
        <Button onClick={() => {
          const newAreas = [...areas];
          newAreas.splice(editingAreaIndex, 1);
          setAreas(newAreas);
          setIsDialogOpened(false);
          setActiveAreaIndex(null);
        }} color="error" variant="text">削除</Button>
      </DialogActions>
    </Dialog>
  );
}
