import React from 'react';
import { Button } from '@/components/ui/button';

const PostContent = ({ content }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isExpandable, setIsExpandable] = React.useState(false);
  const contentRef = React.useRef(null);

  const checkExpandable = React.useCallback(() => {
    if (contentRef.current) {
      // +1 to account for potential rounding errors
      setIsExpandable(contentRef.current.scrollHeight > contentRef.current.clientHeight + 1);
    }
  }, []);

  React.useLayoutEffect(() => {
    checkExpandable();
    const handleResize = () => checkExpandable();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkExpandable, content]);

  return (
    <div className="mb-4">
      <p ref={contentRef} className={`text-gray-800 whitespace-pre-wrap transition-all duration-300 ${!isExpanded ? 'line-clamp-6' : ''}`}>
        {content}
      </p>
      {isExpandable && !isExpanded && (
        <Button variant="link" onClick={() => setIsExpanded(true)} className="px-0 text-blue-600 hover:no-underline h-auto py-0">
          全文
        </Button>
      )}
    </div>
  );
};

export default PostContent;