'use client';

import React, { useState } from 'react';

interface Photo {
  id: string;
  url: string;
  is_primary: boolean;
}

interface GalleryProps {
  photos: Photo[];
  title: string;
}

export default function Gallery({ photos, title }: GalleryProps) {
  const [activePhoto, setActivePhoto] = useState(
    photos.find(p => p.is_primary)?.url || photos[0]?.url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3QCNHzM0-jssyS7WBR3kd45hGD45iz0WhDj1H3qcbQT8sZxvWPgflNsPC0MD8j3nr7IQfIiWMpcaLrcL_I34hz3EkfemroxHei8fcYFWTetHRYvfDT7PeAQybMbj8Scoi4mGrVdSflcFU_PK3baSNEFoUhdvfyDAOiMHufI_WgHeY7V0rhpIFeCSPLzJL_pn9p0MEEeU_L71zhIdLJfrIfjFb--LqVXCWGCeY7yObotDSEu6MwP8a9pWPMUZ3Aqidvn3XCN1eQ9E1'
  );

  return (
    <div className="relative group space-y-4">
      {/* Primary Photo */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-gray-100 shadow-md">
        <img 
          src={activePhoto} 
          alt={title}
          className="w-full h-full object-cover transition-all duration-300"
        />
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scroll-hide">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setActivePhoto(photo.url)}
              className={`w-20 h-16 relative rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                activePhoto === photo.url ? 'border-primary ring-2 ring-primary ring-opacity-30' : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img 
                src={photo.url} 
                alt={`${title} thumbnail`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
