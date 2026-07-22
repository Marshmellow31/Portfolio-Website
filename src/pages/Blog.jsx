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
      <section className="px-6 md:px-12 lg:px-24 pt-12 pb-16">
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
      <section className="px-6 md:px-12 lg:px-24 pb-24">
        <div className="border-t border-border">
          {blogPosts.map((post) => (
            <Reveal key={post.slug}>
              <article>
                <Link
                  to={`/blog/${post.slug}`}
                  aria-label={`Read blog post: ${post.title}`}
                  className="group block py-[30px] border-b border-border no-underline transition-colors hover:bg-white/[0.025]"
                >
                  <div className="flex flex-col gap-4">
                    {/* Tags & Metadata */}
                    <div className="flex flex-wrap items-center gap-4 mb-1">
                      <div className="flex gap-2">
                        {post.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 border border-border rounded-full font-mono text-[10px] uppercase tracking-widest text-text-dim bg-white/[0.02]">
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-3 text-text-dim">
                        <span className="font-mono text-[11px] uppercase tracking-widest text-text-faint">
                          {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <div className="flex items-center gap-1.5">
                          <FiClock className="text-[10px]" />
                          <span className="font-mono text-[11px] uppercase tracking-widest">{post.readTime}</span>
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <h2
                      className="m-0 font-semibold text-text group-hover:text-text-bright transition-colors duration-300 mb-1"
                      style={{ fontSize: 'clamp(20px,2.5vw,30px)', letterSpacing: '-0.02em' }}
                    >
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="m-0 text-[15px] text-text-muted leading-relaxed max-w-4xl pr-4">
                      {post.excerpt}
                    </p>

                    {/* Read More Link (Visible on hover) */}
                    <div className="font-mono text-[11px] tracking-[.1em] text-text-dim mt-2 group-hover:text-white transition-colors flex items-center gap-2">
                      READ POST <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
