import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadToR2 } from "@/utils/r2storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";

interface HomepageSection {
  id: string;
  section_name: string;
  logo_url: string;
  link_url: string;
  alt_text: string;
  display_order: number;
  use_background: boolean;
  is_active: boolean;
}

const HomepageManagementTab = () => {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<HomepageSection>>({});
  const [newSection, setNewSection] = useState({
    section_name: "community",
    logo_url: "",
    link_url: "",
    alt_text: "",
    use_background: true,
  });
  const [previewBackground, setPreviewBackground] = useState(true);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("homepage_sections")
      .select("*")
      .order("section_name", { ascending: true })
      .order("display_order", { ascending: true });

    if (error) {
      toast.error("Failed to fetch homepage sections");
      console.error(error);
    } else {
      setSections(data || []);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const sectionName = isEdit && editingId
        ? sections.find(s => s.id === editingId)?.section_name
        : newSection.section_name;

      const folderName = sectionName ? `Events/${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}` : 'Events/Misc';

      toast.info("Uploading logo...");
      const result = await uploadToR2(file, folderName);

      if (result.success) {
        if (isEdit) {
          setEditForm(prev => ({ ...prev, logo_url: result.url }));
        } else {
          setNewSection(prev => ({ ...prev, logo_url: result.url }));
        }
        toast.success("Logo uploaded successfully");
      } else {
        throw new Error(result.error?.message || "Upload failed");
      }
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
      console.error(error);
    }
  };

  const handleAddSection = async () => {
    const maxOrder = sections
      .filter(s => s.section_name === newSection.section_name)
      .reduce((max, s) => Math.max(max, s.display_order), -1);

    const { error } = await supabase
      .from("homepage_sections")
      .insert({
        ...newSection,
        display_order: maxOrder + 1,
      });

    if (error) {
      toast.error("Failed to add section");
      console.error(error);
    } else {
      toast.success("Section added successfully");
      setNewSection({
        section_name: "community",
        logo_url: "",
        link_url: "",
        alt_text: "",
        use_background: true,
      });
      fetchSections();
    }
  };

  const handleDeleteSection = async (id: string) => {
    const { error } = await supabase
      .from("homepage_sections")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete section");
      console.error(error);
    } else {
      toast.success("Section deleted successfully");
      fetchSections();
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("homepage_sections")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update section");
      console.error(error);
    } else {
      toast.success(`Section ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchSections();
    }
  };

  const handleToggleBackground = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("homepage_sections")
      .update({ use_background: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update section");
      console.error(error);
    } else {
      toast.success("Background setting updated");
      fetchSections();
    }
  };

  const startEditing = (section: HomepageSection) => {
    setEditingId(section.id);
    setEditForm({
      logo_url: section.logo_url,
      link_url: section.link_url,
      alt_text: section.alt_text,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase
      .from("homepage_sections")
      .update(editForm)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update section");
      console.error(error);
    } else {
      toast.success("Section updated successfully");
      setEditingId(null);
      setEditForm({});
      fetchSections();
    }
  };

  const resourcesSections = sections.filter(s => s.section_name === "resources");
  const communitySections = sections.filter(s => s.section_name === "community");

  const renderSectionCard = (section: HomepageSection) => (
    <Card key={section.id} className="p-4">
      {editingId === section.id ? (
        <div className="space-y-4">
          <div>
            <Label>Logo URL</Label>
            <Input
              value={editForm.logo_url || ""}
              onChange={(e) => setEditForm({ ...editForm, logo_url: e.target.value })}
            />
            <div className="mt-2">
              <Label htmlFor="upload-edit" className="cursor-pointer text-sm text-primary hover:underline">
                Or upload image
              </Label>
              <Input
                id="upload-edit"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, true)}
              />
            </div>
          </div>
          <div>
            <Label>Link URL</Label>
            <Input
              value={editForm.link_url || ""}
              onChange={(e) => setEditForm({ ...editForm, link_url: e.target.value })}
            />
          </div>
          <div>
            <Label>Alt Text</Label>
            <Input
              value={editForm.alt_text || ""}
              onChange={(e) => setEditForm({ ...editForm, alt_text: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => saveEdit(section.id)} size="sm" className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button onClick={cancelEditing} variant="outline" size="sm" className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h4 className="font-semibold">{section.alt_text}</h4>
              <p className="text-sm text-muted-foreground truncate">{section.link_url}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startEditing(section)}
              >
                <Edit2 className="h-4 w-4 text-primary" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteSection(section.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
          <div className="mb-4">
            <div className={section.use_background ? "gradient-card p-4 rounded-lg" : "p-4"}>
              <img
                src={section.logo_url}
                alt={section.alt_text}
                className="h-12 w-auto mx-auto"
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Label className="text-xs">Active</Label>
              <Switch
                checked={section.is_active}
                onCheckedChange={() => handleToggleActive(section.id, section.is_active)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Background</Label>
              <Switch
                checked={section.use_background}
                onCheckedChange={() => handleToggleBackground(section.id, section.use_background)}
              />
            </div>
          </div>
        </>
      )}
    </Card>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4 text-primary">Manage Homepage Sections</h2>
        <p className="text-muted-foreground">
          Add and manage logos for the Resources and Community sections on the homepage
        </p>
      </div>

      {/* Add New Section */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Add New Section</h3>
        <div className="space-y-4">
          <div>
            <Label>Section</Label>
            <Select
              value={newSection.section_name}
              onValueChange={(value) => setNewSection({ ...newSection, section_name: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resources">Resources</SelectItem>
                <SelectItem value="community">Community</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Logo URL</Label>
            <Input
              placeholder="https://example.com/logo.png"
              value={newSection.logo_url}
              onChange={(e) => setNewSection({ ...newSection, logo_url: e.target.value })}
            />
            <div className="mt-2">
              <Label htmlFor="upload-new" className="cursor-pointer text-sm text-primary hover:underline">
                Or upload image
              </Label>
              <Input
                id="upload-new"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, false)}
              />
            </div>
          </div>

          <div>
            <Label>Link URL</Label>
            <Input
              placeholder="https://example.com"
              value={newSection.link_url}
              onChange={(e) => setNewSection({ ...newSection, link_url: e.target.value })}
            />
          </div>

          <div>
            <Label>Alt Text</Label>
            <Input
              placeholder="Company Name"
              value={newSection.alt_text}
              onChange={(e) => setNewSection({ ...newSection, alt_text: e.target.value })}
            />
          </div>

          {/* Preview */}
          {newSection.logo_url && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label>Preview with background</Label>
                <Switch
                  checked={previewBackground}
                  onCheckedChange={setPreviewBackground}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">Without Background:</p>
                  <div className="p-4 border border-border rounded-lg bg-background flex items-center justify-center">
                    <img
                      src={newSection.logo_url}
                      alt={newSection.alt_text}
                      className="h-16 w-auto"
                      onError={(e) => {
                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23888'%3EError%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">With Background:</p>
                  <div className="p-4 border border-border rounded-lg bg-background flex items-center justify-center">
                    <div className="gradient-card p-8 rounded-2xl">
                      <img
                        src={newSection.logo_url}
                        alt={newSection.alt_text}
                        className="h-16 w-auto filter brightness-90"
                        onError={(e) => {
                          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23888'%3EError%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label>Use background on homepage</Label>
                <Switch
                  checked={newSection.use_background}
                  onCheckedChange={(checked) => setNewSection({ ...newSection, use_background: checked })}
                />
              </div>
            </div>
          )}

          <Button onClick={handleAddSection} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </div>
      </Card>

      {/* Resources Sections */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Resources Section</h3>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : resourcesSections.length === 0 ? (
          <p className="text-muted-foreground">No resources added yet</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {resourcesSections.map(renderSectionCard)}
          </div>
        )}
      </div>

      {/* Community Sections */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Community Section</h3>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : communitySections.length === 0 ? (
          <p className="text-muted-foreground">No community logos added yet</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {communitySections.map(renderSectionCard)}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomepageManagementTab;
