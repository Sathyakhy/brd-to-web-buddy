import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Shield, Users, Send } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero text-foreground">
      {/* Nav */}
      <header className="border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-gradient-gold flex items-center justify-center text-primary-foreground font-serif font-semibold">21</div>
            <span className="font-serif text-xl text-gradient-gold">Invitation</span>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="sm">Admin sign in</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,hsl(var(--gold)/0.15),transparent_60%)]" aria-hidden />
        <div className="relative max-w-4xl mx-auto px-6 py-24 lg:py-36 text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/30 bg-gold/5 text-gold text-xs tracking-widest uppercase mb-6">
            <Sparkles className="h-3 w-3" /> Digital wedding invitations
          </div>
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] mb-6">
            <span className="text-gradient-gold">Elegant invitations,</span>
            <br />
            <span className="text-foreground">delivered instantly.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground text-lg mb-10">
            Replace paper cards with personalized, tokenized digital invitations.
            Track every RSVP. Built for Khmer traditional weddings and modern events.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/login">
              <Button size="lg" className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold">
                Open admin panel
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline">Learn more</Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="gold-divider mb-16" />
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Users, title: "Per-guest personalization", desc: "Each guest receives a unique tokenized link with their name." },
            { icon: Shield, title: "Secure by design", desc: "Cryptographic tokens, scoped per event. No login needed for guests." },
            { icon: Send, title: "Share anywhere", desc: "Send via WhatsApp, Telegram or Messenger — copy-paste ready." },
          ].map(f => (
            <div key={f.title} className="p-8 rounded-xl border border-border bg-card hover:border-gold/30 transition-smooth shadow-soft">
              <div className="h-10 w-10 rounded-md bg-gold/10 text-gold flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-xl mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} 21Invitation
      </footer>
    </div>
  );
};

export default Index;
