import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Grid } from 'lucide-react';
import './styles/imageGallery.css';

const ImageGallery = ({ images, isOpen, onClose }) => {
  const [view, setView] = useState('grid'); // 'grid' or 'lightbox'
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset to Grid view whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setView('grid');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Handle Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (view === 'lightbox') setView('grid');
        else onClose();
      }
      if (view === 'lightbox') {
        if (e.key === 'ArrowLeft') showPrev(e);
        if (e.key === 'ArrowRight') showNext(e);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, view, currentIndex]);

  if (!isOpen) return null;

  const openLightbox = (index) => {
    setCurrentIndex(index);
    setView('lightbox');
  };

  const showPrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const showNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="gallery-portal">
      {/* 1. GRID VIEW LAYER */}
      <div className={`gallery-grid-layer ${view === 'grid' ? 'active' : 'hidden'}`}>
        <div className="grid-header">
            <h2 className="grid-title">Photo Gallery</h2>
            <button className="close-btn-round" onClick={onClose}>
                <X size={20} />
            </button>
        </div>
        
        <div className="grid-scroll-area">
            <div className="masonry-grid">
                {images.map((img, idx) => (
                    <div 
                        key={idx} 
                        className="grid-item"
                        onClick={() => openLightbox(idx)}
                    >
                        <img src={img} alt={`Hotel view ${idx + 1}`} loading="lazy" />
                        <div className="grid-hover-overlay"></div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* 2. LIGHTBOX SLIDER LAYER */}
      {view === 'lightbox' && (
        <div className="gallery-lightbox-layer">
            <div className="lightbox-top-bar">
                <button className="lightbox-btn" onClick={() => setView('grid')}>
                    <Grid size={18} style={{marginRight:8}}/> Show All Photos
                </button>
                <button className="lightbox-btn circle" onClick={onClose}>
                    <X size={20} />
                </button>
            </div>

            <div className="lightbox-stage">
                <button className="nav-arrow prev" onClick={showPrev}>
                    <ChevronLeft size={36} />
                </button>
                
                <div className="main-image-container">
                    <img 
                        src={images[currentIndex]} 
                        alt={`Fullscreen ${currentIndex}`} 
                        className="lightbox-img" 
                    />
                    <div className="lightbox-counter">
                        {currentIndex + 1} / {images.length}
                    </div>
                </div>

                <button className="nav-arrow next" onClick={showNext}>
                    <ChevronRight size={36} />
                </button>
            </div>
            
            {/* Mini Thumbnails Strip at bottom of Lightbox */}
            <div className="lightbox-filmstrip">
                {images.map((img, idx) => (
                    <div 
                        key={idx}
                        className={`filmstrip-thumb ${idx === currentIndex ? 'active' : ''}`}
                        style={{backgroundImage: `url('${img}')`}}
                        onClick={() => setCurrentIndex(idx)}
                    ></div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;