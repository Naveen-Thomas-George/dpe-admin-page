"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit2, X, Check } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

export function NewsSection() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: "", description: "" });

  // 🟢 Fetch all news
  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/news");
      const data = await res.json();
      setNews(data.items || []);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError("Failed to fetch news");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // ➕ Add or update
  const handleSaveNews = async () => {
    if (!formData.title || !formData.description) {
      alert("Please fill in all fields");
      return;
    }

    try {
      if (editingId) {
        await fetch("/api/news", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...formData }),
        });
      } else {
        await fetch("/api/news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      setFormData({ title: "", description: "" });
      setEditingId(null);
      setIsAdding(false);
      fetchNews();
    } catch (err) {
      console.error("❌ Save error:", err);
      alert("An error occurred while saving news");
    }
  };

  // ❌ Delete
  const handleDeleteNews = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    try {
      await fetch(`/api/news?id=${id}`, { method: "DELETE" });
      fetchNews();
    } catch (err) {
      console.error("❌ Delete error:", err);
    }
  };

  // 🧠 Edit mode
  const handleEditNews = (item: NewsItem) => {
    setEditingId(item.id);
    setFormData({ title: item.title, description: item.description });
    setIsAdding(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ title: "", description: "" });
  };

  // 🧱 UI
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-foreground">News Management</h2>
          <p className="text-muted-foreground mt-2">
            Add, edit, and delete news updates for the user site.
          </p>
        </div>
        {!isAdding && !editingId && (
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add News
          </Button>
        )}
      </div>

      {(isAdding || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit News" : "Create News"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <textarea
              className="w-full border rounded-md p-2"
              rows={3}
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <div className="flex gap-2">
              <Button onClick={handleSaveNews} className="flex-1">
                <Check className="w-4 h-4 mr-2" />
                {editingId ? "Update" : "Publish"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        news.map((item) => (
          <Card key={item.id}>
            <CardContent className="pt-4 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <p className="text-xs mt-1 text-muted-foreground">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => handleEditNews(item)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" onClick={() => handleDeleteNews(item.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}