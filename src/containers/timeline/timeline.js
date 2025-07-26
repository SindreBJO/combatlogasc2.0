import React, { useContext, useEffect, useRef, useState } from "react";
import { DataContext } from "../../utils/contexts/dataContext";
import "./timeline.css";

export default function Timeline() {

    const { data } = useContext(DataContext);
    const timelineRef = useRef();

    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartX(e.pageX);
    };
    const handleMouseUp = () => {
        setIsDragging(false);
    };
    const handleMouseLeave = () => {
        setIsDragging(false);
    };
    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.pageX - startX;
        timelineRef.current.scrollBy({ left: -dx, behavior: "auto" });
        setStartX(e.pageX);
    };

  return (
    <div
      className="timeline-container"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      tabIndex={0}
    >
    
    
            
    
    </div>
);
}
