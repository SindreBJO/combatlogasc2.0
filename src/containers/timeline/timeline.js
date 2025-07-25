import React, { useContext, useRef, useState } from "react";
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

return(
    <div
      className="timeline-container"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
        <div ref={timelineRef} className="timeline-bar">
          {/* Example timeline items */}
          <div className="timeline-item">Event 1</div>
          <div className="timeline-item">Event 2</div>
          <div className="timeline-item">Event 3</div>
          <div className="timeline-item">Event 4</div>
            <div className="timeline-item">Event 5</div>
            <div className="timeline-item">Event 6</div>
            <div className="timeline-item">Event 7</div>
            <div className="timeline-item">Event 8</div>
            <div className="timeline-item">Event 9</div>
            <div className="timeline-item">Event 10</div>
            <div className="timeline-item">Event 11</div>
            <div className="timeline-item">Event 12</div>
            <div className="timeline-item">Event 13</div>
            <div className="timeline-item">Event 14</div>
            <div className="timeline-item">Event 15</div>
            <div className="timeline-item">Event 16</div>
            <div className="timeline-item">Event 17</div>
            <div className="timeline-item">Event 18</div>
            <div className="timeline-item">Event 19</div>
            <div className="timeline-item">Event 20</div>
        </div>
    </div>
)
}
