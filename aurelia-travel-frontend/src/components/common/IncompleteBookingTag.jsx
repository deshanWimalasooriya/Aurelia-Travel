import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';

const IncompleteBookingTag = () => {
    const [pendingBooking, setPendingBooking] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Store actual position
    const [position, setPosition] = useState({ x: -1000, y: -1000 }); // Render offscreen initially
    const [isDragging, setIsDragging] = useState(false);
    const dragHasMoved = useRef(false); 
    const startPos = useRef({ x: 0, y: 0, tagX: 0, tagY: 0 });
    const tagRef = useRef(null);
    const initialized = useRef(false);

    // Initial position on load (bottom right)
    useEffect(() => {
        if (!initialized.current && pendingBooking && tagRef.current) {
            const tagWidth = tagRef.current.offsetWidth || 260;
            const tagHeight = tagRef.current.offsetHeight || 60;
            setPosition({ 
                x: window.innerWidth - tagWidth - 25, 
                y: window.innerHeight - tagHeight - 25 
            });
            initialized.current = true;
        }
    }, [pendingBooking]);

    // Handle window resize to keep it on screen
    useEffect(() => {
        const handleResize = () => {
            if (!initialized.current) return;
            const { innerWidth, innerHeight } = window;
            const tagWidth = tagRef.current?.offsetWidth || 260;
            const tagHeight = tagRef.current?.offsetHeight || 60;
            
            let newX = position.x;
            let newY = position.y;

            if (newX + tagWidth > innerWidth) newX = innerWidth - tagWidth - 25;
            if (newY + tagHeight > innerHeight) newY = innerHeight - tagHeight - 25;
            if (newX < 0) newX = 25;
            if (newY < 0) newY = 90;

            setPosition({ x: newX, y: newY });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [position]);

    // Fetch and check if complete
    useEffect(() => {
        const fetchPendingBooking = async () => {
            try {
                const response = await api.get('/bookings/my-bookings');
                if (response.data && response.data.success) {
                    const incomplete = response.data.data.find(b => b.status === 'pending');
                    setPendingBooking(incomplete);
                }
            } catch (err) {
                console.error("Failed to fetch pending bookings", err);
            }
        };
        fetchPendingBooking();
    }, [location.pathname]); // Re-evaluates every time the route changes

    const snapToCorner = (currentX, currentY) => {
        const { innerWidth, innerHeight } = window;
        const tagWidth = tagRef.current ? tagRef.current.offsetWidth : 260;
        const tagHeight = tagRef.current ? tagRef.current.offsetHeight : 60;
        
        const isLeft = currentX + tagWidth / 2 < innerWidth / 2;
        const isTop = currentY + tagHeight / 2 < innerHeight / 2;
        
        const finalX = isLeft ? 25 : innerWidth - tagWidth - 25;
        const finalY = isTop ? 90 : innerHeight - tagHeight - 25; // 90px gives clearance for header

        setPosition({ x: finalX, y: finalY });
    };

    const handlePointerDown = (e) => {
        setIsDragging(true);
        dragHasMoved.current = false;
        startPos.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            tagX: position.x,
            tagY: position.y
        };
        e.target.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        
        // If moved more than 5px, consider it a drag
        if (Math.abs(e.clientX - startPos.current.mouseX) > 5 || Math.abs(e.clientY - startPos.current.mouseY) > 5) {
            dragHasMoved.current = true;
        }

        const newX = startPos.current.tagX + (e.clientX - startPos.current.mouseX);
        const newY = startPos.current.tagY + (e.clientY - startPos.current.mouseY);
        setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = (e) => {
        if (!isDragging) return;
        setIsDragging(false);
        e.target.releasePointerCapture(e.pointerId);
        
        if (dragHasMoved.current) {
            snapToCorner(position.x, position.y);
        }
    };

    const handleClick = (e) => {
        if (dragHasMoved.current) {
            e.preventDefault();
            return; // Was a drag, do not navigate
        }
        navigate('/booking-confirmation');
    };

    if (!pendingBooking) return null;

    return (
        <div 
            ref={tagRef}
            className="floating-pending-tag" 
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={handleClick}
            style={{ 
                left: `${position.x}px`, 
                top: `${position.y}px`, 
                bottom: 'auto', 
                right: 'auto',
                transition: isDragging ? 'none' : 'left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.2s ease, box-shadow 0.2s ease',
                userSelect: 'none',
                touchAction: 'none',
                cursor: isDragging ? 'grabbing' : 'grab',
                opacity: initialized.current ? 1 : 0
            }}
        >
            <div className="tag-icon">⏳</div>
            <div className="tag-content">
                <h4>Complete your booking!</h4>
                <p>You have an unfinished reservation for {pendingBooking.hotel?.name || 'a hotel'}.</p>
            </div>
        </div>
    );
};

export default IncompleteBookingTag;