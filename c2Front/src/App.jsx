import AppRouter from "./Router/AppRouter"
import { store } from "./Store"
import { Provider } from 'react-redux';
import './Styles/global.css'
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadFull } from 'tsparticles';
import { useEffect, useMemo, useState } from "react";
import { loadSlim } from "@tsparticles/slim";
import Footer from "./Footer/Footer";

function App() {

   const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = (container) => {
  };

  const options = useMemo(
    () => ({
      background: {
        color: {
        },
      },
      fpsLimit: 60,
      interactivity: {
        events: {
          onClick: {
            enable: true,
          },
          onHover: {
            enable: false,
            mode: "repulse",
          },
        },
        modes: {
          push: {
            quantity: 4,
          },
          repulse: {
            distance: 200,
            duration: 0.4,
          },
        },
      },
      particles: {
        color: {
          value: "#ff0000ff",
        },
        links: {
          color: "#ff0000ff",
          distance: 150,
          enable: true,
          opacity: 0.5,
          width: 3,
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "bounce",
          },
          random: false,
          speed: 2,
          straight: false,
        },
        number: {
          density: {
            enable: true,
          },
          value: 100,
        },
        opacity: {
          value: 0.6,
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 2, max: 2 },
        },
      },
      detectRetina: true,
    }),
    [],
  );

 if (init) {
    return (
      
    <Provider store={store}>
      
      <Particles id="tsparticles" particlesLoaded={particlesLoaded} options={options} style={{
        position: 'absolute', 
        width:'100%',  
        height:'100%',
        zIndex:-1,
        top:0,
        left:0,

        }} 
      />
      <div style={{ position: 'relative', zIndex: 1, background:'transparent', display:'flex', flexDirection:'column', minHeight: '100vh'}}>
        <AppRouter/>
        <Footer />

      </div>
      
    </Provider>
  )
}
}
export default App