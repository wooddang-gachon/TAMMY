import type { PhotoRecord } from '../hooks/useWellnessRecords';
const key = 'tammy.photos.v2';
const read = (): PhotoRecord[] => { try { return JSON.parse(localStorage.getItem(key) ?? '[]'); } catch { return []; } };
export const photosApi = {
  async getPhotos(userId = 'demo-user') { return read().filter((p) => (p.userId ?? 'demo-user') === userId); },
  async createPhoto(photo: PhotoRecord) { const all = [photo, ...read()]; localStorage.setItem(key, JSON.stringify(all)); return photo; },
  async updatePhoto(id: string, patch: Partial<PhotoRecord>) { const all = read().map((p) => p.id === id ? { ...p, ...patch } : p); localStorage.setItem(key, JSON.stringify(all)); return all.find((p) => p.id === id)!; },
  async deletePhoto(id: string) { localStorage.setItem(key, JSON.stringify(read().filter((p) => p.id !== id))); },
};

