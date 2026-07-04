import { motion } from 'framer-motion';
import { FaLinkedin, FaGithub } from 'react-icons/fa';
import { SiGmail } from 'react-icons/si';
import TextPressure from '../components/TextPressure/TextPressure';
import Folder from '../components/Folder/Folder';
import Section from '../components/Section/Section';
import MacTerminal from '../components/MacTerminal/MacTerminal';
import { fadeUp } from '../utils/animations';

export default function Contact() {
  const folderItems = [
    <a key="github" href="https://github.com/Marshmellow31" target="_blank" rel="noopener noreferrer" style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100%'}} className="hover:scale-110 transition-transform"><FaGithub size={28} color="#ffffff" /></a>,
    <a key="linkedin" href="https://www.linkedin.com/in/harshil-patel-31h/" target="_blank" rel="noopener noreferrer" style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100%'}} className="hover:scale-110 transition-transform"><FaLinkedin size={28} color="#0077b5" /></a>,
    <a key="email" href="mailto:harshil31@example.com" style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100%'}} className="hover:scale-110 transition-transform"><SiGmail size={28} color="#EA4335" /></a>
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-20">
      {/* ──── Contact ──── */}
      <Section id="contact" className="w-full py-12 overflow-visible">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 relative z-10 lg:-ml-8">
            <motion.p variants={fadeUp} className="text-accent font-mono text-sm tracking-[0.2em] uppercase mb-6">04 — Status: Online</motion.p>
            <div className="relative">
              {/* Static headings below lg: TextPressure's min font size
                  overflows small screens and its effect needs a mouse */}
              <div className="lg:hidden">
                <h1 className="font-heading uppercase leading-[0.85] text-6xl sm:text-7xl text-white m-0">LET'S BUILD</h1>
                <h1 className="font-heading uppercase leading-[0.85] text-6xl sm:text-7xl text-white m-0">SOMETHING</h1>
              </div>
              <div className="hidden lg:flex flex-col">
                <TextPressure
                  text="LET'S BUILD"
                  flex={true}
                  alpha={false}
                  stroke={false}
                  width={true}
                  weight={true}
                  italic={true}
                  textColor="#ffffff"
                  strokeColor="#ff007f"
                  minFontSize={60}
                  className="font-heading uppercase leading-[0.8]"
                />
                <TextPressure
                  text="SOMETHING"
                  flex={true}
                  alpha={false}
                  stroke={false}
                  width={true}
                  weight={true}
                  italic={true}
                  textColor="#ffffff"
                  strokeColor="#ff007f"
                  minFontSize={60}
                  className="font-heading uppercase leading-[0.8]"
                />
              </div>
            </div>
            <motion.p variants={fadeUp} className="font-serif text-xl text-text-muted max-w-lg leading-relaxed mt-4">
              Open to select freelance opportunities, full-time roles, and interesting conversations.
            </motion.p>

          </div>

          <motion.div variants={fadeUp} className="lg:col-span-4 lg:col-start-9 relative w-full flex flex-col items-center justify-center overflow-visible mt-10 lg:mt-0 lg:translate-x-16">
            <div className="flex items-center justify-center mb-10">
              <Folder 
                color="#ff007f"
                size={2} 
                className="custom-folder"
                items={folderItems}
              />
            </div>
            <p className="font-mono text-xs text-text-muted uppercase tracking-[0.2em] text-center mt-8">Click to interact.</p>
          </motion.div>
        </div>
      </Section>

      {/* ──── Terminal ──── */}
      <Section id="terminal" className="w-full py-12">
        <motion.p variants={fadeUp} className="text-accent font-mono text-sm tracking-[0.2em] uppercase mb-8">05 — Terminal</motion.p>
        <motion.div variants={fadeUp}>
          <MacTerminal />
        </motion.div>
      </Section>
    </div>
  );
}
