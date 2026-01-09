import React from 'react';
import PlannerContainer from '../components/common/PlannerContainer'; // Adjust path if needed
import './styles/travelPage.css';

const TravelPage = () => {
  return (
    <div className="travel-page">
      <section className="travel-hero">
        <h1>Create Your <span>Aurelia Roadmap</span></h1>
        <p>Short break? We'll handle the logistics. You handle the memories.</p>
      </section>

      {/* Calling the separated component */}
      <PlannerContainer />
    </div>
  );
};

export default TravelPage;