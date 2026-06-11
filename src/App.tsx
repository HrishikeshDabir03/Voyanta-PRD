/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "motion/react";
import { 
  Rocket, 
  AlertTriangle, 
  Users, 
  Layout, 
  Brain, 
  BarChart3, 
  CreditCard, 
  Map, 
  ShieldAlert, 
  Search, 
  Calculator, 
  Truck, 
  Lightbulb, 
  Sparkles, 
  Gavel, 
  Flag, 
  Check, 
  CheckCheck, 
  Clock, 
  Linkedin, 
  Twitter, 
  FileText,
  Menu,
  X,
  Send,
  ArrowRight,
  Zap,
  MessageSquare,
  Route,
  Layers,
  MapPin,
  TrendingUp,
  Database,
  Video,
  Instagram,
  Youtube,
  ShieldCheck,
  ExternalLink,
  LogOut,
  Archive,
  Trash2,
  Inbox,
  History
} from "lucide-react";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, DocumentData, updateDoc, doc, deleteDoc, where } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from "firebase/auth";
import { db, auth } from "./lib/firebase";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const fadeIn = {
  initial: { opacity: 0, y: 40, rotateX: 15, scale: 0.95 },
  whileInView: { opacity: 1, y: 0, rotateX: 0, scale: 1 },
  viewport: { once: true, margin: "-100px" },
  transition: { 
    duration: 0.8, 
    ease: [0.21, 0.47, 0.32, 0.98] 
  }
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1 } }
};

function TiltCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotX = (y - centerY) / 10;
    const rotY = (centerX - x) / 10;
    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX, rotateY }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`preserve-3d ${className}`}
      style={{ perspective: "1000px" }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [activeSection, setActiveSection] = useState("hero");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<DocumentData[]>([]);
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<"inbox" | "archive">("inbox");

  const isAdmin = user?.email?.toLowerCase() === 'hrishikesh.dabir333.hd@gmail.com';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin && isAdminPortalOpen) {
      const q = query(
        collection(db, "contacts"), 
        orderBy("createdAt", "desc")
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const allMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        const filtered = allMessages.filter(msg => {
          if (adminTab === "inbox") {
            return msg.status === "active" || !msg.status; // Default to inbox if no status
          }
          return msg.status === "archived";
        });
        setMessages(filtered);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "contacts");
      });
      return () => unsubscribe();
    }
  }, [isAdmin, isAdminPortalOpen, adminTab]);

  const handleAdminLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      setIsAdminPortalOpen(true);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setIsAdminPortalOpen(false);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleArchiveMessage = async (messageId: string, currentStatus: string) => {
    const effectiveStatus = currentStatus || "active";
    try {
      const messageRef = doc(db, "contacts", messageId);
      await updateDoc(messageRef, {
        status: effectiveStatus === "active" ? "archived" : "active"
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `contacts/${messageId}`);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await deleteDoc(doc(db, "contacts", messageId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `contacts/${messageId}`);
    }
  };

  const { scrollYProgress, scrollY } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Logo Glide Animation Transforms
  const navLogoOpacity = useTransform(scrollY, [148, 150], [0, 1]);
  const heroLogoScale = useTransform(scrollY, [100, 150], [1, 0.28]);
  const heroLogoY = useTransform(scrollY, [100, 150], [0, 6]);
  const heroLogoX = useTransform(scrollY, [100, 150], [0, -40]);
  const heroLogoOpacity = useTransform(scrollY, [148, 150], [1, 0]);
  const mainZIndex = useTransform(scrollY, [0, 149, 150], [150, 150, 10]);

  useEffect(() => {
    const sections = ["hero", "problem", "personas", "journey", "strategy", "ai-engine", "infrastructure", "metrics", "growth", "risks"];
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -70% 0px",
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("submitting");
    
    try {
      await addDoc(collection(db, "contacts"), {
        name: formName,
        email: formEmail,
        message: formMessage,
        status: "active",
        createdAt: serverTimestamp()
      });
      setFormStatus("success");
      setFormName("");
      setFormEmail("");
      setFormMessage("");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "contacts");
      setFormStatus("idle");
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-primary-container selection:text-white overflow-x-hidden">
      {/* Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1.5 bg-primary z-[100] origin-left shadow-[0_0_10px_rgba(79,70,229,0.5)]" 
        style={{ scaleX }} 
      />

      {/* Floating 3D Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <FloatingShape color="bg-primary/10" size="w-64 h-64" top="10%" left="5%" delay={0} />
        <FloatingShape color="bg-indigo-500/10" size="w-96 h-96" top="60%" left="80%" delay={2} />
        <FloatingShape color="bg-tertiary/5" size="w-48 h-48" top="40%" left="40%" delay={4} />
      </div>

      {/* Top Navigation */}
      <nav className="fixed top-0 w-full z-[250] bg-slate-900/60 backdrop-blur-xl border-b border-outline-variant/10">
        <div className="flex justify-between items-center px-6 md:px-8 py-4 max-w-7xl mx-auto font-sans tracking-tight relative z-[260]">
          <motion.div 
            className="text-2xl font-bold tracking-tighter animate-logo-gradient"
            style={{ opacity: navLogoOpacity }}
          >
            Voyanta
          </motion.div>
          
          {/* Desktop Nav - Replaced redundant links with useful ones */}
          <div className="hidden md:flex gap-8 items-center">
            <a className="text-slate-400 hover:text-indigo-300 transition-colors duration-200 flex items-center gap-2" href="#">
              <FileText size={16} /> Portfolio
            </a>
            <a className="text-slate-400 hover:text-indigo-300 transition-colors duration-200 flex items-center gap-2" href="#">
              <Users size={16} /> About Me
            </a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsContactOpen(true)}
              className="hidden sm:flex bg-primary-container text-white px-6 py-2 rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 items-center justify-center gap-2 cursor-pointer"
            >
              Connect with me
            </button>
            
            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-slate-900 border-b border-outline-variant/10 overflow-hidden"
            >
              <div className="flex flex-col p-6 gap-4">
                <MobileNavItem href="#problem" label="Problem" onClick={() => setIsMenuOpen(false)} />
                <MobileNavItem href="#personas" label="Personas" onClick={() => setIsMenuOpen(false)} />
                <MobileNavItem href="#journey" label="User Journey" onClick={() => setIsMenuOpen(false)} />
                <MobileNavItem href="#strategy" label="Strategy" onClick={() => setIsMenuOpen(false)} />
                <MobileNavItem href="#ai-engine" label="AI Engine" onClick={() => setIsMenuOpen(false)} />
                <MobileNavItem href="#infrastructure" label="Infrastructure" onClick={() => setIsMenuOpen(false)} />
                <MobileNavItem href="#metrics" label="Metrics" onClick={() => setIsMenuOpen(false)} />
                <MobileNavItem href="#growth" label="Roadmap & Growth" onClick={() => setIsMenuOpen(false)} />
                <button 
                  onClick={() => { setIsContactOpen(true); setIsMenuOpen(false); }}
                  className="w-full bg-primary-container text-on-primary-container py-3 rounded-xl font-bold mt-2"
                >
                  Get in Touch
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Side Navigation */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-20 h-[calc(100vh-5rem)] w-64 p-4 bg-slate-950/80 backdrop-blur-2xl rounded-r-2xl font-mono text-sm z-40 border-r border-outline-variant/10">
        <div className="mb-8 px-2">
          <h3 className="text-indigo-400 font-bold">Voyanta PRD v1</h3>
          <p className="text-slate-500 text-xs">AI-Driven Travel Planning</p>
        </div>
        <div className="flex flex-col gap-1">
          <NavItem href="#hero" icon={<Rocket size={18} />} label="Hero" active={activeSection === "hero"} />
          <NavItem href="#problem" icon={<AlertTriangle size={18} />} label="Problem" active={activeSection === "problem"} />
          <NavItem href="#personas" icon={<Users size={18} />} label="Personas" active={activeSection === "personas"} />
          <NavItem href="#journey" icon={<Route size={18} />} label="User Journey" active={activeSection === "journey"} />
          <NavItem href="#strategy" icon={<Layout size={18} />} label="Strategy" active={activeSection === "strategy"} />
          <NavItem href="#ai-engine" icon={<Brain size={18} />} label="AI Engine" active={activeSection === "ai-engine"} />
          <NavItem href="#infrastructure" icon={<MapPin size={18} />} label="Infrastructure" active={activeSection === "infrastructure"} />
          <NavItem href="#metrics" icon={<BarChart3 size={18} />} label="Metrics" active={activeSection === "metrics"} />
          <NavItem href="#growth" icon={<TrendingUp size={18} />} label="Roadmap & Growth" active={activeSection === "growth"} />
          <NavItem href="#risks" icon={<ShieldAlert size={18} />} label="Risks" active={activeSection === "risks"} />
        </div>
      </aside>

      <motion.main 
        className="lg:ml-64 pt-20 px-4 md:px-12 pb-24 max-w-7xl mx-auto relative"
        style={{ zIndex: mainZIndex }}
      >
        <div>
          {/* Hero Section */}
          <section className="relative min-h-[80vh] flex flex-col justify-center items-start py-20" id="hero">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-container/20 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-tertiary/10 blur-[100px] rounded-full"></div>
          </div>
          
          <motion.div {...fadeIn} className="relative z-[120]">
            <motion.h1 
              className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-6 animate-logo-gradient inline-block origin-left py-6 leading-tight relative z-[130]"
              style={{ 
                scale: heroLogoScale,
                x: heroLogoX,
                y: heroLogoY,
                opacity: heroLogoOpacity
              }}
            >
              Voyanta
            </motion.h1>
            <div className="block px-4 py-1 rounded-full bg-surface-container-high border border-outline-variant/20 text-primary font-mono text-sm mb-6 w-fit">
              PM Portfolio Case Study
            </div>
            <p className="text-2xl md:text-3xl font-light text-on-surface-variant max-w-2xl mb-12">
              AI-Native Travel Planning for <span className="tricolour-india text-[1.3em] ml-1">India</span> and World
            </p>
          </motion.div>

          {/* Stat Bar - Made sticky at top of viewport when scrolling */}
          <div className="sticky top-24 z-30 w-full py-4 bg-surface/80 backdrop-blur-md -mx-4 px-4 md:mx-0 md:px-0">
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full max-w-5xl"
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true }}
            >
              <TiltCard><StatCard value="<30s" label="Gen Speed" /></TiltCard>
              <TiltCard><StatCard value="AI" label="Powered" /></TiltCard>
              <TiltCard><StatCard value="30M+" label="Market" /></TiltCard>
              <TiltCard><StatCard value="50+" label="Rules" /></TiltCard>
              <TiltCard><StatCard value="₹ $ € ¥ ₽" label="Multicurrency Support" /></TiltCard>
            </motion.div>
          </div>
        </section>

        {/* The Problem */}
        <section className="py-24" id="problem">
          <motion.div className="max-w-4xl" {...fadeIn}>
            <h2 className="text-4xl font-bold mb-12">The Triple Cognitive Tax</h2>
            <div className="grid md:grid-cols-3 gap-12">
              <ProblemItem 
                icon={<Search className="text-primary" />} 
                title="Search Tax" 
                description="Filtering through 200+ conflicting hotel reviews and flight options across 5 different tabs." 
              />
              <ProblemItem 
                icon={<Calculator className="text-primary" />} 
                title="Logic Tax" 
                description="Calculating travel time vs. budget vs. regional logistics like IRCTC schedules." 
              />
              <ProblemItem 
                icon={<Truck className="text-primary" />} 
                title="Logistics Tax" 
                description="Executing the plan without it falling apart due to missing last-mile connectivity." 
              />
            </div>
            <div className="mt-16 p-8 rounded-2xl bg-surface-container-low border-l-4 border-primary">
              <h4 className="text-sm font-mono text-primary mb-2 uppercase tracking-tighter">Why Now?</h4>
              <p className="text-xl italic">The Indian market is shifting from "fixed packages" to "custom-built experiences," but the tooling remains stuck in 2012.</p>
            </div>
          </motion.div>
        </section>

        {/* Personas */}
        <section className="py-24 scroll-mt-24" id="personas">
          <motion.h2 className="text-4xl font-bold mb-12" {...fadeIn}>Who are we building for?</motion.h2>
          <motion.div 
            className="grid lg:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
          >
            <TiltCard>
              <PersonaCard 
                name="Ananya" 
                role="SOLO ADVENTURER" 
                image="https://lh3.googleusercontent.com/aida-public/AB6AXuA4J4uDRh8XehDi7HTy9XGKaqfKimbCHFHsNO1vWalHiNvk05pXjXtgVglBSCqsxXJ9-n3hk_Qubh-HpAT1g37JJt0avbNRrqD_MTkcjzebKB2FuZ9XlsQmP32U3b5VHxMWCC2iggzOgmyyykI4rMXG4adPKaF4NA1fx0M6UX9ChiatFJ0RXGJJX8448G4UEOywSgok-10BLig2zF4QRgfrPQXpOoGX8CUWYDWJ4p6lp8XojX_oDMZfBaS3grDmmUAWZPBClS_rZiOL"
                jtbd="Explore offbeat cafes and hiking trails without hours of planning."
                pains="Safety concerns and fragmented transport info."
                value='"Verified Safe" itineraries generated in seconds.'
              />
            </TiltCard>
            <TiltCard>
              <PersonaCard 
                name="Rahul" 
                role="GROUP LEAD" 
                image="https://lh3.googleusercontent.com/aida-public/AB6AXuDRf91KrOyhQu9Lu57hoJfUCwJn7jNpCIqlNwV09xuEz64gObfnJCu1vQ--kRmppHnKrAhTAvGeA1608PufWr7VwhCeSGbX18Vc-deURrQTAbbel2uNA1eGtQylstAy1WhKC6VTQduOFVPpMjznVhZDeOEig_c2OkGsolLrqyKIytdOFm6dS9IyOnaemQ6TjfLF-OWm1vceXGjPl4GQK5oY0FcpKYPnwP0z7nBwJ9_8mO2W2lxnOFs8yn-wYXiy0gRHnDCSqpjwocHx"
                jtbd="Organize a bachelor trip for 8 people with varying budgets."
                pains="Decision fatigue and splitting bills/tasks."
                value="Multi-modal cost breakdowns and shared drafts."
              />
            </TiltCard>
            <TiltCard>
              <PersonaCard 
                name="Priya" 
                role="FAMILY PLANNER" 
                image="https://lh3.googleusercontent.com/aida-public/AB6AXuBK-VRkMrMKK1awnmR6ABZrVxO92cJPHMAhGYukSXZA91lmFWmJmA2lAhYbNCV_dkIt3-632nEDjs4AHLoQNalU9LwRbljVQMcyqdn1KqL2KsmD4MIdFu1WbgcA_aDlAwc3w1kRhjgj7SoLZA28CWbW_nQezUkXZOTJvf5-wTQtPRofUausedu9kVwnG01TqMQugrHTR1LqJhMlUp61vilwiTlDBXmEKHfR53op75yABEP6hW5ngSROxPm50kcda_WxRrXNfOS5KON3"
                jtbd="Coordinate multi-generational trip for kids and seniors."
                pains="Accessibility needs and dietary restrictions."
                value="Low-friction routes and family-friendly tagging."
              />
            </TiltCard>
            <TiltCard>
              <PersonaCard 
                name="Vikram" 
                role="TRAVEL CREATOR" 
                image="https://lh3.googleusercontent.com/aida-public/AB6AXuA1U8_7RVGoeKuRaVICm_yyPEjcXh96H9UlnezJht-Fktm4BGv556gqNoQEdKg4KZW-YbQqHwL_PXnT5GWo5Or_NvZcdd9977FFSR72yywuyGZtq29dcJk36nYjMStuS064LxbCbCBt8HXhY_fRS8rvadVr8gwDhNmCQLjesiLhQNJvyMPjdfEH6znlgel1bXlBztZ874f81s1b2TwcF-z6EvassqRwU0OkA37uflbgw6NLHzG9NI385bji8CdHXWw39qI27TkAneIC"
                jtbd="Build and sell curated trip plans to his 40k Instagram followers."
                pains="No platform lets him monetize his local knowledge directly."
                value="Creator Wallet — earn ₹30 per download of every published trip."
              />
            </TiltCard>
          </motion.div>
        </section>

        {/* User Journey */}
        <section className="py-24 scroll-mt-24" id="journey">
          <motion.div {...fadeIn}>
            <div className="mb-16">
              <h2 className="text-4xl font-bold mb-4">The User Journey</h2>
              <p className="text-xl text-on-surface-variant">From intent to itinerary in under 3 minutes.</p>
            </div>

            <div className="relative">
              {/* Connection Line (Desktop) */}
              <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-outline-variant/20 -translate-y-1/2 z-0"></div>
              
              <div className="grid lg:grid-cols-7 gap-8 relative z-10">
                <JourneyStep 
                  step="1" 
                  icon={<Search size={24} />} 
                  title="Trip Intent" 
                  desc="User sets destination, dates, group size, budget tier, and travel mode." 
                />
                <JourneyStep 
                  step="2" 
                  icon={<Zap size={24} />} 
                  title="3-Phase AI Pipeline" 
                  desc="Phase 01 builds the backbone. Phase 02 generates day plans in parallel chains. Phase 03 geo-verifies every place." 
                />
                <JourneyStep 
                  step="3" 
                  icon={<Layout size={24} />} 
                  title="View Itinerary" 
                  desc="Full day-by-day plan with timings, costs, maps links, and travel time between activities." 
                />
                <JourneyStep 
                  step="4" 
                  icon={<Sparkles size={24} />} 
                  title="Customise" 
                  desc="Swap activities, regenerate a single day, or adjust the trip theme. Edit rate <30% is our quality bar." 
                />
                <JourneyStep 
                  step="5" 
                  icon={<MapPin size={24} />} 
                  title="Travel Day" 
                  desc="Follow the plan with activity-by-activity navigation. (Real-time Execution Mode — Roadmap V2)" 
                />
                <JourneyStep 
                  step="6" 
                  icon={<CreditCard size={24} />} 
                  title="Track Expense" 
                  desc="Log expenses in any currency, split costs with co-travellers, and stay under budget continuously." 
                />
                <JourneyStep 
                  step="7" 
                  icon={<Users size={24} />} 
                  title="Share or Publish" 
                  desc="Share a draft with co-travellers or publish to the Creator Wallet for others to download." 
                />
              </div>
            </div>
          </motion.div>
        </section>

        {/* Strategic Assumptions */}
        <section className="py-24 scroll-mt-24" id="strategy">
          <motion.div {...fadeIn}>
            <h2 className="text-4xl font-bold mb-4">Strategic Assumptions</h2>
            <p className="text-on-surface-variant mb-12">How we de-risked the product before writing a single line of code.</p>
            <div className="overflow-x-auto rounded-2xl border border-outline-variant/10">
              <table className="w-full border-collapse bg-surface-container-low/30">
                <thead>
                  <tr className="bg-surface-container-lowest text-left text-xs font-mono text-primary uppercase">
                    <th className="p-6 border-b border-outline-variant/20">Assumption</th>
                    <th className="p-6 border-b border-outline-variant/20">Confidence</th>
                    <th className="p-6 border-b border-outline-variant/20">Evidence Source</th>
                    <th className="p-6 border-b border-outline-variant/20">Kill Condition</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-sm">
                  <TableRow 
                    assumption="Users will pay for curated itineraries vs free search"
                    confidence="HIGH"
                    confidenceColor="text-primary bg-primary-container/20"
                    evidence="Concierge MVP (N=50): 12% mock purchase conversion"
                    kill="<5% conversion on live production payment walls"
                  />
                  <TableRow 
                    assumption="Deterministic geo-verification eliminates hallucinated places better than AI self-correction"
                    confidence="HIGH"
                    confidenceColor="text-primary bg-primary-container/20"
                    evidence="Phase 3 pipeline: 0 AI tokens when all places resolve via Nominatim"
                    kill="Nominatim success rate <80% in Tier 2 cities"
                  />
                  <TableRow 
                    assumption="A map-integrated chronological timeline decreases decision fatigue more effectively than traditional text list itineraries"
                    confidence="HIGH"
                    confidenceColor="text-primary bg-primary-container/20"
                    evidence="A/B Usability Test (N=40): Map-timeline cohorts finished trip planning 40% faster"
                    kill="Itinerary completion rates do not show statistically significant improvement vs. text lists"
                  />
                  <TableRow 
                    assumption="Collaborative group planning (shared links, voting) serves as the primary driver for organic viral growth"
                    confidence="HIGH"
                    confidenceColor="text-primary bg-primary-container/20"
                    evidence="Focus groups: 80%+ of group trips have a designated planner who shares draft links with co-travellers"
                    kill="Viral coefficient (K-factor) remains < 0.5 after launching collaborative features"
                  />
                  <TableRow 
                    assumption="Integrating real-time multicurrency expense tracking directly into the active itinerary increases post-travel utility and retention"
                    confidence="MEDIUM"
                    confidenceColor="text-tertiary bg-tertiary-container/20"
                    evidence="User research: 85% of group travellers manually use separate spreadsheets to split costs today"
                    kill="Active adoption of expense tracking is <15% of total active trips in the beta phase"
                  />
                  <TableRow 
                    assumption="AI-suggested packing lists and weather forecast warnings dramatically reduce manual pre-trip trip preparation stress"
                    confidence="MEDIUM"
                    confidenceColor="text-tertiary bg-tertiary-container/20"
                    evidence="Survey feedback: 72% of travellers indicate packing checklists are most-forgotten"
                    kill="Weekly active engagement with templates falls below 20% of generated trips"
                  />
                  <TableRow 
                    assumption="Pushing context-aware local alternative recommendations in real time during travel offset disruptions (e.g., rain, closed venues)"
                    confidence="MEDIUM"
                    confidenceColor="text-tertiary bg-tertiary-container/20"
                    evidence="Beta test telemetry: 64% of travellers utilized the 'change route' function under inclement weather"
                    kill="User satisfaction score (CSAT) for real-time alternatives drops below 3.5/5.0"
                  />
                  <TableRow 
                    assumption="Users are willing to share or publish their curated personal travel plans to a public Creator Wallet for peer reputation"
                    confidence="LOW"
                    confidenceColor="text-error bg-error-container/20"
                    evidence="Initial user interviews (N=20): 45% express interest in showing off travel skills, but want compensation/likes"
                    kill="Published itineraries count is <5% of total generated plans after launch"
                  />
                  <TableRow 
                    assumption="Co-travellers will proactively link their personal bank cards to enable auto-expense splitting during ongoing trips"
                    confidence="LOW"
                    confidenceColor="text-error bg-error-container/20"
                    evidence="User interviews: High security friction; only 15% of respondents are comfortable sharing banking syncs"
                    kill="<3% of overall active groups complete a full auto-synced payment cycle"
                  />
                  <TableRow 
                    assumption="Users will book flights and hotels directly inside the app when presented with highly personalized affiliate links"
                    confidence="LOW"
                    confidenceColor="text-error bg-error-container/20"
                    evidence="Hypothesis only: most users research itineraries online but prefer booking directly via verified carriers"
                    kill="Affiliate click-through-to-purchase conversion stays below 0.5% over a 3-month window"
                  />
                </tbody>
              </table>
            </div>

          </motion.div>
        </section>

        {/* AI Engine */}
        <section className="py-24 scroll-mt-24" id="ai-engine">
          <div className="max-w-6xl mx-auto">
            <motion.div className="mb-12" {...fadeIn}>
              <h2 className="text-5xl font-extrabold mb-4 text-gradient">The Neural Pipeline</h2>
              <p className="text-xl text-on-surface-variant max-w-2xl">
                I designed a 3-phase hybrid architecture that cascades through the world's most powerful LLMs, grounded by real-world geospatial data.
              </p>
            </motion.div>

            <motion.div 
              className="glass-panel-heavy p-8 md:p-12 rounded-3xl glow-indigo relative overflow-hidden"
              {...fadeIn}
            >
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
              <div className="grid lg:grid-cols-12 gap-12 items-start">
                {/* Left: The Process */}
                <div className="lg:col-span-7 space-y-12">
                  <div className="relative pl-12 border-l-2 border-primary/20">
                    {/* Phase 1 */}
                    <div className="mb-16">
                      <div className="absolute -left-6 top-0 w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center shadow-lg shadow-primary/30 transform -rotate-6">
                        <Rocket className="text-white" size={24} />
                      </div>
                      <h3 className="text-2xl font-bold mb-3 flex items-center gap-3">
                        <span className="text-primary font-mono text-sm uppercase tracking-widest">Phase 01</span>
                        The Neural Backbone
                      </h3>
                      <p className="text-on-surface-variant leading-relaxed text-lg mb-4">
                        A single structured call to <code className="text-primary bg-primary/10 px-2 py-0.5 rounded">openai/gpt-oss-120b</code> (via Groq) produces day_outlines — each entry locking in city, theme, and overnight positions. Silently falls back to a code-based allocator if the AI call fails.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Tag label="Density Mapping" />
                        <Tag label="Route Optimization" />
                        <Tag label="openai/gpt-oss-120b" />
                        <Tag label="Code Fallback" />
                      </div>
                    </div>

                    {/* Phase 2 */}
                    <div className="mb-16">
                      <div className="absolute -left-6 top-[220px] md:top-[180px] w-12 h-12 rounded-2xl bg-indigo-900 border-2 border-primary flex items-center justify-center shadow-lg shadow-indigo-500/20 transform rotate-6">
                        <Sparkles className="text-primary" size={24} />
                      </div>
                      <h3 className="text-2xl font-bold mb-3 flex items-center gap-3">
                        <span className="text-primary font-mono text-sm uppercase tracking-widest">Phase 02</span>
                        Creative Generation — Prompt Chaining
                      </h3>
                      <p className="text-on-surface-variant leading-relaxed text-lg mb-4">
                        City chains run in PARALLEL via Future.wait. Within each city, calls are SEQUENTIAL — each call passes the accumulated doNotRepeat list to the next, guaranteeing zero attraction duplication across days. Uses <code className="text-primary bg-primary/10 px-2 py-0.5 rounded">llama-3.1-8b-instant</code> (131k TPM) with a static system prompt + dynamic user prompt per segment.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Tag label="Parallel City Chains" />
                        <Tag label="Sequential Context Memory" />
                        <Tag label="llama-3.1-8b" />
                        <Tag label="Zero Duplication" />
                      </div>
                    </div>

                    {/* Phase 3 */}
                    <div>
                      <div className="absolute -left-6 top-[440px] md:top-[360px] w-12 h-12 rounded-2xl bg-slate-800 border border-outline-variant flex items-center justify-center shadow-lg transform rotate-12">
                        <Gavel className="text-primary" size={24} />
                      </div>
                      <h3 className="text-2xl font-bold mb-3 flex items-center gap-3">
                        <span className="text-primary font-mono text-sm uppercase tracking-widest">Phase 03</span>
                        Reality Grounding — Tool Chaining
                      </h3>
                      <p className="text-on-surface-variant leading-relaxed text-lg mb-4">
                        Orchestrates <code className="text-primary bg-primary/10 px-2 py-0.5 rounded">Nominatim</code>, <code className="text-primary bg-primary/10 px-2 py-0.5 rounded">Overpass API</code>, and <code className="text-primary bg-primary/10 px-2 py-0.5 rounded">OSRM</code> to geo-verify every place. Aiming for ZERO AI tokens in this phase; AI is only used as a "Cognitive Auditor" for targeted repair if tools fail to resolve a candidate.
                      </p>
                      <div className="flex flex-nowrap gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
                        <Tag label="Zero-Token Logic" />
                        <Tag label="Geo-Verification" />
                        <Tag label="OSRM Timings" />
                        <Tag label="Targeted AI Repair" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Visual & Tech Depth */}
                <div className="lg:col-span-5 space-y-8 sticky top-32">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl group-hover:bg-primary/30 transition-all duration-500 rounded-3xl"></div>
                    <div className="relative glass-panel p-2 rounded-3xl border border-primary/30 overflow-hidden aspect-square flex items-center justify-center bg-slate-900">
                      <img 
                        className="w-full h-full object-cover rounded-2xl opacity-80 group-hover:scale-105 transition-transform duration-700" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1U8_7RVGoeKuRaVICm_yyPEjcXh96H9UlnezJht-Fktm4BGv556gqNoQEdKg4KZW-YbQqHwL_PXnT5GWo5Or_NvZcdd9977FFSR72yywuyGZtq29dcJk36nYjMStuS064LxbCbCBt8HXhY_fRS8rvadVr8gwDhNmCQLjesiLhQNJvyMPjdfEH6znlgel1bXlBztZ874f81s1b2TwcF-z6EvassqRwU0OkA37uflbgw6NLHzG9NI385bji8CdHXWw39qI27TkAneIC"
                        alt="AI Architecture Visualization"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-6 left-6 right-6 p-4 glass-panel rounded-xl border border-white/10 text-center">
                        <p className="text-xs font-mono text-primary font-bold tracking-widest uppercase">Model Cascade Architecture</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                    <p className="text-sm italic text-indigo-300 leading-relaxed">
                      "We use a multi-layer model cascade. Groq (Llama 3) handles the high-TPS generation, while Gemini 2.0 Flash acts as the high-context auditor. OpenRouter provides the fallback bridge."
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-container-lowest/50 p-4 rounded-xl border border-outline-variant/10">
                      <p className="text-xs font-bold text-primary mb-1 uppercase">Latency</p>
                      <p className="text-sm font-mono">Avg. 30s / Trip</p>
                    </div>
                    <div className="bg-surface-container-lowest/50 p-4 rounded-xl border border-outline-variant/10">
                      <p className="text-xs font-bold text-primary mb-1 uppercase">Reliability</p>
                      <p className="text-sm font-mono">99.9% Uptime</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* India-Specific Differentiation Grid */}
              <div className="mt-16 pt-12 border-t border-outline-variant/20">
                <h4 className="text-2xl font-bold mb-8 flex items-center gap-3">
                  <Flag className="text-primary" size={24} />
                  India-Specific Differentiation
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <DiffCard title="Gender-Aware" desc="Prioritizes 'Safe Zones' and vetted transport for female solo travelers." />
                  <DiffCard title="IRCTC Logic (Planned)" desc="Deep integration for Tatkal timings and dynamic PNR status logic for train-heavy routes." />
                  <DiffCard title="OSRM Routing" desc="Optimized for 'last-mile' auto/cab availability in Tier 2 cities." />
                  <DiffCard title="Multicurrency" desc="Seamlessly handle ₹, $, €, ¥, and ₽ with real-time conversion and local payment insights." />
                  <DiffCard title="AI Hidden Gems" desc="Proprietary DB of 5000+ local spots missing from major OTAs, verified via Overpass API." />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Infrastructure Section */}
        <section className="py-24 scroll-mt-24" id="infrastructure">
          <motion.div {...fadeIn}>
            <div className="mb-16">
              <h2 className="text-4xl font-bold mb-4">Infrastructure & Key Resolution</h2>
              <p className="text-xl text-on-surface-variant">How we manage API costs and rate limits at scale.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="glass-panel p-8 rounded-3xl border border-primary/20">
                <div className="w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center mb-6">
                  <Layers className="text-white" size={24} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Cloudflare Worker Proxy</h3>
                <p className="text-on-surface-variant leading-relaxed mb-6">
                  All frontend requests hit a Cloudflare Worker proxy. This allows us to:
                </p>
                <ul className="space-y-3 text-on-surface-variant">
                  <li className="flex items-start gap-3">
                    <Check className="text-primary shrink-0 mt-1" size={18} />
                    <span><strong>Rotate Keys:</strong> Automatically switch between multiple Groq/Gemini keys to bypass rate limits.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary shrink-0 mt-1" size={18} />
                    <span><strong>Keyless Frontend:</strong> The client never sees an API key; the worker injects secrets server-side.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary shrink-0 mt-1" size={18} />
                    <span><strong>Caching:</strong> Cache common city-outline responses to reduce LLM costs by ~15%.</span>
                  </li>
                </ul>
              </div>

              <div className="glass-panel p-8 rounded-3xl border border-primary/20">
                <div className="w-12 h-12 rounded-2xl bg-indigo-900 flex items-center justify-center mb-6">
                  <Zap className="text-primary" size={24} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Model Cascade</h3>
                <p className="text-on-surface-variant leading-relaxed mb-6">
                  A multi-layer fallback system ensures generation never fails:
                </p>
                <ul className="space-y-3 text-on-surface-variant">
                  <li className="flex items-start gap-3">
                    <Check className="text-primary shrink-0 mt-1" size={18} />
                    <span><strong>Layer 1 (Groq):</strong> Primary choice for Phase 01 & 02 due to sub-second latency.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary shrink-0 mt-1" size={18} />
                    <span><span><strong>Layer 2 (Gemini 2.0 Flash):</strong> Fallback if Groq hits TPM limits; primary for Phase 03 repair.</span></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary shrink-0 mt-1" size={18} />
                    <span><strong>Layer 3 (OpenRouter):</strong> Final bridge to access GPT-4o or Claude 3.5 if primary providers are down.</span>
                  </li>
                </ul>
              </div>

              <div className="glass-panel p-8 rounded-3xl border border-primary/20">
                <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center mb-6">
                  <Database className="text-primary" size={24} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Database Evolution</h3>
                <p className="text-on-surface-variant leading-relaxed mb-6">
                  Strategic data persistence plan for cost-efficiency:
                </p>
                <ul className="space-y-3 text-on-surface-variant">
                  <li className="flex items-start gap-3">
                    <Check className="text-primary shrink-0 mt-1" size={18} />
                    <span><strong>Phase 1 (Firebase):</strong> Leveraged for rapid prototyping and generous free tier for initial user/trip data.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary shrink-0 mt-1" size={18} />
                    <span><strong>Phase 2 (Supabase):</strong> Planned migration for the growth phase to optimize for server-based pricing.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="text-primary shrink-0 mt-1" size={18} />
                    <span><strong>Cost Optimization:</strong> Transitioning from per-request (Firebase) to instance-based (Supabase) scaling.</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Metrics */}
        <section className="py-24 scroll-mt-24" id="metrics">
          <motion.div {...fadeIn}>
            <h2 className="text-4xl font-bold mb-12">Metrics Scorecard</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <MetricCard 
                type="North Star" 
                title="Successful Travel Index" 
                desc="The % of users who generate a plan, follow through to execute the trip (verified by real-time in-app expense logging), and leave a post-trip rating of ≥4.5 stars."
                accent="border-primary/20"
                labelColor="text-primary"
                target="Target: >35%"
              />
              <MetricCard 
                type="Input Metric" 
                title="Generation Latency" 
                desc="End-to-end time from prompt to full 3-phase pipeline completion."
                accent="border-outline-variant/10"
                labelColor="text-slate-500"
                target="Target: <30s"
              />
              <MetricCard 
                type="Retention" 
                title="D30 Power User" 
                desc="Day 30 retention for users generating >2 plans/month."
                accent="border-tertiary/20"
                labelColor="text-tertiary"
                target="Target: 40%"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <MetricCard 
                type="Revenue" 
                title="Coupon Redemption" 
                desc="Conversion rate from 'Itinerary Locked' to 'Coupon Pack Purchased'."
                accent="border-primary/20"
                labelColor="text-primary"
                target="Target: 12%"
              />
              <MetricCard 
                type="Counter-Metric" 
                title="AI Edit Rate" 
                desc="If users edit >30% of AI results, our logic engine is failing the 'Trust' test."
                accent="border-error/20"
                labelColor="text-error"
                target="Limit: <25%"
              />
            </div>
          </motion.div>
        </section>

        {/* Roadmap & Growth Section */}
        <section className="py-24 scroll-mt-24" id="growth">
          <motion.div {...fadeIn}>
            <div className="text-center mb-16">
              <h2 className="text-5xl font-extrabold mb-6 text-gradient">The Path Forward</h2>
              <p className="text-xl text-on-surface-variant max-w-2xl mx-auto">
                How we scale from a free beta to a sustainable, AI-native travel ecosystem.
              </p>
            </div>

            {/* Feature Roadmap Sub-section */}
            <div className="mb-24">
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <Map className="text-primary" size={24} />
                Execution Roadmap
              </h3>
              <div className="space-y-4">
                <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2 px-6">Phase 1: Core & Intelligence</div>
                <RoadmapItem version="V1 P0" title="Core Gen Engine & India Logic" desc="LLM + Deterministic Travel Rules" status="Built" />
                <RoadmapItem version="V1 P1" title="Multi-modal Booking Integration" desc="Flight + Train + Cab unified API" status="Pending" />
                <RoadmapItem version="V1 P2" title="Vernacular Voice Support" desc="Hindi, Hinglish, & regional dialect inputs" status="Pending" />
                <RoadmapItem version="V1 P3" title="AI Concierge / Chatbot" desc="Post-generation targeted edits via GPT-OSS-120B" status="Pending" />
                
                <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-8 mb-2 px-6">Phase 2: Execution & Utility</div>
                <RoadmapItem version="V2 P0" title="Real-time Execution Mode" desc="Navigating view with auto-rerouting & OSRM integration" status="Pending" />
                <RoadmapItem version="V2 P1" title="Collaborative Planning" desc="Shared links & voting stored in Firestore" status="Pending" />
                <RoadmapItem version="V2 P2" title="AI Budget Tracker" desc="Real-time spend logging vs. Phase 1 estimates" status="Pending" />
                <RoadmapItem version="V2 P3" title="Offline-First Trip Pack" desc="Pre-downloaded itinerary & map tiles cache" status="Pending" />
                <RoadmapItem version="V2 P4" title="Google Calendar Integration" desc="Auto-sync travel & stay events once trip is confirmed" status="Pending" />
                
                <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-8 mb-2 px-6">Phase 3: Visual & Social Intelligence</div>
                <RoadmapItem version="V3 P0" title="Reel-to-Itinerary Engine" desc="Identify locations from Instagram/YouTube clips to auto-gen full itineraries" status="Pending" />
                <RoadmapItem version="V3 P1" title="Social Itinerary Remix" desc="One-click clone and modify itineraries from creators you follow" status="Pending" />
              </div>
            </div>

            {/* Revenue Architecture Sub-section */}
            <div className="mb-24">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <CreditCard className="text-primary" size={24} />
                  Revenue Architecture
                </h3>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-mono text-[10px] uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Status: 100% Free
                </div>
              </div>
              
              <div className="grid lg:grid-cols-3 gap-8 mb-12">
                {/* Subscription */}
                <div className="glass-panel p-8 rounded-3xl border border-primary/30 relative overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 bg-primary text-white px-4 py-1 text-xs font-bold rounded-bl-xl uppercase tracking-tighter">Planned</div>
                  <h4 className="text-xl font-bold mb-2">Monthly Sub</h4>
                  <p className="text-on-surface-variant text-sm mb-6">For the power traveler who wants zero friction. Unlocks post-10k downloads.</p>
                  <div className="text-3xl font-extrabold mb-6">₹TBD <span className="text-sm font-normal text-on-surface-variant">/mo</span></div>
                  <ul className="space-y-4 mb-8 flex-grow">
                    <li className="flex items-center gap-3 text-sm"><Check size={18} className="text-primary" /> Unlimited new trips</li>
                    <li className="flex items-center gap-3 text-sm"><Check size={18} className="text-primary" /> Offline-First Trip Pack access</li>
                    <li className="flex items-center gap-3 text-sm"><Check size={18} className="text-primary" /> Priority API access</li>
                  </ul>
                </div>

                {/* Coupon Packs */}
                <div className="glass-panel p-8 rounded-3xl border border-outline-variant/20 relative flex flex-col bg-surface-container-low">
                  <div className="absolute top-0 right-0 bg-slate-700 text-white px-4 py-1 text-xs font-bold rounded-bl-xl uppercase tracking-tighter">Planned</div>
                  <h4 className="text-xl font-bold mb-2">Coupon Packs</h4>
                  <p className="text-on-surface-variant text-sm mb-6">Pay-per-use model for occasional explorers.</p>
                  <div className="space-y-3 mb-8 flex-grow">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-surface-container-high border border-outline-variant/10">
                      <span className="text-sm font-bold">Starter (1 Coupon)</span>
                      <span className="text-primary font-mono">₹99</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-surface-container-high border border-outline-variant/10">
                      <span className="text-sm font-bold">Explorer (3 Coupons)</span>
                      <span className="text-primary font-mono">₹249</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-surface-container-high border border-outline-variant/10">
                      <span className="text-sm font-bold">Adventurer (5 Coupons)</span>
                      <span className="text-primary font-mono">₹399</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 italic">1 Coupon = 1 Trip Generation or 5 AI Concierge Edits</p>
                </div>

                {/* Creator Economy */}
                <div className="glass-panel p-8 rounded-3xl border border-tertiary/30 relative flex flex-col">
                  <div className="absolute top-0 right-0 bg-tertiary text-white px-4 py-1 text-xs font-bold rounded-bl-xl uppercase tracking-tighter">Planned</div>
                  <h4 className="text-xl font-bold mb-2">Creator Wallet</h4>
                  <p className="text-on-surface-variant text-sm mb-6">Monetize your travel expertise.</p>
                  <div className="text-3xl font-extrabold mb-6">₹30 <span className="text-sm font-normal text-on-surface-variant">/download</span></div>
                  <ul className="space-y-4 mb-8 flex-grow">
                    <li className="flex items-center gap-3 text-sm"><Check size={18} className="text-tertiary" /> Publish trips to community</li>
                    <li className="flex items-center gap-3 text-sm"><Check size={18} className="text-tertiary" /> Earn for every download</li>
                    <li className="flex items-center gap-3 text-sm"><Check size={18} className="text-tertiary" /> Build a travel brand</li>
                  </ul>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/10">
                <h5 className="text-xs font-mono text-primary mb-2 uppercase tracking-widest">Monetization Strategy</h5>
                <p className="text-base leading-relaxed text-on-surface-variant">
                  The Indian market is highly value-conscious. By offering <strong>one free trip</strong> to every new user and then transitioning to a <strong>coupon-based refill system (₹99/trip)</strong>, we lower the barrier to entry while maintaining a clear path to LTV. The 10k download trigger ensures we don't prematurely optimize for revenue before achieving critical mass.
                </p>
              </div>
            </div>

            {/* Future Vision Sub-section */}
            <div>
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <Zap className="text-primary" size={24} />
                Long-term Vision
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="glass-panel p-8 rounded-3xl border border-primary/20 relative overflow-hidden group">
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                      <Layers className="text-primary" size={28} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-3">Freemium Ecosystem</h4>
                      <p className="text-on-surface-variant text-sm leading-relaxed">
                        Transitioning from a tool to a platform. Basic planning remains free, while premium features like offline maps, priority support, and exclusive deals move to a subscription tier.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-8 rounded-3xl border border-tertiary/20 relative overflow-hidden group">
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-tertiary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-tertiary/20 flex items-center justify-center shrink-0">
                      <MessageSquare className="text-tertiary" size={28} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-3">AI Travel Concierge</h4>
                      <p className="text-on-surface-variant text-sm leading-relaxed">
                        A natural language interface for targeted edits. "Swap Day 3 lunch for something vegetarian"—the AI handles the logistics without full regeneration.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-8 rounded-3xl border border-indigo-400/20 relative overflow-hidden group">
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-400/20 flex items-center justify-center shrink-0">
                      <Route className="text-indigo-400" size={28} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-3">Execution Mode</h4>
                      <p className="text-on-surface-variant text-sm leading-relaxed">
                        Real-time navigation that tracks progress, marks activities as done, and auto-reroutes via OSRM if you're running late.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-8 rounded-3xl border border-pink-500/20 relative overflow-hidden group">
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-pink-500/20 flex items-center justify-center shrink-0">
                      <Video className="text-pink-500" size={28} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-3">Reel-to-Trip Magic</h4>
                      <p className="text-on-surface-variant text-sm leading-relaxed">
                        The ultimate discovery shortcut. Upload an Instagram Reel or YouTube Short, and Voyanta identifies the places to build a full, executable itinerary in seconds.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Risks */}
        <section className="py-24 scroll-mt-24" id="risks">
          <motion.h2 className="text-4xl font-bold mb-8" {...fadeIn}>Risk Matrix</motion.h2>
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div className="space-y-6" {...fadeIn}>
              <RiskCard 
                title="Hallucination Risk" 
                desc="AI suggests non-existent trains or hotels." 
                prob="HIGH" 
                sev="CRITICAL" 
                mitigation="Phase 3 deterministic geo-verification via Nominatim."
                color="border-error"
                bgColor="bg-error-container/5"
              />
              <RiskCard 
                title="Safety Blindspots" 
                desc="Inaccurate safety ratings for female solo travelers." 
                prob="LOW" 
                sev="CRITICAL" 
                mitigation="Community-vetted heatmaps & human audits."
                color="border-tertiary"
                bgColor="bg-tertiary-container/5"
              />
              <RiskCard 
                title="API Rate Limit Exhaustion" 
                desc="Groq or Gemini keys hitting TPM/RPM limits during peak hours." 
                prob="MEDIUM" 
                sev="HIGH" 
                mitigation="Cloudflare Worker proxy with key rotation & model cascade."
                color="border-primary"
                bgColor="bg-primary-container/5"
              />
              <RiskCard 
                title="Tier 2 / 3 City Data Gaps" 
                desc="Incomplete POI data in Overpass API for non-metro cities." 
                prob="MEDIUM" 
                sev="MEDIUM" 
                mitigation="Hybrid fallback to LLM-only generation with explicit 'Verify Locally' tags."
                color="border-slate-500"
                bgColor="bg-slate-500/5"
              />
            </motion.div>
            <motion.div 
              className="flex flex-col justify-center p-10 glass-panel rounded-2xl border border-outline-variant/10 text-center"
              {...fadeIn}
            >
              <Brain className="text-primary mx-auto mb-6" size={48} />
              <p className="text-2xl font-bold mb-4">Risk thinking is where PM rigor shows.</p>
              <p className="text-on-surface-variant italic">Every great product is a series of solved trade-offs. I focus on identifying the "killer" risks before they become "killer" bugs.</p>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-24 mt-24 border-t border-outline-variant/10 text-center max-w-2xl mx-auto">
          <motion.div {...fadeIn}>
            <p className="text-xl leading-relaxed text-on-surface mb-12">
              My approach to Voyanta was rooted in high-fidelity strategy and technical depth. Beyond the "AI buzz," I focused on the unique logistical nuances of the Indian market—proving that product management is as much about understanding local anthropology as it is about leveraging global technology.
            </p>
            <div className="flex flex-col items-center gap-6">
              <button 
                onClick={() => setIsContactOpen(true)}
                className="bg-primary-container text-white px-10 py-4 rounded-full font-bold text-xl hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-primary/20 group flex items-center gap-3"
              >
                Let's Talk <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="flex gap-6 text-slate-500">
                <FooterLink href="#" icon={<Linkedin size={20} />} label="LinkedIn" />
                <FooterLink href="#" icon={<Twitter size={20} />} label="Twitter" />
                <FooterLink href="#" icon={<FileText size={20} />} label="Resume" />
              </div>
              <button 
                onClick={isAdmin ? () => setIsAdminPortalOpen(true) : (user ? () => alert(`Access Denied: ${user.email} is not authorized.`) : handleAdminLogin)}
                className="mt-12 group flex items-center gap-2 text-slate-600 hover:text-primary transition-colors text-xs font-mono uppercase tracking-widest"
              >
                <ShieldCheck size={14} className={isAdmin ? "text-primary shadow-[0_0_8px_rgba(79,70,229,0.4)]" : "text-slate-400"} />
                {isAdmin ? "Admin Dashboard" : (user ? "Unauthorized Access" : "Private Admin Access")}
              </button>
            </div>
          </motion.div>
        </footer>
        </div>
      </motion.main>

      {/* Contact Modal */}
      <AnimatePresence>
        {isContactOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsContactOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg glass-panel-heavy p-8 rounded-3xl border border-primary/20 shadow-2xl z-[510]"
            >
              <button 
                onClick={() => setIsContactOpen(false)}
                className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-3xl font-bold mb-2">Let's Connect</h2>
              <p className="text-on-surface-variant mb-8">Interested in Voyanta or my PM approach? Drop a message.</p>
              
              {formStatus === "success" ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCheck className="text-primary" size={40} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                  <p className="text-on-surface-variant mb-8">I'll get back to you as soon as possible.</p>
                  <button 
                    onClick={() => { setIsContactOpen(false); setFormStatus("idle"); }}
                    className="bg-primary-container text-white px-8 py-3 rounded-xl font-bold"
                  >
                    Close
                  </button>
                </motion.div>
              ) : (
                <form className="space-y-4" onSubmit={handleFormSubmit}>
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-primary uppercase">Name</label>
                    <input 
                      required 
                      type="text" 
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors" 
                      placeholder="John Doe" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-primary uppercase">Email</label>
                    <input 
                      required 
                      type="email" 
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors" 
                      placeholder="john@example.com" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-primary uppercase">Message</label>
                    <textarea 
                      required 
                      value={formMessage}
                      onChange={(e) => setFormMessage(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors h-32" 
                      placeholder="Tell me about your project..." 
                    />
                  </div>
                  <button 
                    disabled={formStatus === "submitting"}
                    className="w-full bg-primary-container text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-container/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {formStatus === "submitting" ? "Sending..." : "Send Message"} <Send size={18} />
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Portal Modal */}
      <AnimatePresence>
        {isAdminPortalOpen && isAdmin && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdminPortalOpen(false)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-5xl h-[80vh] glass-panel-heavy rounded-3xl border border-primary/30 flex flex-col overflow-hidden shadow-2xl z-[510]"
            >
              <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/50">
                <div>
                  <h2 className="text-3xl font-bold flex items-center gap-3">
                    <ShieldCheck className="text-primary" size={32} />
                    Voyanta Admin Console
                  </h2>
                  <p className="text-sm text-slate-500 font-mono mt-1">LOGGED IN AS: {user?.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex bg-surface-container-highest rounded-xl p-1 mr-4">
                    <button 
                      onClick={() => setAdminTab("inbox")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${adminTab === "inbox" ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-slate-200"}`}
                    >
                      <Inbox size={14} /> Inbox
                    </button>
                    <button 
                      onClick={() => setAdminTab("archive")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${adminTab === "archive" ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-slate-200"}`}
                    >
                      <Archive size={14} /> Archive
                    </button>
                  </div>
                  <a 
                    href="https://console.firebase.google.com/project/gen-lang-client-0906086794/firestore/databases/ai-studio-af1974e5-8b11-46d4-bc29-69110b5105d6/data"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-bold text-primary hover:underline bg-primary/10 px-4 py-2 rounded-lg"
                  >
                    Open Firebase Console <ExternalLink size={14} />
                  </a>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-slate-500 hover:text-error transition-colors bg-surface-container-highest rounded-lg"
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                  <button 
                    onClick={() => setIsAdminPortalOpen(false)}
                    className="p-2 text-slate-500 hover:text-white transition-colors"
                  >
                    <X size={28} />
                  </button>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto p-8 bg-surface/30">
                <div className="grid gap-6">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-500">
                      {adminTab === "inbox" ? <Inbox size={64} className="opacity-20 mb-4" /> : <Archive size={64} className="opacity-20 mb-4" />}
                      <p className="italic">No {adminTab === "inbox" ? "active" : "archived"} messages found.</p>
                    </div>
                  ) : (
                      messages.map((msg) => {
                        const isArchived = msg.status === "archived";
                        return (
                          <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={msg.id}
                            className="glass-panel p-6 rounded-2xl border border-outline-variant/10 hover:border-primary/20 transition-all group"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-outline-variant/5">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl uppercase">
                                  {msg.name?.charAt(0)}
                                </div>
                                <div>
                                  <h4 className="font-bold text-lg">{msg.name}</h4>
                                  <p className="text-sm text-primary underline">{msg.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="text-right">
                                  <p className="text-xs font-mono text-slate-500">RECEIVED AT</p>
                                  <p className="text-xs text-slate-400">
                                    {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleString() : 'Just now'}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => handleArchiveMessage(msg.id, msg.status)}
                                    className="p-2 bg-surface-container-highest rounded-xl text-slate-400 hover:text-primary transition-colors"
                                    title={!isArchived ? "Archive" : "Unarchive"}
                                  >
                                    {!isArchived ? <Archive size={18} /> : <History size={18} />}
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    className="p-2 bg-surface-container-highest rounded-xl text-slate-400 hover:text-error transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="bg-surface-container-lowest/50 p-4 rounded-xl text-on-surface-variant leading-relaxed">
                              {msg.message}
                            </div>
                          </motion.div>
                        );
                      })
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileNavItem({ href, label, onClick }: { href: string, label: string, onClick: () => void }) {
  return (
    <a 
      href={href} 
      onClick={onClick}
      className="text-xl font-bold text-slate-400 hover:text-indigo-400 transition-colors py-2"
    >
      {label}
    </a>
  );
}

function NavItem({ href, icon, label, active = false }: { href: string, icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <a 
      href={href} 
      className={`flex items-center gap-3 px-3 py-2 rounded-lg group transition-all active:scale-95 ${
        active ? "bg-indigo-500/20 text-indigo-300" : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
      }`}
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}

function StatCard({ value, label }: { value: string, label: string }) {
  return (
    <motion.div 
      variants={fadeIn}
      whileHover={{ 
        scale: 1.05, 
        rotateY: 10, 
        rotateX: -5,
        z: 50,
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
      }}
      className="glass-panel p-6 rounded-xl border border-outline-variant/10 preserve-3d transition-all duration-300 cursor-default"
    >
      <p className="font-mono text-primary text-2xl font-bold translate-z-20">{value}</p>
      <p className="text-xs text-slate-500 uppercase tracking-widest mt-1 translate-z-10">{label}</p>
    </motion.div>
  );
}

function ProblemItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="space-y-4 p-6 rounded-2xl hover:bg-surface-container-low transition-colors duration-300"
    >
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-on-surface-variant leading-relaxed">{description}</p>
    </motion.div>
  );
}

function PersonaCard({ name, role, image, jtbd, pains, value }: { name: string, role: string, image: string, jtbd: string, pains: string, value: string }) {
  return (
    <motion.div 
      variants={fadeIn}
      whileHover={{ 
        y: -15, 
        rotateY: 5,
        rotateX: 5,
        boxShadow: "0 30px 60px -12px rgba(0,0,0,0.5), 0 18px 36px -18px rgba(0,0,0,0.5)"
      }}
      className="glass-panel p-8 rounded-2xl border border-outline-variant/10 flex flex-col preserve-3d transition-all duration-500"
    >
      <div className="flex items-center gap-4 mb-6 translate-z-20">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary">
          <img className="w-full h-full object-cover" src={image} alt={name} referrerPolicy="no-referrer" />
        </div>
        <div>
          <h3 className="text-xl font-bold">{name}</h3>
          <span className="text-primary font-mono text-xs">{role}</span>
        </div>
      </div>
      <div className="space-y-4 flex-grow translate-z-10">
        <PersonaDetail label="JTBD" text={jtbd} />
        <PersonaDetail label="PAINS" text={pains} />
        <PersonaDetail label="VALUE" text={value} bold />
      </div>
    </motion.div>
  );
}

function PersonaDetail({ label, text, bold = false }: { label: string, text: string, bold?: boolean }) {
  return (
    <div>
      <p className="text-xs font-mono text-slate-500 mb-1">{label}</p>
      <p className={`text-sm ${bold ? "font-bold" : ""}`}>{text}</p>
    </div>
  );
}

function TableRow({ assumption, confidence, confidenceColor, evidence, kill }: { assumption: string, confidence: string, confidenceColor: string, evidence: string, kill: string }) {
  return (
    <tr className="border-b border-outline-variant/10 hover:bg-surface-container/30 transition-colors group">
      <td className="p-6 group-hover:pl-8 transition-all duration-300">{assumption}</td>
      <td className="p-6">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${confidenceColor}`}>
          {confidence}
        </span>
      </td>
      <td className="p-6">{evidence}</td>
      <td className="p-6">{kill}</td>
    </tr>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="px-3 py-1 rounded bg-surface-container-high text-xs font-mono text-primary hover:bg-primary hover:text-on-primary transition-colors cursor-default">
      {label}
    </span>
  );
}

function DiffCard({ title, desc }: { title: string, desc: string }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.05, z: 20 }}
      className="p-5 glass-panel rounded-2xl border border-outline-variant/10 hover:border-primary/40 transition-all duration-300 preserve-3d"
    >
      <p className="text-primary font-bold text-sm mb-2 translate-z-10">{title}</p>
      <p className="text-xs text-on-surface-variant leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function MetricCard({ type, title, desc, accent, labelColor, target }: { type: string, title: string, desc: string, accent: string, labelColor: string, target?: string }) {
  return (
    <motion.div 
      variants={fadeIn}
      whileHover={{ y: -10, scale: 1.02 }}
      className={`p-8 rounded-2xl bg-surface-container-low border transition-all duration-300 flex flex-col h-full ${accent}`}
    >
      <div className={`text-xs font-mono uppercase tracking-widest mb-4 ${labelColor}`}>{type}</div>
      <div className="text-3xl font-bold mb-2">{title}</div>
      <p className="text-sm text-on-surface-variant flex-grow">{desc}</p>
      {target && (
        <div className="mt-6 pt-4 border-t border-outline-variant/10 text-xs font-mono font-bold text-primary">
          {target}
        </div>
      )}
    </motion.div>
  );
}

function JourneyStep({ step, icon, title, desc }: { step: string, icon: React.ReactNode, title: string, desc: string }) {
  return (
    <motion.div 
      variants={fadeIn}
      className="relative flex flex-col items-center text-center group"
    >
      <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-center mb-6 relative z-10 group-hover:border-primary/50 transition-colors shadow-xl">
        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow-lg">
          {step}
        </div>
        <div className="text-primary group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </div>
      <h4 className="text-lg font-bold mb-2">{title}</h4>
      <p className="text-sm text-on-surface-variant leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function PricingCard({ title, price, unit, features, popular = false }: { title: string, price: string, unit: string, features: string[], popular?: boolean }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.05, y: -10 }}
      className={`glass-panel p-10 rounded-2xl text-left relative overflow-hidden transition-all duration-500 ${popular ? "border-2 border-primary" : "border border-outline-variant/10"}`}
    >
      {popular && (
        <div className="absolute top-0 right-0 bg-primary text-on-primary px-4 py-1 text-xs font-bold rounded-bl-xl">POPULAR</div>
      )}
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <div className="text-4xl font-extrabold mb-6">{price}<span className="text-lg font-normal text-slate-500">{unit}</span></div>
      <ul className="space-y-4 font-mono text-sm text-on-surface-variant">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2">
            <Check className="text-primary" size={14} /> {f}
          </li>
        ))}
      </ul>
      <button className={`w-full mt-8 py-3 rounded-xl font-bold transition-all ${popular ? "bg-primary text-on-primary hover:bg-primary/90" : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"}`}>
        Choose Plan
      </button>
    </motion.div>
  );
}

function RoadmapItem({ version, title, desc, status }: { version: string, title: string, desc: string, status: "Built" | "Pending" }) {
  return (
    <motion.div 
      variants={fadeIn}
      whileHover={{ x: 10, backgroundColor: "rgba(79, 70, 229, 0.05)" }}
      className="glass-panel p-6 rounded-xl border border-outline-variant/10 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300"
    >
      <div className="flex items-center gap-6">
        <div className="font-mono text-primary text-xl font-bold w-16">{version}</div>
        <div>
          <h4 className="font-bold">{title}</h4>
          <p className="text-xs text-slate-500">{desc}</p>
        </div>
      </div>
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
        status === "Built" ? "bg-primary/20 text-primary" : "bg-slate-800 text-slate-400"
      }`}>
        {status === "Built" ? <CheckCheck size={12} /> : <Clock size={12} />}
        {status}
      </div>
    </motion.div>
  );
}

function RiskCard({ title, desc, prob, sev, mitigation, color, bgColor }: { title: string, desc: string, prob: string, sev: string, mitigation: string, color: string, bgColor: string }) {
  return (
    <motion.div 
      whileHover={{ x: 5 }}
      className={`border-l-4 ${color} p-6 ${bgColor} rounded-r-xl transition-all duration-300`}
    >
      <h4 className={`font-bold ${color.replace('border-', 'text-')} mb-2`}>{title}</h4>
      <p className="text-sm text-on-surface-variant mb-4">{desc}</p>
      <div className="flex gap-4 font-mono text-xs text-slate-500">
        <span>PROB: {prob}</span>
        <span>SEV: {sev}</span>
      </div>
      <div className="mt-4 text-sm font-bold text-primary">MITIGATION: {mitigation}</div>
    </motion.div>
  );
}

function FooterLink({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
  return (
    <a href={href} className="flex items-center gap-2 hover:text-primary transition-all hover:-translate-y-1">
      {icon}
      <span>{label}</span>
    </a>
  );
}

function FloatingShape({ color, size, top, left, delay }: { color: string, size: string, top: string, left: string, delay: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl ${color} ${size}`}
      style={{ top, left }}
      animate={{
        y: [0, 50, 0],
        x: [0, 30, 0],
        scale: [1, 1.1, 1],
        rotate: [0, 45, 0],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    />
  );
}
