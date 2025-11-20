import { Button } from "@/components/ui/button";
import { Camera, Sparkles, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
import heroDark from "@/assets/hero-dark.jpg";
import heroLight from "@/assets/hero-light.jpg";
import logoDark from "@/assets/DOPE_lightfont.svg";
import logoLight from "@/assets/DOPE_darkfont.svg";
import thisIsDopeDark from "@/assets/TDOPE_lightfont.svg";
import thisIsDopeLight from "@/assets/TDOPE_darkfont.svg";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ResourcesSection, CommunitySection } from "@/components/homepage/HomepageSections";
import { IntroAnimation } from "@/components/IntroAnimation";

const Index = () => {
  const { theme } = useTheme();
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const currentTheme = theme === "system" ? systemTheme : theme;
  const heroBg = currentTheme === "dark" ? heroDark : heroLight;
  const logo = currentTheme === "dark" ? logoDark : logoLight;
  const thisIsDopeLogo = currentTheme === "dark" ? thisIsDopeDark : thisIsDopeLight;

  return (
    <div className="min-h-screen">
      <IntroAnimation />
      {/* Hero Section with Dot Pattern */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Dot Pattern Background */}
        <div className="absolute inset-0 z-0 dot-pattern">
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        </div>

        {/* Header - positioned absolute over hero */}
        <header className="absolute top-0 left-0 right-0 z-20 container mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
            <img src={logo} alt="DOPE Logo" className="h-32 w-auto" />
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/auth">
              <Button variant="outline" className="shadow-elevated backdrop-blur-sm">
                Login
              </Button>
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto text-center space-y-8 animate-fade-in-up">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <img 
                src={logo} 
                alt="DOPE Logo" 
                className="h-96 w-auto animate-glow-pulse"
              />
            </div>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-montserrat">
              AI-powered photo discovery meets viral engagement. 
              Help your attendees find themselves instantly, 
              and build vibrant communities around every event.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Link to="/auth">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 shadow-glow hover:shadow-glow-accent transition-all">
                  Get Your Photos
                  <Sparkles className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary/50 hover:border-primary">
                  I'm a Photographer
                  <Camera className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Social Proof */}
            <p className="text-sm text-muted-foreground pt-4 font-montserrat">
              Trusted by photographers • Loved by attendees • Powered by AI
            </p>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <ResourcesSection />

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-primary">Why DOPE?</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-montserrat">
              Transform event photography into interactive experiences
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="gradient-card p-8 rounded-2xl shadow-elevated hover:shadow-glow transition-all animate-scale-in">
              <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-6 shadow-glow">
                <Zap className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-4">AI Photo Discovery</h3>
              <p className="text-muted-foreground leading-relaxed font-montserrat">
                Upload your selfie and let AI find all your photos instantly. 
                No more endless scrolling through hundreds of images.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="gradient-card p-8 rounded-2xl shadow-elevated hover:shadow-glow-accent transition-all animate-scale-in" style={{ animationDelay: "0.1s" }}>
              <div className="w-14 h-14 bg-accent rounded-xl flex items-center justify-center mb-6 shadow-glow-accent">
                <Sparkles className="h-7 w-7 text-accent-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Viral Engagement</h3>
              <p className="text-muted-foreground leading-relaxed font-montserrat">
                React and star favorites. Turn every photo 
                into shareable content with auto-generated captions.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="gradient-card p-8 rounded-2xl shadow-elevated hover:shadow-glow transition-all animate-scale-in" style={{ animationDelay: "0.2s" }}>
              <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-6 shadow-glow">
                <Users className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Community Hub</h3>
              <p className="text-muted-foreground leading-relaxed font-montserrat">
                Build engaged communities around each event. Leaderboards, 
                badges keep the conversation going.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Photographers Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-4xl">
          <div className="gradient-card p-12 rounded-3xl shadow-elevated text-center space-y-6">
            <Camera className="h-16 w-16 mx-auto text-primary animate-float" />
            <h2 className="text-4xl font-bold">
              <span className="text-primary">For Photographers</span>
            </h2>
            <p className="text-xl text-muted-foreground font-montserrat">
              Create your branded event galleries, engage your audience with 
              AI-powered features, and grow your photography business with DOPE.
            </p>
            <div className="pt-4">
              <Link to="/auth">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-6 text-lg shadow-glow-accent">
                  Start Your Studio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto">
          {/* Community Logos Section */}
          <CommunitySection />

          {/* Footer Bottom */}
          <div className="text-center space-y-8 border-t border-border pt-8">
            <div className="flex justify-center mb-4">
              <img src={thisIsDopeLogo} alt="THIS IS DOPE" className="h-16 w-auto opacity-90" />
            </div>
            
            {/* Founder Section */}
            <div className="space-y-4">
              <p className="text-lg font-semibold text-foreground">
                Founder
              </p>
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24 border-2 border-primary">
                  <AvatarImage src="https://simgviumtqekzklsqfpc.supabase.co/storage/v1/object/public/avatars/timi-founder.jpg" alt="Timi" />
                  <AvatarFallback>TJ</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="font-bold text-foreground">Timilehin Ileladewa</p>
                  <p className="text-sm text-muted-foreground font-montserrat">@timinottimid</p>
                </div>
                <div className="flex justify-center gap-6 text-sm">
                  <a 
                    href="https://instagram.com/timi.jpeng" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-all hover:scale-110 transform"
                    aria-label="Instagram"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a 
                    href="https://linkedin.com/in/ileladewa-oluwatimilehin" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-all hover:scale-110 transform"
                    aria-label="LinkedIn"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                  <a 
                    href="https://behance.net/timinottimid" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-all hover:scale-110 transform"
                    aria-label="Behance"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 7h-7v-2h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14h-8.027c.13 3.211 3.483 3.312 4.588 2.029h3.168zm-7.686-4h4.965c-.105-1.547-1.136-2.219-2.477-2.219-1.466 0-2.277.768-2.488 2.219zm-9.574 6.988h-6.466v-14.967h6.953c5.476.081 5.58 5.444 2.72 6.906 3.461 1.26 3.577 8.061-3.207 8.061zm-3.466-8.988h3.584c2.508 0 2.906-3-.312-3h-3.272v3zm3.391 3h-3.391v3.016h3.341c3.055 0 2.868-3.016.05-3.016z"/>
                    </svg>
                  </a>
                  <a 
                    href="https://x.com/timinottimid" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-all hover:scale-110 transform"
                    aria-label="X (Twitter)"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground pt-4 font-montserrat">
              © 2025 DOPE. All rights reserved.
            </p>
          </div>
        </div>
        </footer>
    </div>
  );
};

export default Index;
