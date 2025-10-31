import { Button } from "@/components/ui/button";
import { Camera, Sparkles, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import dopeLogo from "@/assets/dope-logo.png";
import lovableLogo from "@/assets/partners/lovable.png";
import aiTinkerersLogo from "@/assets/community/ai-tinkerers.png";
import buildersClubLogo from "@/assets/community/builders-club.png";
import loopholeHackersLogo from "@/assets/community/loophole-hackers.png";
import fofKlLogo from "@/assets/community/fof-kl.png";
import summyLogo from "@/assets/community/summy.png";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
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
            <img src={dopeLogo} alt="DOPE Logo" className="h-12 w-auto" />
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              DOPE
            </span>
          </div>
          <Link to="/auth">
            <Button variant="outline" className="shadow-elevated backdrop-blur-sm">
              Login
            </Button>
          </Link>
        </header>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto text-center space-y-8 animate-fade-in-up">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img 
                src={dopeLogo} 
                alt="DOPE Logo" 
                className="h-24 w-auto animate-glow-pulse"
              />
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="text-gradient">Diary of a</span>
              <br />
              <span className="text-gradient-accent">Photographer Experience</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              AI-powered photo discovery meets viral engagement. 
              Help your attendees find themselves instantly, create memes, 
              and build vibrant communities around every event.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Link to="/auth">
                <Button size="lg" className="gradient-primary text-lg px-8 py-6 shadow-glow hover:shadow-glow-accent transition-all">
                  Get Started Free
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
      <section className="py-16 px-4 bg-muted/20">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-gradient">Powered By</span>
            </h2>
          </div>
          <div className="flex justify-center">
            <a 
              href="https://lovable.dev/invite/QIBH2NG" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group"
            >
              <div className="gradient-card p-8 rounded-2xl shadow-elevated hover:shadow-glow transition-all">
                <img 
                  src={lovableLogo} 
                  alt="Lovable" 
                  className="h-16 w-auto mx-auto filter brightness-90 group-hover:brightness-110 transition-all"
                />
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">Why DOPE?</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform event photography into interactive experiences
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="gradient-card p-8 rounded-2xl shadow-elevated hover:shadow-glow transition-all animate-scale-in">
              <div className="w-14 h-14 gradient-primary rounded-xl flex items-center justify-center mb-6 shadow-glow">
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
              <div className="w-14 h-14 gradient-accent rounded-xl flex items-center justify-center mb-6 shadow-glow-accent">
                <Sparkles className="h-7 w-7 text-accent-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Viral Engagement</h3>
              <p className="text-muted-foreground leading-relaxed">
                React, star favorites, and create memes. Turn every photo 
                into shareable content with auto-generated captions.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="gradient-card p-8 rounded-2xl shadow-elevated hover:shadow-glow transition-all animate-scale-in" style={{ animationDelay: "0.2s" }}>
              <div className="w-14 h-14 gradient-primary rounded-xl flex items-center justify-center mb-6 shadow-glow">
                <Users className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Community Hub</h3>
              <p className="text-muted-foreground leading-relaxed">
                Build engaged communities around each event. Leaderboards, 
                badges, and meme walls keep the conversation going.
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
              <span className="text-gradient">For Photographers</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Create your branded event galleries, engage your audience with 
              AI-powered features, and grow your photography business with DOPE.
            </p>
            <div className="pt-4">
              <Link to="/auth">
                <Button size="lg" className="gradient-accent px-8 py-6 text-lg shadow-glow-accent">
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
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-center mb-8">
              <span className="text-gradient">Community</span>
            </h3>
            <div className="relative overflow-hidden">
              <div className="flex gap-8 items-center justify-center flex-wrap">
                <a 
                  href="https://www.linkedin.com/company/ai-tinkerers-kuala-lumpur/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="w-32 h-32 gradient-card rounded-xl p-4 hover:shadow-glow transition-all flex items-center justify-center">
                    <img 
                      src={aiTinkerersLogo} 
                      alt="AI Tinkerers KL" 
                      className="w-full h-full object-contain filter brightness-90 group-hover:brightness-110 transition-all"
                    />
                  </div>
                </a>
                <a 
                  href="https://www.linkedin.com/company/the-builders-club-ai/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="w-32 h-32 gradient-card rounded-xl p-4 hover:shadow-glow transition-all flex items-center justify-center">
                    <img 
                      src={buildersClubLogo} 
                      alt="The Builders Club AI" 
                      className="w-full h-full object-contain filter brightness-90 group-hover:brightness-110 transition-all"
                    />
                  </div>
                </a>
                <a 
                  href="https://www.instagram.com/loopholehackers/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="w-32 h-32 gradient-card rounded-xl p-4 hover:shadow-glow transition-all flex items-center justify-center">
                    <img 
                      src={loopholeHackersLogo} 
                      alt="Loophole Hackers" 
                      className="w-full h-full object-contain filter brightness-90 group-hover:brightness-110 transition-all"
                    />
                  </div>
                </a>
                <a 
                  href="https://www.instagram.com/fof_kualalumpur/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="w-32 h-32 gradient-card rounded-xl p-4 hover:shadow-glow transition-all flex items-center justify-center">
                    <img 
                      src={fofKlLogo} 
                      alt="FOF Kuala Lumpur" 
                      className="w-full h-full object-contain filter brightness-90 group-hover:brightness-110 transition-all"
                    />
                  </div>
                </a>
                <a 
                  href="https://summysvc.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="w-32 h-32 gradient-card rounded-xl p-4 hover:shadow-glow transition-all flex items-center justify-center">
                    <img 
                      src={summyLogo} 
                      alt="Summy" 
                      className="w-full h-full object-contain filter brightness-90 group-hover:brightness-110 transition-all"
                    />
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="text-center space-y-4 border-t border-border pt-8">
            <div className="flex justify-center mb-4">
              <img src={dopeLogo} alt="DOPE" className="h-12 w-auto opacity-80" />
            </div>
            <p className="text-muted-foreground">
              Powered by DOPE • timinottimid
            </p>
            <div className="flex justify-center gap-6 text-sm">
              <a 
                href="https://instagram.com/timi.jpeng" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Instagram
              </a>
              <a 
                href="https://linkedin.com/in/ileladewa-oluwatimilehin" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                LinkedIn
              </a>
              <a 
                href="https://behance.net/timinottimid" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Behance
              </a>
              <a 
                href="https://x.com/timinottimid" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                X (Twitter)
              </a>
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
