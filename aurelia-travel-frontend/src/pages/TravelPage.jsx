import React from 'react';
import PlannerContainer from '../components/common/PlannerContainer';
import './styles/travelPage.css';

const TravelPage = () => {
  return (
    <div className="travel-page">
      <div className="container">
        <section className="travel-hero">
          <h1>Design Your <span>Perfect Escape</span></h1>
          <p>Provide your preferences. Our AI will curate a flawless itinerary in seconds.</p>
        </section>

        {/* Calling the separated component */}
        <PlannerContainer />
      </div>
    </div>
  );
};

export default TravelPage;