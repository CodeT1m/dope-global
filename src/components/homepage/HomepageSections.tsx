import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export const ResourcesSection = () => {
  const [sections, setSections] = useState<HomepageSection[]>([]);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    const { data } = await supabase
      .from("homepage_sections")
      .select("*")
      .eq("section_name", "resources")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (data) {
      setSections(data);
    }
  };

  if (sections.length === 0) return null;

  return (
    <section className="py-16 px-4 bg-muted/20">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-primary">Resources</span>
          </h2>
        </div>
        <div className="overflow-hidden">
          <div className="flex animate-scroll-horizontal gap-12 items-center">
            {/* Display sections twice for seamless loop */}
            {[...sections, ...sections].map((section, index) => (
              <a
                key={`${section.id}-${index}`}
                href={section.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 hover-scale"
              >
                {section.use_background ? (
                  <div className="bg-card border border-border p-8 rounded-2xl shadow-elevated hover:shadow-glow transition-all">
                    <img
                      src={section.logo_url}
                      alt={section.alt_text}
                      className="h-32 w-auto filter brightness-90 hover:brightness-110 transition-all"
                    />
                  </div>
                ) : (
                  <img
                    src={section.logo_url}
                    alt={section.alt_text}
                    className="h-32 w-auto filter brightness-90 hover:brightness-110 transition-all"
                  />
                )}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export const CommunitySection = () => {
  const [sections, setSections] = useState<HomepageSection[]>([]);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    const { data } = await supabase
      .from("homepage_sections")
      .select("*")
      .eq("section_name", "community")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (data) {
      setSections(data);
    }
  };

  if (sections.length === 0) return null;

  return (
    <div className="mb-12">
      <h3 className="text-2xl font-bold text-center mb-8">
        <span className="text-primary">Community</span>
      </h3>
      <div className="overflow-hidden">
        <div className="flex animate-scroll-horizontal gap-8 items-center">
          {/* Display sections twice for seamless loop */}
          {[...sections, ...sections].map((section, index) => {
            const content = section.use_background ? (
              <div className="w-40 h-40 bg-card border border-border rounded-xl p-4 hover:shadow-glow transition-all flex items-center justify-center">
                <img
                  src={section.logo_url}
                  alt={section.alt_text}
                  className="w-full h-full object-contain filter brightness-90 group-hover:brightness-110 transition-all"
                />
              </div>
            ) : (
              <div className="w-40 h-40 flex items-center justify-center">
                <img
                  src={section.logo_url}
                  alt={section.alt_text}
                  className="w-full h-full object-contain filter brightness-90 group-hover:brightness-110 transition-all"
                />
              </div>
            );

            return section.link_url ? (
              <a
                key={`${section.id}-${index}`}
                href={section.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 group"
              >
                {content}
              </a>
            ) : (
              <div key={`${section.id}-${index}`} className="flex-shrink-0">
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
