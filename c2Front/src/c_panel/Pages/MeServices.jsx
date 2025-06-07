import React, { useEffect, useState } from 'react';
import ServiceOwnerCard from '../Components/ServiceOwnerCard';
import Cookies from 'js-cookie';


export const MeServices = () => {
  
  const [ cards, setCards ] = useState([]);



  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/services/profile/me',{
          method:"GET",
          headers:{
            "x-token": Cookies.get('x-token')
          }
        });
        const data = await res.json();
        console.log(data);
        setCards(data)
      } catch (err) {
        console.log('Fetch error:', err);
      }
    };
  
    fetchData();
  }, []);


  return (
    <div className="page-container">
      <h1>Tus servicios</h1>

      <div className="card-container">
        {
        cards.length > 0 ?
        cards.map(card => (

            <ServiceOwnerCard 
            key={card.id}
            title={card.service_name}
            description={card.description}
            image={card.image_url[0]}
            />
        ))
        :
        <h1>No tiene servicios</h1>
      }
      </div>
    </div>
  );
};
