"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    message: string;
    resolve: ((value: boolean) => void) | null;
  }>({ open: false, title: "", message: "", resolve: null });

  function confirm(title: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      setState({ open: true, title, message, resolve });
    });
  }

  function handleClose(result: boolean) {
    state.resolve?.(result);
    setState({ open: false, title: "", message: "", resolve: null });
  }

  const ConfirmDialog = () => (
    <Dialog open={state.open} onOpenChange={(open) => { if (!open) handleClose(false); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            {state.title}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-500">{state.message}</p>
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => handleClose(false)}>Cancel</Button>
          <Button size="sm" onClick={() => handleClose(true)} className="bg-red-500 text-white hover:bg-red-600">Delete</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return { confirm, ConfirmDialog };
}
