import React, { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Media } from "@/lib/entities";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Trash2, Star, StarOff, Image as ImageIcon, Play, Loader2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

function UploadDialog({ open, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [gameWeek, setGameWeek] = useState("");
  const [featured, setFeatured] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ""));
  };

  const handleSubmit = async () => {
    if (!file || !title) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      const isVideo = file.type.startsWith("video/");
      await Media.create({
        title,
        description,
        type: isVideo ? "video" : "photo",
        url: publicUrl,
        thumbnail_url: isVideo ? "" : publicUrl,
        game_week: gameWeek ? Number(gameWeek) : undefined,
        featured,
      });
      toast.success("Media uploaded successfully!");
      onSuccess();
      handleClose();
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setTitle("");
    setDescription("");
    setGameWeek("");
    setFeatured(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Drop Zone */}
          <div
            onClick={() => fileRef.current.click()}
            className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            {preview ? (
              file?.type.startsWith("video/") ? (
                <video src={preview} className="max-h-40 mx-auto rounded-lg" controls />
              ) : (
                <img src={preview} alt="preview" className="max-h-40 mx-auto rounded-lg object-contain" />
              )
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="w-8 h-8" />
                <p className="text-sm font-medium">Click to upload photo or video</p>
                <p className="text-xs">From your computer, phone, Google Drive, or Photos app</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFile}
            />
          </div>

          <Input placeholder="Title *" value={title} onChange={e => setTitle(e.target.value)} />
          <Input placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} />
          <Input placeholder="Game Week (optional)" type="number" value={gameWeek} onChange={e => setGameWeek(e.target.value)} />

          <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
            <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} className="accent-primary" />
            Mark as Featured
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!file || !title || uploading} className="gap-2">
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminMedia() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: media = [], isLoading } = useQuery({
    queryKey: ["media"],
    queryFn: () => Media.list("-created_date", 100),
  });

  const handleDelete = async (id) => {
    await Media.delete(id);
    queryClient.invalidateQueries({ queryKey: ["media"] });
    toast.success("Deleted.");
  };

  const handleToggleFeatured = async (item) => {
    await Media.update(item.id, { featured: !item.featured });
    queryClient.invalidateQueries({ queryKey: ["media"] });
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["media"] });
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{media.length} items uploaded</p>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Media
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="aspect-video rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : media.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No media yet. Click "Add Media" to upload.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {media.map(item => (
            <Card key={item.id} className="overflow-hidden group">
              <div className="relative aspect-video bg-muted">
                <img
                  src={item.thumbnail_url || item.url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                {item.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-primary/80 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </div>
                  </div>
                )}
                {item.featured && (
                  <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-[10px]">Featured</Badge>
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleToggleFeatured(item)}
                    className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
                    title={item.featured ? "Unfeature" : "Feature"}
                  >
                    {item.featured ? <StarOff className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="w-7 h-7 rounded-full bg-red-600/80 flex items-center justify-center text-white hover:bg-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="font-semibold text-sm truncate">{item.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] capitalize">{item.type}</Badge>
                  {item.game_week && <span className="text-[10px] text-muted-foreground">Week {item.game_week}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <UploadDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSuccess={handleSuccess} />
    </div>
  );
}