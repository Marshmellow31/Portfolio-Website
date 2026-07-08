import { Link } from 'react-router-dom';
import { FiClock } from 'react-icons/fi';
import { Reveal } from '../components/Reveal/Reveal';
import { blogPosts } from '../data/blog';
import useSEO from '../utils/useSEO';

export default function Blog() {
  useSEO({ title: 'Blog', description: 'Writing on React, AI tooling, and shipping software that leaves the repo.', path: '/blog' });
  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="section-pad border-b border-border">
        <Reveal>
          <div className="flex items-center gap-[14px] mb-7">
            <div className="h-px w-10 bg-text" />
            <span className="mono-label">Thoughts &amp; Insights</span>
          </div>
          <h1
            className="m-0 font-bold text-text-bright"
            style={{
              fontSize: 'clamp(48px,8vw,120px)',
              letterSpacing: '-0.045em',
              lineHeight: 0.92,
            }}
          >
            BLOG
          </h1>
        </Reveal>
      </section>

      {/* Posts */}
      <section className="section-pad">
        <div className="border-t border-border">
          {blogPosts.map((post) => (
            <Reveal key={post.slug}>
              <Link
                to={`/blog/${post.slug}`}
                className="group block py-[30px] border-b border-border no-underline transition-colors hover:bg-white/[0.025]"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 border border-border rounded-full font-mono text-[10px] uppercase tracking-widest text-text-dim">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Title */}
                    <h2
                      className="m-0 font-semibold text-text group-hover:text-text-bright transition-colors duration-300 mb-2"
                      style={{ fontSize: 'clamp(20px,2.5vw,30px)', letterSpacing: '-0.02em' }}
                    >
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="m-0 text-[14px] text-text-muted max-w-2xl leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 lg:flex-col lg:items-end lg:gap-3 flex-none">
                    <div className="flex items-center gap-2 text-text-dim">
                      <FiClock className="text-xs" />
                      <span className="font-mono text-[11px] uppercase tracking-widest">{post.readTime}</span>
                    </div>
                    <span className="font-mono text-[11px] text-text-faint uppercase tracking-widest">
                      {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="font-mono text-[11px] tracking-[.1em] text-text-dim opacity-0 group-hover:opacity-100 transition-opacity">
                      READ ↗
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
