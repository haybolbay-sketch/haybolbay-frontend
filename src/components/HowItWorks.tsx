import { motion } from 'motion/react';
import { MousePointerClick, Calendar, Sparkles } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      icon: <MousePointerClick className="w-8 h-8 text-primary" />,
      title: "Choose your service",
      description: "Select from standard, deep, or move-in/out cleaning packages tailored for you."
    },
    {
      icon: <Calendar className="w-8 h-8 text-primary" />,
      title: "Pick a date & time",
      description: "Schedule a cleaning slot that fits your busy lifestyle. We're flexible!"
    },
    {
      icon: <Sparkles className="w-8 h-8 text-primary" />,
      title: "Relax & Enjoy",
      description: "Our verified pros handle the rest. Walk into a fresh, spotless home."
    }
  ];

  return (
    <section id="how-it-works" className="py-24 px-6 bg-secondary">
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h2 className="text-4xl md:text-5xl lg:text-6xl italic mb-4">How it <span className="not-italic text-primary font-bold">works</span></h2>
        <p className="text-neutral-600 max-w-xl mx-auto">Booking your next cleaning is as easy as ABC. Our streamlined process saves you hours of stress.</p>
      </div>

      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
        {steps.map((step, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.2 }}
            className="bg-white p-10 rounded-[32px] text-center shadow-sm hover:shadow-xl transition-shadow"
          >
            <div className="w-16 h-16 bg-secondary flex items-center justify-center rounded-2xl mx-auto mb-6">
              {step.icon}
            </div>
            <h3 className="text-2xl italic mb-3">{step.title}</h3>
            <p className="text-neutral-600 leading-relaxed italic">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
