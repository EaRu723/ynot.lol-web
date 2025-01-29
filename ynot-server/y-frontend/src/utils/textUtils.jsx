export const renderTextWithTagsAndLinks = (text) => {
  if (!text) return "";

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const tagRegex = /#[^\s#]+/g;

  // Split text by both URLs and hashtags
  const parts = text.split(/(https?:\/\/[^\s]+|#[^\s#]+)/g);

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      // Render links
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="link"
        >
          {part}
        </a>
      );
    } else if (tagRegex.test(part)) {
      // Render tags
      return (
        <span key={index} className="hashtag">
          {part}
        </span>
      );
    }
    // Render normal text
    return part;
  });
};
