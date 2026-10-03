"use client";

import { useEffect, useRef, useState } from "react";
import { uploadFile } from "@/lib/upload-client";

type Photo = { id: string; name: string; preview: string; key?: string; file?: File; progress: number; error?: string; uploading: boolean };

export function PhotoUpload({ initialKeys, onChange, onBlockedChange }: { initialKeys: string[]; onChange: (keys: string[]) => void; onBlockedChange: (blocked: boolean) => void }) {
  const [photos, setPhotos] = useState<Photo[]>(() => initialKeys.map(key => ({ id: key, name: key.split("/").at(-1) ?? "Asset photo", preview: `/api/uploads/download?key=${encodeURIComponent(key)}`, key, progress: 100, uploading: false })));
  const [error, setError] = useState("");
  const previews = useRef<string[]>([]);
  useEffect(() => () => previews.current.forEach(url => URL.revokeObjectURL(url)), []);
  useEffect(() => { onChange(photos.flatMap(photo => photo.key ? [photo.key] : [])); onBlockedChange(photos.some(photo => photo.uploading || photo.error)); }, [photos, onChange, onBlockedChange]);
  function update(id: string, change: Partial<Photo>) { setPhotos(current => current.map(photo => photo.id === id ? { ...photo, ...change } : photo)); }
  async function upload(photo: Photo) {
    if (!photo.file) return;
    update(photo.id, { uploading: true, error: undefined, progress: 0 });
    try { const key = await uploadFile(photo.file, progress => update(photo.id, { progress })); update(photo.id, { key, uploading: false, progress: 100 }); }
    catch (cause) { update(photo.id, { uploading: false, error: cause instanceof Error ? cause.message : "Upload failed. Retry this photo." }); }
  }
  function add(files: File[]) {
    setError("");
    if (photos.length + files.length > 15) { setError("Add up to 15 photos. Remove a photo before adding more."); return; }
    if (files.some(file => !["image/jpeg", "image/png"].includes(file.type) || !file.size || file.size > 10 * 1024 * 1024)) { setError("Choose JPG or PNG photos between 1 byte and 10 MB."); return; }
    const added = files.map(file => { const preview = URL.createObjectURL(file); previews.current.push(preview); return { id: crypto.randomUUID(), name: file.name, preview, file, progress: 0, uploading: true }; });
    setPhotos(current => [...current, ...added]);
    added.forEach(photo => void upload(photo));
  }
  return <div className="photo-uploader">
    <label className="upload-target">Add asset photos<input type="file" accept="image/jpeg,image/png" multiple onChange={event => { add(Array.from(event.target.files ?? [])); event.target.value = ""; }} /><small>JPG or PNG, up to 10 MB each. First photo is the cover.</small></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="upload-previews">{photos.map((photo, index) => <article key={photo.id} className="upload-preview">
      <img src={photo.preview} alt={`Asset photo ${index + 1}`} />
      <div><strong>{index === 0 ? "Cover photo" : `Photo ${index + 1}`}</strong><span className="upload-filename">{photo.name}</span>
        <span role="status">{photo.uploading ? `Uploading ${photo.progress}%` : photo.key ? "Uploaded" : "Upload failed"}</span>
        {photo.uploading && <progress max="100" value={photo.progress} aria-label={`Uploading ${photo.name}`} />}
        {photo.error && <p className="form-error" role="alert">{photo.error}</p>}
        <div className="action-row">{photo.error && <button type="button" className="outline-button" onClick={() => void upload(photo)}>Retry</button>}{index > 0 && !photo.uploading && <button type="button" className="outline-button" onClick={() => setPhotos(current => [photo, ...current.filter(item => item.id !== photo.id)])}>Make cover</button>}<button type="button" className="outline-button" disabled={photo.uploading} aria-label={`Remove photo ${index + 1}`} onClick={() => setPhotos(current => current.filter(item => item.id !== photo.id))}>Remove</button></div>
      </div>
    </article>)}</div>
  </div>;
}
