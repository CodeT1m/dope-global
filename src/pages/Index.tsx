import { Button } from "@/components/ui/button";
import { Camera, Sparkles, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
import heroDark from "@/assets/hero-dark.jpg";
import heroLight from "@/assets/hero-light.jpg";
import logoDark from "@/assets/logo-dark.svg";
import logoLight from "@/assets/logo-light.svg";
import thisIsDopeDark from "@/assets/this-is-dope-dark.svg";
import thisIsDopeLight from "@/assets/this-is-dope-light.svg";
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
          <img 
            src={heroBg} 
            alt="DOPE Background" 
            className="w-full h-full object-cover opacity-40"
          />
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
            <div className="flex justify-center mb-8">
              <img 
                src={logo} 
                alt="DOPE Logo" 
                className="h-48 w-auto animate-glow-pulse"
              />
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="text-foreground">Diary of Photographers</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
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
            <p className="text-sm text-muted-foreground pt-4">
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
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
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
              <p className="text-muted-foreground leading-relaxed">
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
              <p className="text-muted-foreground leading-relaxed">
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
              <p className="text-muted-foreground leading-relaxed">
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
            <p className="text-xl text-muted-foreground">
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
                  <p className="text-sm text-muted-foreground">@timinottimid</p>
                </div>
                <div className="flex justify-center gap-6 text-sm">
                  <a 
                    href="https://instagram.com/timi.jpeng" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-all hover:scale-110 transform"
                  >
                    Instagram
                  </a>
                  <a 
                    href="https://linkedin.com/in/ileladewa-oluwatimilehin" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-all hover:scale-110 transform"
                  >
                    LinkedIn
                  </a>
                  <a 
                    href="https://behance.net/timinottimid" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-all hover:scale-110 transform"
                  >
                    Behance
                  </a>
                  <a 
                    href="https://x.com/timinottimid" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-all hover:scale-110 transform"
                  >
                    X
                  </a>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground pt-4">
              © 2025 DOPE. All rights reserved.
            </p>
          </div>
        </div>
        </footer>
    </div>
  );
};

export default Index;
