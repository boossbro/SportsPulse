import { Link } from 'react-router-dom';
import { TrendingUp, ExternalLink } from 'lucide-react';

interface SponsoredPostProps {
  sponsor: string;
  sponsorUrl?: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  postUrl: string;
  impressions?: number;
  onClick?: () => void;
}

const SponsoredPost = ({
  sponsor,
  sponsorUrl,
  title,
  excerpt,
  coverImage,
  postUrl,
  impressions,
  onClick,
}: SponsoredPostProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Sponsored Badge */}
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-600">Sponsored by</span>
          {sponsorUrl ? (
            <a
              href={sponsorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              {sponsor}
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="text-xs font-bold text-gray-900">{sponsor}</span>
          )}
        </div>
        {impressions && (
          <span className="text-xs text-gray-500">{impressions.toLocaleString()} views</span>
        )}
      </div>

      {/* Content */}
      <Link
        to={postUrl}
        onClick={onClick}
        className="block"
      >
        {coverImage && (
          <div className="relative h-48 bg-gray-200">
            <img
              src={coverImage}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2">
              <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">
                AD
              </span>
            </div>
          </div>
        )}

        <div className="p-4">
          <h3 className="text-base font-bold text-gray-900 line-clamp-2 mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {excerpt}
          </p>
        </div>
      </Link>
    </div>
  );
};

export default SponsoredPost;
