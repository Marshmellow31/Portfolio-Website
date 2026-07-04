import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiClock } from 'react-icons/fi';
import Section from '../components/Section/Section';
import { fadeUp } from '../utils/animations';
import { blogPosts } from '../data/blog';

export default function Blog() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative w-full py-24 border-b border-card-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="flex items-center gap-4 mb-6"
          >
            <div className="h-px w-12 bg-accent" />
            <p className="text-accent font-mono text-sm tracking-[0.3em] uppercase">
              Thoughts & Insights
            </p>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="font-heading text-6xl md:text-8xl leading-none text-white"
          >
            BLOG
          </motion.h1>
        </div>
      </section>

      {/* Posts */}
      <Section id="posts" className="py-24">
        <div className="flex flex-col gap-0">
          {blogPosts.map((post, i) => (
            <motion.div key={post.slug} variants={fadeUp}>
              <Link
                to={`/blog/${post.slug}`}
                className="group block py-10 border-b border-card-border hover:border-accent/30 transition-colors duration-500"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    {/* Tags */}
                    <div className="flex gap-2 mb-3">
                      {post.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 border border-card-border rounded-full font-mono text-[10px] uppercase tracking-widest text-text-muted">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Title */}
                    <h2 className="font-heading text-2xl md:text-3xl uppercase group-hover:text-accent transition-colors duration-300 mb-2">
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="font-mono text-sm text-text-muted max-w-2xl leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 lg:flex-col lg:items-end lg:gap-3">
                    <div className="flex items-center gap-2 text-text-muted">
                      <FiClock className="text-xs" />
                      <span className="font-mono text-xs uppercase tracking-widest">{post.readTime}</span>
                    </div>
                    <span className="font-mono text-xs text-text-muted uppercase tracking-widest">
                      {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <FiArrowRight className="text-accent opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Section>
    </div>
  );
}
