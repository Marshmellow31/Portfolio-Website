import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiClock } from 'react-icons/fi';
import { blogPosts } from '../data/blog';
import useSEO from '../utils/useSEO';
import { SITE_URL, OG_IMAGE } from '../../site.config.mjs';

export default function BlogPost() {
  const { slug } = useParams();
  const post = blogPosts.find(p => p.slug === slug);
  useSEO({
    title: post?.title,
    description: post?.excerpt,
    path: `/blog/${slug}`,
    jsonLd: post && {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      datePublished: post.date,
      url: `${SITE_URL}/blog/${slug}`,
      image: SITE_URL + OG_IMAGE,
      author: { '@type': 'Person', name: 'Harshil Patel', url: SITE_URL },
      mainEntityOfPage: `${SITE_URL}/blog/${slug}`,
    },
  });

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="font-heading text-6xl text-text-dim mb-4">Post Not Found</h1>
          <Link to="/blog" className="font-mono text-sm text-text-dim uppercase tracking-widest hover:text-text transition-colors">
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  // Simple markdown-like rendering
  const renderContent = (content) => {
    return content.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <br key={i} />;
      if (trimmed.startsWith('## ')) {
        return <h2 key={i} className="font-heading text-3xl md:text-4xl text-text-bright mt-12 mb-4" style={{ letterSpacing: '-0.03em' }}>{trimmed.slice(3)}</h2>;
      }
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return <p key={i} className="font-mono text-sm text-text-dim uppercase tracking-widest mt-6 mb-2">{trimmed.slice(2, -2)}</p>;
      }
      if (trimmed.startsWith('**')) {
        const parts = trimmed.split('**');
        return (
          <p key={i} className="font-mono text-sm text-text-muted leading-relaxed mb-2">
            {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="text-text">{part}</strong> : part)}
          </p>
        );
      }
      if (trimmed.startsWith('- ')) {
        return (
          <div key={i} className="flex gap-3 mb-2 pl-4">
            <span className="text-text-faint mt-1">•</span>
            <p className="font-mono text-sm text-text-muted leading-relaxed">{trimmed.slice(2)}</p>
          </div>
        );
      }
      return <p key={i} className="font-mono text-sm text-text-muted leading-relaxed mb-4">{trimmed}</p>;
    });
  };

  return (
    <div className="pt-20">
      {/* Header */}
      <section className="relative w-full py-16 border-b border-border">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Link to="/blog" className="inline-flex items-center gap-2 font-mono text-xs text-text-dim uppercase tracking-widest hover:text-text transition-colors mb-8">
              <FiArrowLeft /> Back to Blog
            </Link>
            
            <div className="flex items-center gap-4 mb-6">
              {post.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 border border-border rounded-full font-mono text-[10px] uppercase tracking-widest text-text-dim">
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="font-heading text-4xl md:text-6xl leading-tight mb-6" style={{ letterSpacing: '-0.03em' }}>{post.title}</h1>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-text-dim">
                <FiClock className="text-xs" />
                <span className="font-mono text-xs uppercase tracking-widest">{post.readTime}</span>
              </div>
              <span className="font-mono text-xs text-text-faint uppercase tracking-widest">
                {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="max-w-4xl mx-auto px-6 md:px-12 py-16"
      >
        {renderContent(post.content)}

        {/* Bottom nav */}
        <div className="mt-16 pt-8 border-t border-border">
          <Link to="/blog" className="inline-flex items-center gap-2 font-mono text-sm text-text-dim uppercase tracking-widest hover:text-text transition-colors">
            <FiArrowLeft /> All Articles
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
