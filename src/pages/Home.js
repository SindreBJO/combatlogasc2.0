import React from "react"


export default function Home(){

  return (
    <div className="main">
    <video 
      autoPlay 
      muted 
      loop 
      style={{ 
        position: "fixed",
        top: "80px", 
        left: 0, 
        width: "100vw", 
        height: "100vh", 
        objectFit: "cover", 
        zIndex: 0
      }}
    >
      <source src="/homePageBanner.mp4" type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  </div>
  )
}