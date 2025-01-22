import React from "react";
import HospitalCard from "./HospitalCard";

const HospitalList = ({ hospitals }) => {
  return (
    <div className="row">
      {hospitals.map((hospital, index) => (
        <div className="col-md-6" key={index}>
          <HospitalCard
            name={hospital.name}
            location={hospital.location}
            phone={hospital.phone}
            services={hospital.services}
            schedule={hospital.schedule}
          />
        </div>
      ))}
    </div>
  );
};

export default HospitalList;