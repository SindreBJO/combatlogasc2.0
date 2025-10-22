import React from 'react';
import './slideIn.css';
import ImageOne from '../../../assets/image2.png';


export default function SlideInHomeElement() {
  return (
    <section className="hero-banner">
      <div className="hero-content slide-in-one">
        <img src={ImageOne} className='hero-content-img' />
        <h1 className="hero-title">See Every Battle. Own Every Victory.</h1>
        <p className="hero-subtitle">
          Track your WoW combat sessions with precision. No missing logs, no broken sessions —
          just truth, clarity, and performance you can trust.
        </p>
      </div>
    </section>
  );
}