import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Location } from "@/lib/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const emptyLoc = { name: "", address: "", map_url: "", lat: "", lng: "" };

export default function AdminLocations() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyLoc);

  const { data: locations = [] } = useQuery({ queryKey: ["locations"], queryFn: () => Location.list() });

  const openCreate = () => { setEditing(null); setForm(emptyLoc); setDialogOpen(true); };
  const openEdit = (loc) => { setEditing(loc); setForm({ name: loc.name, address: loc.address || "", map_url: loc.map_url || "", lat: loc.lat || "", lng: loc.lng || "" }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name) { toast.error("Name is required."); return; }
    if (editing) {
      await Location.update(editing.id, form);
      toast.success("Location updated");
    } else {
      await Location.create(form);
      toast.success("Location created");
    }
    queryClient.invalidateQueries({ queryKey: ["locations"] });
    setDialogOpen(false);
  };

  const handleDelete = async (loc) => {
    if (!confirm(`Delete ${loc.name}?`)) return;
    await Location.delete(loc.id);
    queryClient.invalidateQueries({ queryKey: ["locations"] });
    toast.success("Location deleted");
  };

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Locations</h2>
        <Button size="sm" onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Location</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Map</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map(loc => (
                <TableRow key={loc.id}>
                  <TableCell className="font-semibold">{loc.name}</TableCell>
                  <TableCell className="text-muted-foreground">{loc.address || "—"}</TableCell>
                  <TableCell>{loc.map_url ? <a href={loc.map_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">View</a> : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(loc)}><Pencil className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={() => handleDelete(loc)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {locations.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No locations yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Location" : "Add Location"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => set("name", e.target.value)} /></div>
            <div><Label>Address</Label><Input value={form.address} onChange={e => set("address", e.target.value)} /></div>
            <div><Label>Map URL</Label><Input value={form.map_url} onChange={e => set("map_url", e.target.value)} placeholder="Google Maps link" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Latitude</Label><Input value={form.lat} onChange={e => set("lat", e.target.value)} placeholder="e.g. 43.6532" /></div>
              <div><Label>Longitude</Label><Input value={form.lng} onChange={e => set("lng", e.target.value)} placeholder="e.g. -79.3832" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}