import React, { useEffect } from 'react';
import './GuidesStyle.css';
import Cookies from 'js-cookie';
import ssl from './Images/Listeners/3.png'
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';

import one from './Images/Stagers/1.png'
import two from './Images/Stagers/2.png'
import three from './Images/Stagers/3.png'
import four from './Images/Stagers/4.png'
import five from './Images/Stagers/5.png'
import six from './Images/Stagers/6.png'
import seven from './Images/Stagers/7.png'
import eight from './Images/Stagers/8.png'
import nine from './Images/Stagers/9.png'
import ten from './Images/Stagers/10.png'
import eleven from './Images/Stagers/11.png'
import twelve from './Images/Stagers/12.png'
import thirdteen from './Images/Stagers/13.png'
import fourteen from './Images/Stagers/14.png'
import fifteen from './Images/Stagers/15.png'
import sixteen from './Images/Stagers/16.png'
import seventeen from './Images/Stagers/17.png'
import eighteen from './Images/Stagers/18.png'
import nineteen from './Images/Stagers/19.png'

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
                    <li><Link to="https://github.com/TheWover/donut/releases/tag/v1.1" target='blank' tarstyle={{ textDecoration: 'none' }} className='guide-link' >Donut</Link></li>
                    <li><Link onClick={() => downloadFile("stager_ssl.rar")} tarstyle={{ textDecoration: 'none' }} className='guide-link' >SSL Stager source</Link></li>
                    <li><Link onClick={() => downloadFile("stager_no_ssl.rar")} tarstyle={{ textDecoration: 'none' }} className='guide-link' > No SSL Stager source</Link></li>
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
                <h3>Download stager and open VS</h3>
                <img src={one} alt="panel" srcset="" />
                <img src={two} alt="" srcset="" />
                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nulla, quisquam! Blanditiis nihil, sapiente itaque quia explicabo saepe laudantium eveniet quis culpa dicta! Explicabo reiciendis blanditiis quia eaque! Officia, alias quis?</p>
            </div>
            <div className="guide-text-block">
                <h3>Nuget packages</h3>
                <p>Before of compile, we need reinstall fody and costura.fody packages </p>
                <img src={three} alt="" srcset="" />
                <p>Uninstall costura.fody and fody after</p>
                <img src={four} alt="" srcset="" />
                <p>Reinstall fody and costura.fody  after</p>
                <img src={five} alt="" srcset="" />
            </div>
            <div className="guide-text-block">
                <h3>Implant compilation</h3>
                <p>Compilation must be in release mode</p>
                <img src={six} alt="" srcset="" />
                <p>Set implant data and compile</p>
                <img src={seven} alt="" srcset="" />
                <p>Implant in \bin\Release\Program.exe</p>
                <img src={eight} alt="" srcset="" />
            </div>
            <div className="guide-text-block">
                <h3>Donut compilation</h3>
                <p>Download Donut and extract zip</p>
                <img src={nine} alt="" srcset="" />
                <p>Move implant in Donut folder</p>
                <img src={ten} alt="" srcset="" />
                <p>Compile raw binary</p>
                <img src={eleven} alt="" srcset="" />
            </div>
            <div className="guide-text-block">
                <h3>You can upload the raw binary into a public bucket</h3>
                <img src={twelve} alt="" srcset="" />
            </div>
            <div className="guide-text-block">
                <h3>Compile c++ loader</h3>
                <img src={one} alt="" srcset="" />
                <img src={thirdteen} alt="" srcset="" />
                <img src={fourteen} alt="" srcset="" />
                <img src={fifteen} alt="" srcset="" />
                <img src={sixteen} alt="" srcset="" />
                <img src={seventeen} alt="" srcset="" />
                <img src={eighteen} alt="" srcset="" />
                <img src={nineteen} alt="" srcset="" />

            </div>



        <ToastContainer
          style={{backgroundColor:"transparent"}}
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
