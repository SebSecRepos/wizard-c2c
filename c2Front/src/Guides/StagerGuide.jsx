import React, { useEffect } from 'react';
import './GuidesStyle.css';
import panel from './Images/Listeners/1.png'
import data from './Images/Listeners/2.png'
import Cookies from 'js-cookie';
import ssl from './Images/Listeners/3.png'
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';


export const StagerGuide = () => {




const downloadFile = async (fileName) => {

  const url = `${import.meta.env.VITE_API_URL}/api/sources/${fileName}`;

  try {
    const response = await fetch(url, {
      method:'GET',
      headers: {
        'x-token': `${Cookies.get('x-token')}`,
      }
    });

    if (!response.ok) {
      toast.error(response.error)
    }

    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

  } catch (err) {
    toast.error(err);
  }

};







    return (
        <div className='guide-container'>
            <h1>Stagers guide</h1>
            <div className="guide-text-block">
                <p>Stagers are only available for Windows systems. The staggers are raw binary implants, manually compilation and process loader are required </p>
                <ul>
                    <li>Visual estudio</li>
                    <li><Link to="" target='blank' tarstyle={{ textDecoration: 'none' }} className='guide-link' >Donut</Link></li>
                    <li><Link onClick={() => downloadFile("stagger_ssl.rar")} tarstyle={{ textDecoration: 'none' }} className='guide-link' >SSL Stager source</Link></li>
                    <li><Link onClick={() => downloadFile("stagger_no_ssl.rar")} tarstyle={{ textDecoration: 'none' }} className='guide-link' > No SSL Stager source</Link></li>
                    <li><Link onClick={() => downloadFile("Loader.rar")} tarstyle={{ textDecoration: 'none' }} className='guide-link' > Loader source</Link></li>
                </ul>

                <p>Steps</p>
                <ul>
                    <li>1. Compile c# Stagger</li>
                    <li>2. Create raw binary with Donut</li>
                    <li>3. Upload Stagger into a bucket</li>
                    <li>4. Compile c++ Loader with the bucket link</li>
                </ul>
            </div>
            <div className="guide-text-block">
                <h3>Create listener</h3>
                <img src={panel} alt="panel" srcset="" />
                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nulla, quisquam! Blanditiis nihil, sapiente itaque quia explicabo saepe laudantium eveniet quis culpa dicta! Explicabo reiciendis blanditiis quia eaque! Officia, alias quis?</p>
            </div>
            <div className="guide-text-block">
                <h3>Data</h3>
                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nulla, quisquam! Blanditiis nihil, sapiente itaque quia explicabo saepe laudantium eveniet quis culpa dicta! Explicabo reiciendis blanditiis quia eaque! Officia, alias quis?</p>
                <img src={data} alt="attacks" srcset="" />
            </div>
            <div className="guide-text-block">
                <h3>SSL</h3>
                <img src={ssl} alt="" srcset="" />
                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nulla, quisquam! Blanditiis nihil, sapiente itaque quia explicabo saepe laudantium eveniet quis culpa dicta! Explicabo reiciendis blanditiis quia eaque! Officia, alias quis?</p>
            </div>


                  <ToastContainer
                  position="top-center"
                  autoClose={4000}
                  hideProgressBar={true}
                  newestOnTop={false}
                  closeOnClick
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="dark"
                  />

        </div>
    );
};
