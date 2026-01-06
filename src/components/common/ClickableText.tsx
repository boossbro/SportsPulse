import { Link } from 'react-router-dom';

interface ClickableTextProps {
  text: string;
  className?: string;
}

/**
 * Component that makes hashtags (#) and mentions (@) clickable
 */
export const ClickableText = ({ text, className = '' }: ClickableTextProps) => {
  const renderText = () => {
    // Combined regex to match hashtags and mentions
    const regex = /(#[a-zA-Z0-9_]+)|(@\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }

      const matchedText = match[0];
      
      if (matchedText.startsWith('#')) {
        // Hashtag
        const tag = matchedText.substring(1);
        parts.push(
          <Link
            key={`hash-${match.index}`}
            to={`/hashtag/${tag.toLowerCase()}`}
            className="text-primary hover:underline font-semibold"
            onClick={(e) => e.stopPropagation()}
          >
            {matchedText}
          </Link>
        );
      } else if (matchedText.startsWith('@')) {
        // Mention - use /profile/ instead of /user/
        const username = matchedText.substring(1);
        parts.push(
          <Link
            key={`mention-${match.index}`}
            to={`/profile/${username.toLowerCase()}`}
            className="text-blue-600 hover:underline font-semibold"
            onClick={(e) => e.stopPropagation()}
          >
            {matchedText}
          </Link>
        );
      }

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : text;
  };

  return <span className={className}>{renderText()}</span>;
};
